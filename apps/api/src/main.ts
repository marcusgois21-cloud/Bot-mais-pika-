import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { FiltroDeExcecoes } from './common/erros';
import { loadEnv } from './config/env';

async function main(): Promise<void> {
  const logger = new Logger('ObraIA');
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, {
    // Obrigatório: a validação da assinatura da Meta usa o corpo BRUTO.
    // Sem isso, o HMAC nunca confere e todo webhook é rejeitado.
    rawBody: true,
    logger:
      env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug'],
  });

  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === 'production' }));

  app.enableCors({
    origin: env.NODE_ENV === 'production' ? [/\.obraia\.com\.br$/] : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos não declarados no DTO
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(new FiltroDeExcecoes());
  app.setGlobalPrefix('', { exclude: ['health'] });
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(`API no ar em :${env.PORT} (${env.NODE_ENV})`);
  logger.log(`Webhook do WhatsApp: POST /webhook/whatsapp`);
}

void main().catch((erro) => {
  new Logger('ObraIA').error(
    'Falha ao iniciar a API',
    erro instanceof Error ? erro.stack : String(erro),
  );
  process.exit(1);
});
