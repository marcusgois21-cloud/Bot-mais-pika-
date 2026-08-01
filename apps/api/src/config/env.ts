import { z } from 'zod';

/**
 * Validação de ambiente na subida do processo.
 *
 * A aplicação falha imediatamente se faltar variável obrigatória — é melhor
 * não subir do que subir e descobrir a falta de uma chave às 3h da manhã,
 * no meio do processamento de um áudio.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // WhatsApp Cloud API
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),

  // IA
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default('whisper-1'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa de ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('sa-east-1'),

  MEDIA_RETENTION_DAYS: z.coerce.number().int().min(0).default(180),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const problemas = parsed.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuração inválida:\n${problemas}\n\nVeja .env.example.`);
  }

  const env = parsed.data;

  // Coerência entre provedor de IA e a chave correspondente. O zod sozinho não
  // pega isso porque a obrigatoriedade depende do valor de outro campo.
  if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    throw new Error('AI_PROVIDER=openai exige OPENAI_API_KEY.');
  }
  if (env.AI_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
    throw new Error('AI_PROVIDER=anthropic exige ANTHROPIC_API_KEY.');
  }
  if (env.STORAGE_DRIVER === 's3' && !env.S3_BUCKET) {
    throw new Error('STORAGE_DRIVER=s3 exige S3_BUCKET.');
  }

  cached = env;
  return env;
}

/** Só para testes: descarta o cache entre casos. */
export function resetEnvCache(): void {
  cached = null;
}
