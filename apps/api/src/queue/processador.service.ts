import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { loadEnv } from '../config/env';
import { FILA_MENSAGENS, JobMensagem } from './fila.service';
import { OrquestradorService } from '../conversa/orquestrador.service';

/**
 * Consumidor da fila de mensagens.
 *
 * Roda no processo `worker` (ver docker-compose). Concorrência moderada de
 * propósito: cada job faz chamadas de IA que custam dinheiro e têm limite de
 * taxa no provedor. Vazão se ganha subindo réplicas do worker, não estourando
 * a concorrência de uma só.
 */
@Injectable()
export class ProcessadorMensagens implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProcessadorMensagens.name);
  private worker!: Worker<JobMensagem>;
  private conexao!: Redis;

  constructor(private readonly orquestrador: OrquestradorService) {}

  onModuleInit(): void {
    this.conexao = new Redis(loadEnv().REDIS_URL, { maxRetriesPerRequest: null });

    this.worker = new Worker<JobMensagem>(
      FILA_MENSAGENS,
      async (job: Job<JobMensagem>) => {
        const { mensagem } = job.data;
        this.logger.log(
          `Processando ${mensagem.tipo} de ${mensagem.telefone} (tentativa ${job.attemptsMade + 1}).`,
        );
        await this.orquestrador.processar(mensagem);
      },
      {
        connection: this.conexao,
        concurrency: 5,
        // Teto de segurança contra rajada: 30 jobs/min por worker mantém o
        // custo de IA previsível mesmo se o canteiro inteiro mandar áudio junto.
        limiter: { max: 30, duration: 60_000 },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} concluído.`);
    });

    this.worker.on('failed', (job, erro) => {
      // Esgotou as tentativas: o usuário mandou áudio e nada aconteceu. Fica
      // registrado em nível de erro para virar alerta de operação.
      const esgotou = job && job.attemptsMade >= (job.opts.attempts ?? 1);
      const nivel = esgotou ? 'error' : 'warn';
      this.logger[nivel](`Job ${job?.id} falhou: ${erro.message}`);
    });

    this.logger.log('Worker de mensagens iniciado.');
  }

  async onModuleDestroy(): Promise<void> {
    // Fecha aguardando os jobs ativos: derrubar no meio de uma transcrição
    // deixaria o áudio sem RDO e sem aviso ao usuário.
    await this.worker?.close();
    await this.conexao?.quit();
  }
}
