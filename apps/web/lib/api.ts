const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface Alerta {
  tipo: 'estoque' | 'seguranca' | 'registro' | 'prazo' | 'custo';
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  detalhe: string;
}

export interface Painel {
  obrasAtivas: number;
  custoMedioM2: number | null;
  rdosHoje: { registrados: number; esperados: number };
  alertas: Alerta[];
  produtividade: Array<{ semana: string; rdos: number }>;
}

export interface Obra {
  id: string;
  nome: string;
  endereco: string | null;
  status: string;
  area_m2: string | null;
  cliente: string | null;
  ultimo_rdo: string | null;
}

/**
 * Cliente da API.
 *
 * O token vai no header; o tenant nunca — ele é derivado do token no servidor.
 * Deixar a empresa viajar como parâmetro seria abrir a porta para pedir dados
 * de outro cliente só trocando um id na URL.
 */
export async function buscar<T>(caminho: string, token?: string): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };
    throw new Error(corpo.erro ?? `Falha ao carregar (${resposta.status}).`);
  }
  return resposta.json() as Promise<T>;
}

export function moeda(valor: number | null): string {
  if (valor === null) return '—';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function data(iso: string | null): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}
