import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { loadEnv } from '../config/env';

/**
 * Trava de idempotência para mensagens do WhatsApp.
 *
 * A Meta reentrega o payload quando não recebe 200 a tempo. Como o
 * processamento é assíncrono, a mesma mensagem pode chegar duas vezes e virar
 * dois lançamentos no RDO. `SET NX` no Redis resolve com uma operação atômica.
 */
@Injectable()
export class DeduplicadorService implements OnModuleDestroy {
  private readonly redis: Redis;
  private static readonly TTL_SEGUNDOS = 60 * 60 * 24; // 24h cobre a janela de retry

  constructor() {
    this.redis = new Redis(loadEnv().REDIS_URL, { maxRetriesPerRequest: null });
  }

  /** Retorna true se a mensagem é nova (e a marca como vista). */
  async registrarSeNovo(waMessageId: string): Promise<boolean> {
    const resultado = await this.redis.set(
      `wa:msg:${waMessageId}`,
      '1',
      'EX',
      DeduplicadorService.TTL_SEGUNDOS,
      'NX',
    );
    return resultado === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
