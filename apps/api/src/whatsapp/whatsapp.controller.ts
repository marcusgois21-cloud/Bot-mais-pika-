import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { loadEnv } from '../config/env';
import { AssinaturaWhatsAppGuard } from './assinatura.guard';
import { FilaMensagens } from '../queue/fila.service';
import { normalizarWebhook, WebhookWhatsApp } from './tipos';
import { DeduplicadorService } from './deduplicador.service';

@Controller('webhook/whatsapp')
@UseGuards(AssinaturaWhatsAppGuard)
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly fila: FilaMensagens,
    private readonly dedup: DeduplicadorService,
  ) {}

  /**
   * Verificação do webhook. A Meta chama uma vez, no cadastro da URL, e espera
   * receber de volta o `hub.challenge` em texto puro.
   */
  @Get()
  verificar(
    @Query('hub.mode') modo: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') desafio: string,
  ): string {
    if (modo === 'subscribe' && token === loadEnv().WHATSAPP_VERIFY_TOKEN) {
      this.logger.log('Webhook verificado pela Meta.');
      return desafio;
    }
    this.logger.warn('Tentativa de verificação de webhook com token inválido.');
    return 'forbidden';
  }

  /**
   * Recebimento de mensagens.
   *
   * Este handler NÃO processa nada: valida, deduplica, enfileira e devolve 200.
   * A Meta espera resposta em poucos segundos e reenvia o payload se demorar —
   * transcrever um áudio aqui geraria reentrega e RDOs duplicados.
   */
  @Post()
  @HttpCode(200)
  @SkipThrottle() // o rate limit de entrada é da Meta; throttling aqui perde mensagem
  async receber(@Body() payload: WebhookWhatsApp): Promise<{ recebido: true }> {
    const mensagens = normalizarWebhook(payload);

    for (const mensagem of mensagens) {
      // A Meta reentrega em caso de timeout ou instabilidade. Sem esta trava,
      // o mesmo áudio viraria dois registros no RDO.
      const novo = await this.dedup.registrarSeNovo(mensagem.waMessageId);
      if (!novo) {
        this.logger.debug(`Mensagem ${mensagem.waMessageId} já processada — ignorada.`);
        continue;
      }

      await this.fila.enfileirar(mensagem);
      this.logger.log(`Mensagem ${mensagem.tipo} de ${mensagem.telefone} enfileirada.`);
    }

    return { recebido: true };
  }
}
