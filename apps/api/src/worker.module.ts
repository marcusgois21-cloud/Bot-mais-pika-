import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { FilaModule } from './queue/fila.module';
import { ProcessadorMensagens } from './queue/processador.service';
import { OrquestradorService } from './conversa/orquestrador.service';
import { ConversaService } from './conversa/conversa.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { StorageService } from './storage/storage.service';
import { RdoRepository } from './rdo/rdo.repository';
import { EstoqueService } from './estoque/estoque.service';

/**
 * Módulo do processo worker: sem controllers HTTP, só o consumo da fila e o
 * que ele precisa para transformar mensagem em dado de obra.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AiModule,
    FilaModule,
  ],
  providers: [
    ProcessadorMensagens,
    OrquestradorService,
    ConversaService,
    WhatsAppService,
    StorageService,
    RdoRepository,
    EstoqueService,
  ],
})
export class WorkerModule {}
