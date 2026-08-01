import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { FilaModule } from './queue/fila.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AuthModule } from './auth/auth.module';

import { HealthController } from './health/health.controller';
import { ApiController } from './api/api.controller';
import { BiService } from './bi/bi.service';
import { RdoRepository } from './rdo/rdo.repository';
import { EstoqueService } from './estoque/estoque.service';
import { RelatorioPdfService } from './relatorios/pdf.service';
import { RelatoriosController } from './relatorios/relatorios.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Proteção contra abuso nas rotas do painel. O webhook do WhatsApp é
    // isento (@SkipThrottle) — throttling ali significaria perder mensagem
    // de cliente, não bloquear atacante.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AiModule,
    FilaModule,
    WhatsAppModule,
    AuthModule,
  ],
  controllers: [HealthController, ApiController, RelatoriosController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    BiService,
    RdoRepository,
    EstoqueService,
    RelatorioPdfService,
  ],
})
export class AppModule {}
