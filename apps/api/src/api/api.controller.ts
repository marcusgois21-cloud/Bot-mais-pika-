import { Controller, Get, Param, ParseUUIDPipe, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PayloadToken } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { BiService } from '../bi/bi.service';
import { RdoRepository } from '../rdo/rdo.repository';
import { EstoqueService } from '../estoque/estoque.service';
import { ErroDeDominio } from '../common/erros';

type Req = { user: PayloadToken };

/**
 * API do painel web.
 *
 * O tenant vem sempre de `req.user.empresaId` — do token assinado, nunca de
 * parâmetro de rota ou query. Um `?empresaId=` na URL seria um convite a
 * acessar dados de outro cliente.
 */
@Controller('api')
@UseGuards(AuthGuard('jwt'))
export class ApiController {
  constructor(
    private readonly db: DatabaseService,
    private readonly bi: BiService,
    private readonly rdos: RdoRepository,
    private readonly estoque: EstoqueService,
  ) {}

  @Get('painel')
  painel(@Request() req: Req) {
    return this.bi.painel(req.user.empresaId);
  }

  @Get('obras')
  obras(@Request() req: Req) {
    return this.db.comTenant(req.user.empresaId, (tx) =>
      tx.query(
        `SELECT o.id, o.nome, o.endereco, o.status, o.area_m2::text,
                o.data_inicio::text, o.data_prevista::text,
                c.nome AS cliente,
                (SELECT max(data)::text FROM rdos r WHERE r.obra_id = o.id) AS ultimo_rdo
           FROM obras o
           LEFT JOIN clientes c ON c.id = o.cliente_id
          ORDER BY o.status, o.nome`,
      ),
    );
  }

  @Get('obras/:id')
  async obra(@Request() req: Req, @Param('id', ParseUUIDPipe) id: string) {
    const indicadores = await this.bi.indicadores(req.user.empresaId, id);
    if (!indicadores) throw new ErroDeDominio('Obra não encontrada.', 404);

    const [rdos, cronograma, estoque] = await Promise.all([
      this.rdos.listarPorObra(req.user.empresaId, id, 20),
      this.db.comTenant(req.user.empresaId, (tx) =>
        tx.query(
          `SELECT nome, ordem, previsto_inicio::text, previsto_fim::text,
                  real_inicio::text, real_fim::text, percentual::text, peso::text
             FROM cronograma_etapas WHERE obra_id = $1 ORDER BY ordem`,
          [id],
        ),
      ),
      this.db.comTenant(req.user.empresaId, (tx) => this.estoque.saldosDaObra(tx, id)),
    ]);

    return { indicadores, rdos, cronograma, estoque };
  }

  @Get('obras/:id/fotos')
  fotos(@Request() req: Req, @Param('id', ParseUUIDPipe) id: string) {
    return this.db.comTenant(req.user.empresaId, (tx) =>
      tx.query(
        `SELECT id, url, etapa, legenda, tirada_em
           FROM fotos WHERE obra_id = $1 ORDER BY tirada_em DESC LIMIT 200`,
        [id],
      ),
    );
  }

  @Get('rdos/:id')
  async rdo(@Request() req: Req, @Param('id', ParseUUIDPipe) id: string) {
    const completo = await this.rdos.carregarCompleto(req.user.empresaId, id);
    if (!completo) throw new ErroDeDominio('RDO não encontrado.', 404);
    return completo;
  }

  /**
   * Histórico de conversas. Mostra ao engenheiro a origem de cada dado do RDO:
   * o áudio que o mestre mandou e o que a IA entendeu dele.
   */
  @Get('conversas')
  conversas(@Request() req: Req, @Query('telefone') telefone?: string) {
    return this.db.comTenant(req.user.empresaId, (tx) =>
      telefone
        ? tx.query(
            `SELECT m.direcao, m.tipo, m.conteudo, m.media_url, m.criado_em
               FROM mensagens m JOIN conversas c ON c.id = m.conversa_id
              WHERE c.telefone = $1 ORDER BY m.criado_em DESC LIMIT 100`,
            [telefone],
          )
        : tx.query(
            `SELECT c.telefone, u.nome, c.atualizado_em,
                    (SELECT conteudo FROM mensagens m
                      WHERE m.conversa_id = c.id ORDER BY m.criado_em DESC LIMIT 1) AS ultima
               FROM conversas c LEFT JOIN usuarios u ON u.id = c.usuario_id
              ORDER BY c.atualizado_em DESC LIMIT 50`,
          ),
    );
  }

  @Get('registros-voz')
  registrosVoz(@Request() req: Req) {
    return this.db.comTenant(req.user.empresaId, (tx) =>
      tx.query(
        `SELECT rv.id, rv.transcricao, rv.status, rv.criado_em,
                o.nome AS obra, u.nome AS autor
           FROM registros_voz rv
           LEFT JOIN obras o ON o.id = rv.obra_id
           LEFT JOIN usuarios u ON u.id = rv.usuario_id
          ORDER BY rv.criado_em DESC LIMIT 50`,
      ),
    );
  }
}
