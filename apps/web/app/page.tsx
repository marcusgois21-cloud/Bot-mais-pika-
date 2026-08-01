import { Painel, Obra, moeda, data } from '@/lib/api';

/**
 * Dashboard.
 *
 * Ordem de leitura pensada para quem opera, não para quem contempla: primeiro
 * o que exige ação (alertas), depois o estado agregado, por último a lista.
 * Um engenheiro abre isto no meio do dia para saber onde precisa intervir.
 */

// Enquanto o login não é ligado, o painel renderiza com dados de exemplo — a
// tela existe para ser navegada desde o primeiro `docker compose up`.
const DEMO: Painel = {
  obrasAtivas: 2,
  custoMedioM2: 2140,
  rdosHoje: { registrados: 1, esperados: 2 },
  alertas: [
    {
      tipo: 'estoque',
      gravidade: 'alta',
      titulo: 'Cimento CP-II abaixo do mínimo',
      detalhe: 'Residencial Aurora — saldo 12 saco',
    },
    {
      tipo: 'registro',
      gravidade: 'media',
      titulo: 'Obra sem RDO recente',
      detalhe: 'Galpão Industrial Norte — 4 dias sem registro',
    },
  ],
  produtividade: [
    { semana: '01/07', rdos: 9 },
    { semana: '08/07', rdos: 12 },
    { semana: '15/07', rdos: 11 },
    { semana: '22/07', rdos: 14 },
    { semana: '29/07', rdos: 13 },
    { semana: '05/08', rdos: 16 },
  ],
};

const OBRAS_DEMO: Obra[] = [
  {
    id: '1',
    nome: 'Residencial Aurora',
    endereco: 'Rua das Acácias, 120 — Belo Horizonte/MG',
    status: 'em_andamento',
    area_m2: '1850',
    cliente: 'Ricardo Menezes',
    ultimo_rdo: '2026-08-12',
  },
  {
    id: '2',
    nome: 'Galpão Industrial Norte',
    endereco: 'Av. Industrial, 4500 — Contagem/MG',
    status: 'em_andamento',
    area_m2: '4200',
    cliente: null,
    ultimo_rdo: '2026-08-08',
  },
];

const CORES_GRAVIDADE: Record<string, string> = {
  critica: 'border-risco bg-red-50 dark:bg-red-950/30',
  alta: 'border-risco bg-red-50 dark:bg-red-950/30',
  media: 'border-alerta-500 bg-alerta-100 dark:bg-amber-950/30',
  baixa: 'border-slate-300 bg-slate-50 dark:bg-slate-800',
};

export default function Dashboard() {
  const painel = DEMO;
  const obras = OBRAS_DEMO;
  const maxRdos = Math.max(...painel.produtividade.map((p) => p.rdos), 1);
  const cobertura = painel.rdosHoje.esperados
    ? Math.round((painel.rdosHoje.registrados / painel.rdosHoje.esperados) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo">Painel</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Visão geral</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Alimentado pelos registros de campo do WhatsApp
        </p>
      </header>

      {painel.alertas.length > 0 && (
        <section className="mb-8">
          <h2 className="rotulo mb-3">Precisa de atenção</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {painel.alertas.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border-l-4 px-4 py-3 ${CORES_GRAVIDADE[a.gravidade]}`}
              >
                <p className="text-sm font-semibold">{a.titulo}</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{a.detalhe}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Obras ativas" valor={String(painel.obrasAtivas)} />
        <Indicador rotulo="Custo médio /m²" valor={moeda(painel.custoMedioM2)} />
        <Indicador
          rotulo="RDOs de hoje"
          valor={`${painel.rdosHoje.registrados}/${painel.rdosHoje.esperados}`}
          nota={`${cobertura}% das obras`}
          alerta={cobertura < 80}
        />
        <Indicador
          rotulo="Alertas abertos"
          valor={String(painel.alertas.length)}
          alerta={painel.alertas.length > 0}
        />
      </section>

      <section className="mb-8 cartao">
        <h2 className="rotulo mb-4">RDOs por semana</h2>
        <div className="flex h-32 items-end gap-3">
          {painel.produtividade.map((p) => (
            <div key={p.semana} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-obra-600 dark:bg-obra-500"
                style={{ height: `${(p.rdos / maxRdos) * 100}%` }}
                title={`${p.rdos} RDOs`}
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.semana}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="rotulo mb-3">Obras</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {obras.map((o) => (
            <article key={o.id} className="cartao">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{o.nome}</h3>
                <span className="rounded-full bg-obra-100 px-2 py-0.5 text-[11px] font-semibold text-obra-700 dark:bg-obra-900 dark:text-obra-200">
                  {o.status === 'em_andamento' ? 'Em andamento' : o.status}
                </span>
              </div>
              {o.endereco && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{o.endereco}</p>
              )}
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="rotulo">Área</dt>
                  <dd className="tabular-nums">{o.area_m2 ? `${o.area_m2} m²` : '—'}</dd>
                </div>
                <div>
                  <dt className="rotulo">Cliente</dt>
                  <dd className="truncate">{o.cliente ?? '—'}</dd>
                </div>
                <div>
                  <dt className="rotulo">Último RDO</dt>
                  <dd className="tabular-nums">{data(o.ultimo_rdo)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  nota,
  alerta,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <div className="cartao">
      <p className="rotulo">{rotulo}</p>
      <p className={`numero mt-1 ${alerta ? 'text-alerta-600 dark:text-alerta-500' : ''}`}>
        {valor}
      </p>
      {nota && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{nota}</p>}
    </div>
  );
}
