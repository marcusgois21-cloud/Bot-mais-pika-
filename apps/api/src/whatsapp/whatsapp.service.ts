import { Injectable, Logger } from '@nestjs/common';
import { loadEnv } from '../config/env';

/**
 * Cliente da WhatsApp Cloud API: envia mensagens e baixa mídia.
 *
 * Sobre a janela de 24h da Meta: respostas a uma mensagem do usuário são
 * livres dentro de 24h. Fora dela (alerta de estoque às 6h, relatório
 * semanal), só passa `template` previamente aprovado — daí o método
 * `enviarTemplate` existir separado, e não como detalhe de `enviarTexto`.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  private get base(): string {
    const env = loadEnv();
    return `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${loadEnv().WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async enviarTexto(para: string, texto: string): Promise<string | null> {
    return this.enviar(para, {
      type: 'text',
      text: { preview_url: true, body: this.truncar(texto, 4096) },
    });
  }

  /**
   * Botões de resposta rápida. No canteiro, tocar num botão é muito mais
   * viável que digitar — especialmente de luva e sob sol.
   * A Meta limita a 3 botões e 20 caracteres por título.
   */
  async enviarBotoes(
    para: string,
    corpo: string,
    botoes: Array<{ id: string; titulo: string }>,
  ): Promise<string | null> {
    return this.enviar(para, {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: this.truncar(corpo, 1024) },
        action: {
          buttons: botoes.slice(0, 3).map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: this.truncar(b.titulo, 20) },
          })),
        },
      },
    });
  }

  async enviarDocumento(
    para: string,
    url: string,
    nomeArquivo: string,
    legenda?: string,
  ): Promise<string | null> {
    return this.enviar(para, {
      type: 'document',
      document: { link: url, filename: nomeArquivo, caption: legenda },
    });
  }

  /** Mensagem proativa fora da janela de 24h. Exige template aprovado. */
  async enviarTemplate(
    para: string,
    nomeTemplate: string,
    idioma = 'pt_BR',
    parametros: string[] = [],
  ): Promise<string | null> {
    return this.enviar(para, {
      type: 'template',
      template: {
        name: nomeTemplate,
        language: { code: idioma },
        components: parametros.length
          ? [{ type: 'body', parameters: parametros.map((p) => ({ type: 'text', text: p })) }]
          : undefined,
      },
    });
  }

  /** Marca como lida — o visto azul sinaliza ao usuário que o sistema recebeu. */
  async marcarComoLida(waMessageId: string): Promise<void> {
    const env = loadEnv();
    await this.requisitar(`${this.base}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: waMessageId,
      }),
    }).catch((e) => this.logger.debug(`Falha ao marcar como lida: ${e.message}`));
  }

  /**
   * Baixa mídia em duas etapas: resolve o media_id para uma URL temporária e
   * então busca os bytes (a URL exige o mesmo Bearer token).
   */
  async baixarMidia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const meta = await this.requisitar(`${this.base}/${mediaId}`, { headers: this.headers });
    const info = (await meta.json()) as { url: string; mime_type: string };

    const arquivo = await this.requisitar(info.url, {
      headers: { Authorization: `Bearer ${loadEnv().WHATSAPP_ACCESS_TOKEN}` },
    });

    return {
      buffer: Buffer.from(await arquivo.arrayBuffer()),
      mimeType: info.mime_type,
    };
  }

  private async enviar(para: string, conteudo: Record<string, unknown>): Promise<string | null> {
    const env = loadEnv();
    try {
      const resposta = await this.requisitar(
        `${this.base}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: para,
            ...conteudo,
          }),
        },
      );
      const dados = (await resposta.json()) as { messages?: Array<{ id: string }> };
      return dados.messages?.[0]?.id ?? null;
    } catch (erro) {
      // Falha de envio não pode derrubar o processamento: o RDO já foi salvo.
      // Perder a confirmação é ruim; perder o registro seria pior.
      this.logger.error(`Falha ao enviar para ${para}: ${(erro as Error).message}`);
      return null;
    }
  }

  /** fetch com retentativa exponencial em erro transitório (429 / 5xx). */
  private async requisitar(
    url: string,
    init: RequestInit,
    tentativas = 3,
  ): Promise<Response> {
    let ultimoErro: Error | null = null;

    for (let i = 0; i < tentativas; i++) {
      try {
        const resposta = await fetch(url, {
          ...init,
          signal: AbortSignal.timeout(30_000),
        });

        if (resposta.ok) return resposta;

        const transitorio = resposta.status === 429 || resposta.status >= 500;
        const corpo = await resposta.text();
        ultimoErro = new Error(`HTTP ${resposta.status}: ${corpo.slice(0, 300)}`);

        if (!transitorio) throw ultimoErro;
      } catch (erro) {
        ultimoErro = erro as Error;
        if (erro instanceof Error && erro.message.startsWith('HTTP 4') && !erro.message.startsWith('HTTP 429')) {
          throw erro;
        }
      }

      if (i < tentativas - 1) {
        await new Promise((r) => setTimeout(r, 2 ** i * 1000));
      }
    }

    throw ultimoErro ?? new Error('Falha desconhecida na requisição.');
  }

  private truncar(texto: string, limite: number): string {
    return texto.length <= limite ? texto : `${texto.slice(0, limite - 1)}…`;
  }
}
