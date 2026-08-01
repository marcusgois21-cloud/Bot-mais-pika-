import { Controller, Get, Param, ParseUUIDPipe, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PayloadToken } from '../auth/auth.service';
import { RdoRepository } from '../rdo/rdo.repository';
import { RelatorioPdfService } from './pdf.service';
import { ErroDeDominio } from '../common/erros';

@Controller('relatorios')
@UseGuards(AuthGuard('jwt'))
export class RelatoriosController {
  constructor(
    private readonly rdos: RdoRepository,
    private readonly pdf: RelatorioPdfService,
  ) {}

  @Get('rdo/:id.pdf')
  async rdoPdf(
    @Request() req: { user: PayloadToken },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const dados = await this.rdos.carregarCompleto(req.user.empresaId, id);
    if (!dados) throw new ErroDeDominio('RDO não encontrado.', 404);

    const arquivo = await this.pdf.gerarRdo(dados);
    const nome = `RDO_${dados.rdo.obra_nome.replace(/[^\w]+/g, '_')}_${dados.rdo.data}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nome}"`,
      'Content-Length': String(arquivo.length),
    });
    res.end(arquivo);
  }
}
