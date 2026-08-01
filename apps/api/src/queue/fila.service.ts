import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { loadEnv } from '../config/env';
import { MensagemNormalizada } from '../whatsapp/tipos';

export const FILA_MENSAGENS = 'obraia:mensagens';

export interface JobMensagem {
  mensagem: MensagemNormalizada;
}

/**
 * Produtor da fila de mensagens.
 *
 * Separar produção (API) de consumo (worker) permite escalar os dois de forma
 * independente: o webhook é leve e constante; a transcrição é pesada e vem em
 * rajadas no fim do expediente, quando o canteiro inteiro manda áudio junto.
 */
@Injectable()
export class FilaMensagens implements OnModuleDestroy {
  private readonly logger = new Logger(FilaMensagens.name);
  private readonly conexao: Redis;
  private readonly fila: Queue<JobMensagem>;

  constructor() {
    this.conexao = new Redis(loadEnv().REDIS_URL, { maxRetriesPerRequest: null });
    this.fila = new Queue<JobMensagem>(FILA_MENSAGENS, {
      connection: this.conexao,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 3600, count: 1000 },
        // Falhas ficam retidas por 7 dias: é o material de diagnóstico quando
        // um mestre reclama que "mandei o áudio e não apareceu".
        removeOnFail: { age: 60 * 60 * 24 * 7 },
      },
    });
  }

  async enfileirar(mensagem: MensagemNormalizada): Promise<void> {
    await this.fila.add('processar', { mensagem }, { jobId: mensagem.waMessageId });
    this.logger.debug(`Job ${mensagem.waMessageId} enfileirado.`);
  }

  async estatisticas(): Promise<Record<string, number>> {
    return this.fila.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  }

  async onModuleDestroy(): Promise<void> {
    await this.fila.close();
    await this.conexao.quit();
  }
}
