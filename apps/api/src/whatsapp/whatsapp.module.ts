import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { DeduplicadorService } from './deduplicador.service';
import { FilaModule } from '../queue/fila.module';

@Module({
  imports: [FilaModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, DeduplicadorService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
