import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';

/**
 * Processo dedicado ao consumo da fila.
 *
 * Separado da API porque os dois têm perfis de carga opostos: o webhook é
 * leve, constante e não pode atrasar; a transcrição é pesada, em rajada e
 * tolera latência. Escalar juntos desperdiçaria recurso nos dois lados.
 */
async function main(): Promise<void> {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableShutdownHooks();
  logger.log('ObraIA worker no ar, consumindo a fila de mensagens.');

  const encerrar = async (sinal: string): Promise<void> => {
    logger.log(`${sinal} recebido, encerrando com elegância...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void encerrar('SIGTERM'));
  process.on('SIGINT', () => void encerrar('SIGINT'));
}

void main().catch((erro) => {
  new Logger('Worker').error('Falha ao iniciar o worker', erro instanceof Error ? erro.stack : erro);
  process.exit(1);
});
