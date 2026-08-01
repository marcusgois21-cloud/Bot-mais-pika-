import { Global, Module } from '@nestjs/common';
import { FilaMensagens } from './fila.service';

@Global()
@Module({
  providers: [FilaMensagens],
  exports: [FilaMensagens],
})
export class FilaModule {}
