import { createHmac } from 'node:crypto';
import { ExecutionContext } from '@nestjs/common';
import { AssinaturaWhatsAppGuard } from './assinatura.guard';
import { resetEnvCache } from '../config/env';

const SEGREDO = 'segredo-de-teste';

function contexto(opcoes: {
  method?: string;
  rawBody?: Buffer;
  assinatura?: string;
}): ExecutionContext {
  const req = {
    method: opcoes.method ?? 'POST',
    rawBody: opcoes.rawBody,
    header: (nome: string) =>
      nome.toLowerCase() === 'x-hub-signature-256' ? opcoes.assinatura : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function assinar(corpo: Buffer): string {
  return `sha256=${createHmac('sha256', SEGREDO).update(corpo).digest('hex')}`;
}

describe('AssinaturaWhatsAppGuard', () => {
  let guard: AssinaturaWhatsAppGuard;

  beforeEach(() => {
    resetEnvCache();
    Object.assign(process.env, {
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      WHATSAPP_PHONE_NUMBER_ID: '1',
      WHATSAPP_ACCESS_TOKEN: 'token',
      WHATSAPP_APP_SECRET: SEGREDO,
      WHATSAPP_VERIFY_TOKEN: 'verify',
      OPENAI_API_KEY: 'sk-teste',
      JWT_SECRET: 'segredo-jwt-bem-longo-para-teste',
    });
    guard = new AssinaturaWhatsAppGuard();
  });

  it('aceita payload com assinatura correta', () => {
    const corpo = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
    expect(guard.canActivate(contexto({ rawBody: corpo, assinatura: assinar(corpo) }))).toBe(true);
  });

  it('rejeita quando o corpo foi adulterado depois de assinado', () => {
    const original = Buffer.from(JSON.stringify({ valor: 'legitimo' }));
    const adulterado = Buffer.from(JSON.stringify({ valor: 'injetado' }));
    expect(
      guard.canActivate(contexto({ rawBody: adulterado, assinatura: assinar(original) })),
    ).toBe(false);
  });

  it('rejeita requisição sem cabeçalho de assinatura', () => {
    const corpo = Buffer.from('{}');
    expect(guard.canActivate(contexto({ rawBody: corpo }))).toBe(false);
  });

  it('rejeita assinatura com prefixo inválido', () => {
    const corpo = Buffer.from('{}');
    expect(guard.canActivate(contexto({ rawBody: corpo, assinatura: 'sha1=abc' }))).toBe(false);
  });

  it('rejeita quando rawBody não foi capturado (erro de configuração do Nest)', () => {
    const corpo = Buffer.from('{}');
    expect(guard.canActivate(contexto({ assinatura: assinar(corpo) }))).toBe(false);
  });

  it('libera o GET de verificação, que a Meta não assina', () => {
    expect(guard.canActivate(contexto({ method: 'GET' }))).toBe(true);
  });
});
