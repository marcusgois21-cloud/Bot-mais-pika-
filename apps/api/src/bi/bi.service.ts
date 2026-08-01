import { Injectable } from '@nestjs/common';
import { DatabaseService, TenantClient } from '../database/database.service';

export interface IndicadoresObra {
  obraId: string;
  nome: string;
  custoTotal: number;
  custoPorM2: number | null;
  avancoFisico: number; // % ponderado pela curva S
  avancoPrevisto: number;
  desvioPrazoDias: number;
  previsaoTermino: string | null;
  rdosNoMes: number;
  ocorrenciasAbertas: number;
  materiaisAbaixoMinimo: number;
}

@Injectable()
export class BiService {
  constructor(private readonly db: DatabaseService) {}

  async painel(empresaId: string): Promise<{
    obrasAtivas: number;
    custoMedioM2: number | null;
    rdosHoje: { registrados: number; esperados: number };
    alertas: Alerta[];
    produtividade: Array<{ semana: string; rdos: number }>;
  }> {
    return this.db.comTenant(empresaId, async (tx) => {
      const [resumo] = await tx.query<{ obras_ativas: string; custo_medio: string | null }>(
        `SELECT
           count(*) FILTER (WHERE status = 'em_andamento')::text AS obras_ativas,
           avg(NULLIF(custo.total, 0) / NULLIF(o.area_m2, 0))::text AS custo_medio
         FROM obras o
         LEFT JOIN LATERAL (
           SELECT COALESCE(sum(valor), 0) AS total
             FROM financeiro_lancamentos f
            WHERE f.obra_id = o.id AND f.tipo = 'custo'
         ) custo ON TRUE`,
      );

      const [rdos] = await tx.query<{ registrados: string; esperados: string }>(
        `SELECT
           (SELECT count(*) FROM rdos WHERE data = CURRENT_DATE)::text AS registrados,
           (SELECT count(*) FROM obras WHERE status = 'em_andamento')::text AS esperados`,
      );

      const produtividade = await tx.query<{ semana: string; rdos: string }>(
        `SELECT to_char(date_trunc('week', data), 'DD/MM') AS semana, count(*)::text AS rdos
           FROM rdos
          WHERE data >= CURRENT_DATE - INTERVAL '6 weeks'
          GROUP BY 1, date_trunc('week', data)
          ORDER BY date_trunc('week', data)`,
      );

      return {
        obrasAtivas: Number(resumo?.obras_ativas ?? 0),
        custoMedioM2: resumo?.custo_medio ? Number(resumo.custo_medio) : null,
        rdosHoje: {
          registrados: Number(rdos?.registrados ?? 0),
          esperados: Number(rdos?.esperados ?? 0),
        },
        alertas: await this.alertas(tx),
        produtividade: produtividade.map((p) => ({ semana: p.semana, rdos: Number(p.rdos) })),
      };
    });
  }

  /**
   * Indicadores de uma obra.
   *
   * O avanço físico é ponderado pelo peso de cada etapa (curva S) — média
   * simples trataria "acabamento" e "fundação" como equivalentes, o que
   * distorce o percentual da obra inteira.
   */
  async indicadores(empresaId: string, obraId: string): Promise<IndicadoresObra | null> {
    return this.db.comTenant(empresaId, async (tx) => {
      const obra = await tx.um<{
        id: string;
        nome: string;
        area_m2: string | null;
        data_inicio: string | null;
        data_prevista: string | null;
      }>(
        `SELECT id, nome, area_m2::text, data_inicio::text, data_prevista::text
           FROM obras WHERE id = $1`,
        [obraId],
      );
      if (!obra) return null;

      const [custo] = await tx.query<{ total: string }>(
        `SELECT COALESCE(sum(valor), 0)::text AS total
           FROM financeiro_lancamentos WHERE obra_id = $1 AND tipo = 'custo'`,
        [obraId],
      );

      const [avanco] = await tx.query<{ real: string | null; previsto: string | null }>(
        `SELECT
           (sum(percentual * peso) / NULLIF(sum(peso), 0))::text AS real,
           (sum(
              CASE
                WHEN CURRENT_DATE >= previsto_fim THEN 100
                WHEN CURRENT_DATE <= previsto_inicio THEN 0
                ELSE 100.0 * (CURRENT_DATE - previsto_inicio)
                     / NULLIF(previsto_fim - previsto_inicio, 0)
              END * peso
            ) / NULLIF(sum(peso), 0))::text AS previsto
         FROM cronograma_etapas WHERE obra_id = $1`,
        [obraId],
      );

      const [contagens] = await tx.query<{
        rdos_mes: string;
        ocorrencias: string;
        materiais_baixos: string;
      }>(
        `SELECT
           (SELECT count(*) FROM rdos
             WHERE obra_id = $1 AND data >= date_trunc('month', CURRENT_DATE))::text AS rdos_mes,
           (SELECT count(*) FROM ocorrencias
             WHERE obra_id = $1 AND NOT resolvida)::text AS ocorrencias,
           (SELECT count(*) FROM estoque_saldo
             WHERE obra_id = $1 AND saldo < estoque_min)::text AS materiais_baixos`,
        [obraId],
      );

      const avancoReal = Number(avanco?.real ?? 0);
      const avancoPrevisto = Number(avanco?.previsto ?? 0);
      const custoTotal = Number(custo?.total ?? 0);
      const area = obra.area_m2 ? Number(obra.area_m2) : null;

      return {
        obraId: obra.id,
        nome: obra.nome,
        custoTotal,
        custoPorM2: area && area > 0 ? custoTotal / area : null,
        avancoFisico: Number(avancoReal.toFixed(2)),
        avancoPrevisto: Number(avancoPrevisto.toFixed(2)),
        desvioPrazoDias: this.estimarDesvio(obra, avancoReal, avancoPrevisto),
        previsaoTermino: this.projetarTermino(obra, avancoReal),
        rdosNoMes: Number(contagens?.rdos_mes ?? 0),
        ocorrenciasAbertas: Number(contagens?.ocorrencias ?? 0),
        materiaisAbaixoMinimo: Number(contagens?.materiais_baixos ?? 0),
      };
    });
  }

  /**
   * Projeta o término extrapolando o ritmo observado até aqui.
   *
   * É uma projeção linear deliberadamente simples: com poucos meses de dado,
   * um modelo mais elaborado daria uma falsa sensação de precisão. Serve para
   * disparar atenção, não para substituir o planejamento.
   */
  private projetarTermino(
    obra: { data_inicio: string | null; data_prevista: string | null },
    avancoReal: number,
  ): string | null {
    if (!obra.data_inicio || avancoReal <= 0) return obra.data_prevista;

    const inicio = new Date(obra.data_inicio).getTime();
    const decorridos = (Date.now() - inicio) / 86_400_000;
    if (decorridos <= 0) return obra.data_prevista;

    const totalEstimado = decorridos / (avancoReal / 100);
    return new Date(inicio + totalEstimado * 86_400_000).toISOString().slice(0, 10);
  }

  private estimarDesvio(
    obra: { data_inicio: string | null; data_prevista: string | null },
    avancoReal: number,
    avancoPrevisto: number,
  ): number {
    if (!obra.data_inicio || !obra.data_prevista) return 0;

    const duracao =
      (new Date(obra.data_prevista).getTime() - new Date(obra.data_inicio).getTime()) / 86_400_000;
    if (duracao <= 0) return 0;

    // Cada ponto percentual de atraso equivale a duracao/100 dias de prazo.
    return Math.round(((avancoPrevisto - avancoReal) / 100) * duracao);
  }

  private async alertas(tx: TenantClient): Promise<Alerta[]> {
    const alertas: Alerta[] = [];

    const estoque = await tx.query<{ obra: string; material: string; saldo: string }>(
      `SELECT o.nome AS obra, s.nome AS material, s.saldo::text
         FROM estoque_saldo s JOIN obras o ON o.id = s.obra_id
        WHERE s.saldo < s.estoque_min
        LIMIT 10`,
    );
    for (const e of estoque) {
      alertas.push({
        tipo: 'estoque',
        gravidade: 'alta',
        titulo: `${e.material} abaixo do mínimo`,
        detalhe: `${e.obra} — saldo ${e.saldo}`,
      });
    }

    const seguranca = await tx.query<{ obra: string; descricao: string; gravidade: string }>(
      `SELECT o.nome AS obra, oc.descricao, oc.gravidade
         FROM ocorrencias oc JOIN obras o ON o.id = oc.obra_id
        WHERE NOT oc.resolvida AND oc.tipo IN ('seguranca','acidente','incidente')
        ORDER BY oc.criado_em DESC LIMIT 10`,
    );
    for (const s of seguranca) {
      alertas.push({
        tipo: 'seguranca',
        gravidade: s.gravidade === 'critica' ? 'critica' : 'alta',
        titulo: 'Ocorrência de segurança aberta',
        detalhe: `${s.obra} — ${s.descricao}`,
      });
    }

    // Obra ativa sem RDO há 3 dias: ou parou, ou o registro parou. Nos dois
    // casos é algo que o engenheiro precisa saber hoje, não no fim do mês.
    const semRegistro = await tx.query<{ nome: string; dias: string }>(
      `SELECT o.nome, COALESCE(CURRENT_DATE - max(r.data), 999)::text AS dias
         FROM obras o LEFT JOIN rdos r ON r.obra_id = o.id
        WHERE o.status = 'em_andamento'
        GROUP BY o.id, o.nome
       HAVING COALESCE(CURRENT_DATE - max(r.data), 999) >= 3`,
    );
    for (const o of semRegistro) {
      alertas.push({
        tipo: 'registro',
        gravidade: 'media',
        titulo: 'Obra sem RDO recente',
        detalhe: `${o.nome} — ${o.dias === '999' ? 'nenhum registro' : `${o.dias} dias sem registro`}`,
      });
    }

    return alertas;
  }
}

export interface Alerta {
  tipo: 'estoque' | 'seguranca' | 'registro' | 'prazo' | 'custo';
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  detalhe: string;
}
