import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { loadEnv } from '../config/env';

/**
 * Valida o cabeçalho `X-Hub-Signature-256` da Meta.
 *
 * Sem isso, o endpoint do webhook é público e qualquer um pode injetar RDOs
 * falsos na obra de um cliente. A assinatura é HMAC-SHA256 do corpo BRUTO com
 * o app secret — por isso `main.ts` sobe o Nest com `rawBody: true`: o corpo
 * já parseado e re-serializado produz bytes diferentes e a verificação falha.
 */
@Injectable()
export class AssinaturaWhatsAppGuard implements CanActivate {
  private readonly logger = new Logger(AssinaturaWhatsAppGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();

    // A verificação inicial do webhook (GET) não é assinada.
    if (req.method === 'GET') return true;

    const cabecalho = req.header('x-hub-signature-256');
    if (!cabecalho?.startsWith('sha256=')) {
      this.logger.warn('Webhook sem assinatura — rejeitado.');
      return false;
    }

    const corpo = req.rawBody;
    if (!corpo) {
      this.logger.error('rawBody ausente: verifique NestFactory.create(..., { rawBody: true }).');
      return false;
    }

    const esperado = createHmac('sha256', loadEnv().WHATSAPP_APP_SECRET)
      .update(corpo)
      .digest('hex');
    const recebido = cabecalho.slice('sha256='.length);

    // Comparação em tempo constante: comparar string com === vaza informação
    // por timing e permite descobrir a assinatura byte a byte.
    const a = Buffer.from(esperado, 'utf8');
    const b = Buffer.from(recebido, 'utf8');
    if (a.length !== b.length) {
      this.logger.warn('Assinatura de webhook com tamanho inválido — rejeitado.');
      return false;
    }

    const valida = timingSafeEqual(a, b);
    if (!valida) this.logger.warn('Assinatura de webhook inválida — rejeitado.');
    return valida;
  }
}
