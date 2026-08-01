import { Injectable, Logger } from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import { loadEnv } from '../config/env';

/**
 * Abstração fina sobre o provedor de IA.
 *
 * Existe por dois motivos concretos, não por purismo de arquitetura:
 *  - trocar de provedor (ou cair para um secundário quando o primário está
 *    fora) sem tocar na regra de negócio;
 *  - poder testar extração e transcrição com um dublê, sem chamar API paga.
 */
export interface ChamadaFuncao {
  nome: string;
  argumentos: Record<string, unknown>;
}

export interface ProvedorIA {
  transcrever(audio: Buffer, mimeType: string): Promise<string>;
  chamarComFuncao(
    prompt: string,
    mensagens: Array<{ papel: 'user' | 'assistant'; texto: string }>,
    funcao: Record<string, unknown>,
  ): Promise<ChamadaFuncao | null>;
  analisarImagem(imagem: Buffer, mimeType: string, instrucao: string): Promise<string>;
}

@Injectable()
export class ProvedorOpenAI implements ProvedorIA {
  private readonly logger = new Logger(ProvedorOpenAI.name);
  private readonly cliente: OpenAI;

  constructor() {
    const env = loadEnv();
    this.cliente = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 120_000, // áudio longo de canteiro pode passar de 1 min
    });
  }

  async transcrever(audio: Buffer, mimeType: string): Promise<string> {
    const env = loadEnv();
    const extensao = this.extensaoDe(mimeType);

    const resposta = await this.cliente.audio.transcriptions.create({
      file: await toFile(audio, `audio.${extensao}`, { type: mimeType }),
      model: env.OPENAI_TRANSCRIPTION_MODEL,
      language: 'pt',
      // O prompt enviesa o vocabulário do decoder. Sem isso, "vergalhão" vira
      // "vergalhao"/"ver galhão" e "FCK" vira "efe cê ká" em áudio com ruído.
      prompt:
        'Relato de obra da construção civil: concretagem, alvenaria, laje, vergalhão, ' +
        'argamassa, fôrma, escoramento, baldrame, radier, sapata, viga, pilar, ' +
        'metro cúbico, saco de cimento, EPI, capacete, andaime, betoneira.',
    });

    return resposta.text.trim();
  }

  async chamarComFuncao(
    prompt: string,
    mensagens: Array<{ papel: 'user' | 'assistant'; texto: string }>,
    funcao: Record<string, unknown>,
  ): Promise<ChamadaFuncao | null> {
    const env = loadEnv();

    const resposta = await this.cliente.chat.completions.create({
      model: env.OPENAI_MODEL,
      // Temperatura baixa: extração é tarefa determinística. Criatividade aqui
      // seria exatamente o defeito que estamos tentando evitar.
      temperature: 0.1,
      messages: [
        { role: 'system', content: prompt },
        ...mensagens.map((m) => ({
          role: m.papel === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.texto,
        })),
      ],
      tools: [{ type: 'function', function: funcao as never }],
      tool_choice: { type: 'function', function: { name: funcao.name as string } },
    });

    const chamada = resposta.choices[0]?.message?.tool_calls?.[0];
    if (!chamada || chamada.type !== 'function') return null;

    try {
      return {
        nome: chamada.function.name,
        argumentos: JSON.parse(chamada.function.arguments) as Record<string, unknown>,
      };
    } catch (erro) {
      this.logger.error(`JSON inválido do modelo: ${(erro as Error).message}`);
      return null;
    }
  }

  async analisarImagem(imagem: Buffer, mimeType: string, instrucao: string): Promise<string> {
    const env = loadEnv();
    const resposta = await this.cliente.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: instrucao },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imagem.toString('base64')}` },
            },
          ],
        },
      ],
    });
    return resposta.choices[0]?.message?.content?.trim() ?? '';
  }

  private extensaoDe(mimeType: string): string {
    const mapa: Record<string, string> = {
      'audio/ogg': 'ogg',
      'audio/opus': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/amr': 'amr',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
    };
    // O WhatsApp manda "audio/ogg; codecs=opus" — o parâmetro extra quebra o match.
    return mapa[mimeType.split(';')[0].trim()] ?? 'ogg';
  }
}
