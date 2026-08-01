import { Inject, Injectable, Logger } from '@nestjs/common';
import { PROVEDOR_IA, type ProvedorIA } from './ai.tokens';

@Injectable()
export class TranscricaoService {
  private readonly logger = new Logger(TranscricaoService.name);

  /** Áudio de canteiro raramente passa disso; acima é quase certo engano. */
  private static readonly TAMANHO_MAXIMO = 25 * 1024 * 1024; // 25 MB

  constructor(@Inject(PROVEDOR_IA) private readonly ia: ProvedorIA) {}

  async transcrever(audio: Buffer, mimeType: string): Promise<string> {
    if (audio.length > TranscricaoService.TAMANHO_MAXIMO) {
      throw new Error('Áudio acima do limite de 25 MB.');
    }
    if (audio.length < 1024) {
      throw new Error('Áudio curto ou vazio.');
    }

    const inicio = Date.now();
    const bruta = await this.ia.transcrever(audio, mimeType);
    this.logger.log(`Áudio transcrito em ${Date.now() - inicio}ms (${audio.length} bytes).`);

    return this.limpar(bruta);
  }

  /**
   * Correções determinísticas de transcrição.
   *
   * O Whisper erra de forma previsível no vocabulário de obra. Corrigir por
   * regra aqui é mais barato e mais confiável do que gastar uma chamada de LLM
   * para consertar "vergalhão" — e não corre o risco de reescrever o conteúdo.
   */
  private limpar(texto: string): string {
    const correcoes: Array<[RegExp, string]> = [
      [/\bver\s*galh[ãa]o\b/gi, 'vergalhão'],
      [/\bconcreta\s*gem\b/gi, 'concretagem'],
      [/\bcon\s*cretagem\b/gi, 'concretagem'],
      [/\barga\s*massa\b/gi, 'argamassa'],
      [/\bal\s*venaria\b/gi, 'alvenaria'],
      [/\bes\s*coramento\b/gi, 'escoramento'],
      [/\bef[eé]\s*c[eê]\s*k[aá]\b/gi, 'FCK'],
      [/\bcep\s*dois\b/gi, 'CP-II'],
      [/\bc[aá]\s*cinquenta\b/gi, 'CA-50'],
      [/\bepi[cs]?\b/gi, 'EPI'],
      [/\bmetro\s*c[uú]bico\b/gi, 'm³'],
    ];

    let saida = texto.replace(/\s+/g, ' ').trim();
    for (const [de, para] of correcoes) saida = saida.replace(de, para);

    // Maiúscula inicial ajuda o LLM a tratar como frase, não como fragmento.
    return saida.charAt(0).toUpperCase() + saida.slice(1);
  }
}
