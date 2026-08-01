import { Injectable, Logger } from '@nestjs/common';
import { TenantClient } from '../database/database.service';
import { ExtracaoRDO } from '../ai/esquema';

export interface AlertaEstoque {
  material: string;
  saldo: number;
  minimo: number;
  unidade: string;
}

@Injectable()
export class EstoqueService {
  private readonly logger = new Logger(EstoqueService.name);

  /**
   * Dá baixa nos materiais citados no relato e devolve os que ficaram abaixo
   * do mínimo.
   *
   * Material sem quantidade informada NÃO movimenta estoque. Registrar "usou
   * cimento" sem saber quanto e chutar um valor destruiria a confiança no
   * saldo — que é justamente o dado usado para decidir compra.
   */
  async darBaixa(
    tx: TenantClient,
    obraId: string,
    rdoId: string,
    dados: ExtracaoRDO,
  ): Promise<AlertaEstoque[]> {
    const alertas: AlertaEstoque[] = [];

    for (const item of dados.materiais) {
      if (item.quantidade === null || item.quantidade <= 0) {
        this.logger.debug(`Material "${item.nome}" sem quantidade — estoque não movimentado.`);
        continue;
      }

      const material = await this.encontrarMaterial(tx, item.nome);
      if (!material) {
        this.logger.debug(`Material "${item.nome}" não cadastrado — ignorado no estoque.`);
        continue;
      }

      await tx.query(
        `INSERT INTO estoque_movimentos
           (empresa_id, obra_id, material_id, rdo_id, tipo, quantidade, origem, observacao)
         VALUES ($1, $2, $3, $4, 'saida', $5, 'voz', $6)`,
        [tx.empresaId, obraId, material.id, rdoId, item.quantidade, `Consumo relatado: ${item.nome}`],
      );

      const saldo = await this.saldoAtual(tx, obraId, material.id);
      if (saldo !== null && saldo < Number(material.estoque_min)) {
        alertas.push({
          material: material.nome,
          saldo,
          minimo: Number(material.estoque_min),
          unidade: material.unidade,
        });
      }
    }

    return alertas;
  }

  /**
   * Casa o nome dito no áudio com o material cadastrado.
   *
   * Ninguém fala "Cimento CP-II 50kg" no canteiro — fala "cimento". Por isso a
   * busca cobre nome, apelidos e, por último, correspondência parcial.
   */
  private async encontrarMaterial(
    tx: TenantClient,
    termo: string,
  ): Promise<{ id: string; nome: string; unidade: string; estoque_min: string } | null> {
    const alvo = termo.toLowerCase().trim();

    const exato = await tx.um<{ id: string; nome: string; unidade: string; estoque_min: string }>(
      `SELECT id, nome, unidade, estoque_min::text
         FROM materiais
        WHERE lower(nome) = $1 OR $1 = ANY (SELECT lower(a) FROM unnest(apelidos) a)
        LIMIT 1`,
      [alvo],
    );
    if (exato) return exato;

    return tx.um(
      `SELECT id, nome, unidade, estoque_min::text
         FROM materiais
        WHERE lower(nome) LIKE '%' || $1 || '%'
           OR EXISTS (SELECT 1 FROM unnest(apelidos) a WHERE $1 LIKE '%' || lower(a) || '%')
        ORDER BY length(nome)
        LIMIT 1`,
      [alvo],
    );
  }

  private async saldoAtual(
    tx: TenantClient,
    obraId: string,
    materialId: string,
  ): Promise<number | null> {
    const linha = await tx.um<{ saldo: string }>(
      `SELECT COALESCE(SUM(
                CASE WHEN tipo IN ('entrada','ajuste') THEN quantidade ELSE -quantidade END
              ), 0)::text AS saldo
         FROM estoque_movimentos
        WHERE obra_id = $1 AND material_id = $2`,
      [obraId, materialId],
    );
    return linha ? Number(linha.saldo) : null;
  }

  /**
   * Cria pedido de compra a partir de um alerta.
   *
   * Sugere o dobro do mínimo menos o saldo: repor só até o mínimo faria o
   * alerta disparar de novo no dia seguinte.
   */
  async gerarPedido(
    tx: TenantClient,
    obraId: string,
    solicitanteId: string | null,
    alertas: AlertaEstoque[],
  ): Promise<{ id: string; numero: number } | null> {
    if (!alertas.length) return null;

    const pedido = await tx.um<{ id: string; numero: number }>(
      `INSERT INTO pedidos_compra (empresa_id, obra_id, solicitante_id, status, gerado_por_ia)
       VALUES ($1, $2, $3, 'rascunho', true)
       RETURNING id, numero`,
      [tx.empresaId, obraId, solicitanteId],
    );
    if (!pedido) return null;

    for (const alerta of alertas) {
      const material = await this.encontrarMaterial(tx, alerta.material);
      if (!material) continue;

      const sugerido = Math.max(alerta.minimo * 2 - alerta.saldo, alerta.minimo);
      await tx.query(
        `INSERT INTO pedido_itens (pedido_id, material_id, quantidade) VALUES ($1, $2, $3)`,
        [pedido.id, material.id, sugerido],
      );
    }

    return pedido;
  }

  async saldosDaObra(tx: TenantClient, obraId: string): Promise<Array<Record<string, unknown>>> {
    return tx.query(
      `SELECT nome, unidade, saldo::text, estoque_min::text,
              (saldo < estoque_min) AS abaixo_minimo
         FROM estoque_saldo
        WHERE obra_id = $1
        ORDER BY abaixo_minimo DESC, nome`,
      [obraId],
    );
  }
}
