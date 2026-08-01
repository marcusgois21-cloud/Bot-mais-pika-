import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResultRow } from 'pg';
import { loadEnv } from '../config/env';

/**
 * Acesso ao PostgreSQL com isolamento multi-tenant obrigatório.
 *
 * O ponto central desta classe é `comTenant()`: ela abre uma transação,
 * define `app.empresa_id` na sessão e só então executa a query. As policies
 * de Row-Level Security (db/migrations/002_rls.sql) usam essa variável.
 *
 * Consequência: se alguém esquecer o `WHERE empresa_id = ...` numa query, o
 * banco simplesmente não devolve linha de outro cliente. O isolamento não
 * depende da disciplina de quem escreve a query.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  async onModuleInit(): Promise<void> {
    const env = loadEnv();
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    this.pool.on('error', (err) => {
      // Cliente ocioso morreu (rede, failover). O pool se recupera sozinho;
      // logamos para não perder o sinal de instabilidade.
      this.logger.error(`Erro em cliente ocioso do pool: ${err.message}`);
    });

    await this.pool.query('SELECT 1');
    this.logger.log('Conexão com PostgreSQL estabelecida.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  /**
   * Query SEM escopo de tenant. Use apenas para operações de plataforma
   * (health check, resolução de telefone -> empresa, jobs de manutenção).
   * Para dado de negócio, use `comTenant`.
   */
  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const { rows } = await this.pool.query<T>(sql, params);
    return rows;
  }

  /**
   * Executa `fn` dentro de uma transação com o tenant fixado.
   *
   * `SET LOCAL` é essencial: o valor vale só até o fim da transação, então a
   * conexão volta ao pool sem carregar o tenant anterior. Usar `SET` comum
   * aqui seria um vazamento entre requisições.
   */
  async comTenant<T>(empresaId: string, fn: (tx: TenantClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT set_config($1, $2, true)', ['app.empresa_id', empresaId]);

      const resultado = await fn(new TenantClient(client, empresaId));

      await client.query('COMMIT');
      return resultado;
    } catch (erro) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw erro;
    } finally {
      client.release();
    }
  }

  /**
   * Resolve o telefone que chegou no webhook para (usuário, empresa).
   *
   * É a única porta de entrada sem tenant definido — o WhatsApp entrega um
   * número, não um identificador de cliente. A função no banco roda como
   * SECURITY DEFINER e devolve apenas estes campos.
   */
  async resolverUsuarioPorTelefone(telefone: string): Promise<UsuarioResolvido | null> {
    const rows = await this.query<UsuarioResolvido>(
      'SELECT * FROM resolver_usuario_por_telefone($1)',
      [telefone],
    );
    return rows[0] ?? null;
  }

  async saudavel(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

/** Cliente já vinculado a um tenant. Não expõe BEGIN/COMMIT de propósito. */
export class TenantClient {
  constructor(
    private readonly client: PoolClient,
    readonly empresaId: string,
  ) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const { rows } = await this.client.query<T>(sql, params);
    return rows;
  }

  /** Query que deve devolver no máximo uma linha. */
  async um<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }
}

export interface UsuarioResolvido {
  usuario_id: string;
  empresa_id: string;
  nome: string;
  perfil: 'gestor' | 'engenheiro' | 'mestre' | 'almoxarife' | 'cliente';
}
