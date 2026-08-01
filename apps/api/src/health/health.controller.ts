import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseService } from '../database/database.service';
import { FilaMensagens } from '../queue/fila.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly fila: FilaMensagens,
  ) {}

  /**
   * Usado pelo Docker/Kubernetes. Reporta status agregado e as estatísticas da
   * fila — número alto em `waiting` é o primeiro sinal de que os workers
   * caíram ou não estão dando conta.
   */
  @Get()
  async verificar() {
    const [banco, fila] = await Promise.all([
      this.db.saudavel(),
      this.fila.estatisticas().catch(() => null),
    ]);

    return {
      status: banco && fila ? 'ok' : 'degradado',
      banco: banco ? 'ok' : 'indisponivel',
      fila: fila ?? 'indisponivel',
      em: new Date().toISOString(),
    };
  }
}
