import { Global, Module } from '@nestjs/common';
import { ProvedorOpenAI } from './provedor';
import { PROVEDOR_IA } from './ai.tokens';
import { TranscricaoService } from './transcricao.service';
import { ExtracaoService } from './extracao.service';
import { VisaoService } from './visao.service';

/**
 * O provedor é injetado por token, não por classe concreta: trocar de modelo
 * ou dublar a IA nos testes não exige tocar em nenhum serviço de domínio.
 */
@Global()
@Module({
  providers: [
    { provide: PROVEDOR_IA, useClass: ProvedorOpenAI },
    TranscricaoService,
    ExtracaoService,
    VisaoService,
  ],
  exports: [PROVEDOR_IA, TranscricaoService, ExtracaoService, VisaoService],
})
export class AiModule {}
