import { Injectable } from '@nestjs/common';
import { DatabaseService, TenantClient } from '../database/database.service';
import { ExtracaoRDO } from '../ai/esquema';

export interface RDO {
  id: string;
  obra_id: string;
  data: string;
  status: 'rascunho' | 'publicado' | 'aprovado';
  clima: string | null;
  efetivo_total: number | null;
  horas_trabalhadas: string | null;
  observacoes: string | null;
  proximas_atividades: string[] | null;
  pdf_url: string | null;
}

@Injectable()
export class RdoRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Obtém o RDO do dia ou cria um rascunho.
   *
   * A obra tem um RDO por dia (constraint UNIQUE). Vários áudios ao longo do
   * dia — o que é o comportamento real do canteiro — se acumulam no mesmo
   * relatório em vez de gerarem documentos concorrentes.
   */
  async obterOuCriarDoDia(
    tx: TenantClient,
    obraId: string,
    data: string,
    autorId: string | null,
  ): Promise<RDO> {
    const existente = await tx.um<RDO>(
      `SELECT id, obra_id, data::text, status, clima, efetivo_total,
              horas_trabalhadas::text, observacoes, proximas_atividades, pdf_url
         FROM rdos WHERE obra_id = $1 AND data = $2`,
      [obraId, data],
    );
    if (existente) return existente;

    const criado = await tx.um<RDO>(
      `INSERT INTO rdos (empresa_id, obra_id, autor_id, data, status)
       VALUES ($1, $2, $3, $4, 'rascunho')
       ON CONFLICT (obra_id, data) DO UPDATE SET atualizado_em = now()
       RETURNING id, obra_id, data::text, status, clima, efetivo_total,
                 horas_trabalhadas::text, observacoes, proximas_atividades, pdf_url`,
      [tx.empresaId, obraId, autorId, data],
    );

    if (!criado) throw new Error('Falha ao criar RDO.');
    return criado;
  }

  /**
   * Aplica a extração da IA sobre o RDO.
   *
   * Atividades, mão de obra e equipamentos são acumulados (o dia tem várias
   * frentes). Campos escalares só são preenchidos se ainda estiverem vazios —
   * assim um segundo áudio complementa o RDO sem sobrescrever o que o primeiro
   * já registrou.
   */
  async aplicarExtracao(tx: TenantClient, rdoId: string, dados: ExtracaoRDO): Promise<void> {
    for (const [i, atividade] of dados.atividades.entries()) {
      await tx.query(
        `INSERT INTO rdo_atividades (rdo_id, etapa, local, descricao, quantidade, unidade, ordem)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          rdoId,
          atividade.etapa,
          atividade.local,
          atividade.descricao,
          atividade.quantidade,
          atividade.unidade,
          i,
        ],
      );
    }

    for (const equipe of dados.mao_de_obra) {
      await tx.query(
        `INSERT INTO rdo_mao_de_obra (rdo_id, funcao, quantidade, horas)
         VALUES ($1, $2, $3, $4)`,
        [rdoId, equipe.funcao, equipe.quantidade, dados.horas_trabalhadas],
      );
    }

    for (const equipamento of dados.equipamentos) {
      await tx.query(`INSERT INTO rdo_equipamentos (rdo_id, nome) VALUES ($1, $2)`, [
        rdoId,
        equipamento,
      ]);
    }

    const efetivo = dados.mao_de_obra.reduce((soma, m) => soma + m.quantidade, 0);

    await tx.query(
      `UPDATE rdos SET
         clima              = COALESCE(clima, $2),
         efetivo_total      = COALESCE(efetivo_total, NULLIF($3, 0)),
         horas_trabalhadas  = COALESCE(horas_trabalhadas, $4),
         observacoes        = COALESCE(NULLIF(observacoes, ''), $5),
         proximas_atividades = CASE
           WHEN $6::text[] IS NULL OR cardinality($6::text[]) = 0 THEN proximas_atividades
           ELSE $6::text[]
         END
       WHERE id = $1`,
      [
        rdoId,
        dados.clima,
        efetivo,
        dados.horas_trabalhadas,
        dados.observacoes,
        dados.proximas_atividades.length ? dados.proximas_atividades : null,
      ],
    );
  }

  async registrarOcorrencias(
    tx: TenantClient,
    rdoId: string,
    obraId: string,
    dados: ExtracaoRDO,
  ): Promise<number> {
    let total = 0;
    for (const oc of dados.ocorrencias) {
      await tx.query(
        `INSERT INTO ocorrencias (empresa_id, obra_id, rdo_id, tipo, gravidade, descricao, epi_citado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tx.empresaId, obraId, rdoId, oc.tipo, oc.gravidade, oc.descricao, oc.epi_citado],
      );
      total++;
    }
    return total;
  }

  async publicar(tx: TenantClient, rdoId: string): Promise<void> {
    await tx.query(`UPDATE rdos SET status = 'publicado' WHERE id = $1 AND status = 'rascunho'`, [
      rdoId,
    ]);
  }

  async definirPdf(tx: TenantClient, rdoId: string, url: string): Promise<void> {
    await tx.query(`UPDATE rdos SET pdf_url = $2 WHERE id = $1`, [rdoId, url]);
  }

  /** RDO completo para renderizar em PDF ou exibir no painel. */
  async carregarCompleto(empresaId: string, rdoId: string): Promise<RdoCompleto | null> {
    return this.db.comTenant(empresaId, async (tx) => {
      const rdo = await tx.um<RdoCompleto['rdo'] & { obra_nome: string; autor_nome: string | null }>(
        `SELECT r.id, r.data::text, r.status, r.clima, r.efetivo_total,
                r.horas_trabalhadas::text, r.observacoes, r.proximas_atividades, r.pdf_url,
                o.nome AS obra_nome, o.endereco, u.nome AS autor_nome
           FROM rdos r
           JOIN obras o ON o.id = r.obra_id
           LEFT JOIN usuarios u ON u.id = r.autor_id
          WHERE r.id = $1`,
        [rdoId],
      );
      if (!rdo) return null;

      const [atividades, maoDeObra, equipamentos, ocorrencias, fotos] = await Promise.all([
        tx.query(`SELECT etapa, local, descricao, quantidade::text, unidade
                    FROM rdo_atividades WHERE rdo_id = $1 ORDER BY ordem`, [rdoId]),
        tx.query(`SELECT funcao, quantidade, horas::text FROM rdo_mao_de_obra WHERE rdo_id = $1`, [rdoId]),
        tx.query(`SELECT nome, horas::text FROM rdo_equipamentos WHERE rdo_id = $1`, [rdoId]),
        tx.query(`SELECT tipo, gravidade, descricao FROM ocorrencias WHERE rdo_id = $1`, [rdoId]),
        tx.query(`SELECT url, etapa, legenda FROM fotos WHERE rdo_id = $1 ORDER BY tirada_em`, [rdoId]),
      ]);

      return {
        rdo,
        atividades,
        maoDeObra,
        equipamentos,
        ocorrencias,
        fotos,
      } as RdoCompleto;
    });
  }

  async listarPorObra(empresaId: string, obraId: string, limite = 30): Promise<RDO[]> {
    return this.db.comTenant(empresaId, (tx) =>
      tx.query<RDO>(
        `SELECT id, obra_id, data::text, status, clima, efetivo_total,
                horas_trabalhadas::text, observacoes, proximas_atividades, pdf_url
           FROM rdos WHERE obra_id = $1 ORDER BY data DESC LIMIT $2`,
        [obraId, limite],
      ),
    );
  }
}

export interface RdoCompleto {
  rdo: {
    id: string;
    data: string;
    status: string;
    clima: string | null;
    efetivo_total: number | null;
    horas_trabalhadas: string | null;
    observacoes: string | null;
    proximas_atividades: string[] | null;
    pdf_url: string | null;
    obra_nome: string;
    endereco: string | null;
    autor_nome: string | null;
  };
  atividades: Array<Record<string, unknown>>;
  maoDeObra: Array<Record<string, unknown>>;
  equipamentos: Array<Record<string, unknown>>;
  ocorrencias: Array<Record<string, unknown>>;
  fotos: Array<Record<string, unknown>>;
}
