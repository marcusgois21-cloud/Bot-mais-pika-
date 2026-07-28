import { createFileRoute } from "@tanstack/react-router";
import { Contador, useRolou } from "../components/site/animacao";
import { VLibras } from "../components/site/vlibras";
import { getNoticias, type Noticia } from "../lib/noticias";

export const Route = createFileRoute("/")({
  // busca notícias no servidor a cada carregamento (com cache de 30 min),
  // mantendo a seção "Na Mídia" atualizada sozinha
  loader: async () => ({ noticias: await getNoticias() }),
  component: Pagina,
});

// dados estruturados (schema.org) para o Google reconhecer e rastrear a
// página pelo nome "Wellington Neim"
const DADOS_ESTRUTURADOS = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Wellington Neim",
  alternateName: "Wellington Sabino de Oliveira",
  jobTitle: "Presidente da Câmara Municipal de Ponte Nova",
  worksFor: {
    "@type": "GovernmentOrganization",
    name: "Câmara Municipal de Ponte Nova",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ponte Nova",
    addressRegion: "MG",
    addressCountry: "BR",
  },
  url: "https://wellington-neim.higgsfield.app",
  image: "https://wellington-neim.higgsfield.app/assets/og.jpg",
  sameAs: [
    "https://www.instagram.com/wellingtonneim",
    "https://www.facebook.com/vereadorneim",
  ],
};

/* Site oficial do vereador Wellington Neim, presidente da Câmara Municipal
 * de Ponte Nova (MG), no estilo clássico dos sites políticos brasileiros.
 * Todo o conteúdo vem de fontes públicas (TSE, Câmara, imprensa local). */

const INSTAGRAM = "https://www.instagram.com/wellingtonneim";
const FACEBOOK = "https://www.facebook.com/vereadorneim";
const PORTAL_CAMARA = "https://www.pontenova.mg.leg.br/";

function Pagina() {
  const { noticias } = Route.useLoaderData();
  const requerimentos = noticias.filter((n) => n.tipo === "requerimento");
  const materias = noticias.filter((n) => n.tipo === "noticia");
  return (
    <div className="min-h-dvh overflow-x-clip bg-white font-pop text-texto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DADOS_ESTRUTURADOS) }}
      />
      <VLibras />
      <Navegacao />
      <main>
        <Heroi />
        <Numeros />
        <MinhaHistoria />
        <Mandato />
        <Projetos requerimentos={requerimentos} />
        <Palavra />
        <NaMidia noticias={materias} />
        <Contato />
      </main>
      <Rodape />
    </div>
  );
}

function Navegacao() {
  const rolou = useRolou();
  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 bg-marinho transition-shadow ${
        rolou ? "shadow-[0_4px_18px_rgba(13,27,54,0.35)]" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#inicio" aria-label="Início" className="logo-neim-mini">
          <span>Wellington Neim</span>
        </a>
        <div className="hidden items-center gap-6 text-[13px] font-semibold uppercase tracking-wide text-white/90 md:flex">
          <a className="transition-colors hover:text-celeste" href="#minha-historia">
            Minha História
          </a>
          <a className="transition-colors hover:text-celeste" href="#mandato">
            Mandato
          </a>
          <a className="transition-colors hover:text-celeste" href="#na-midia">
            Na Mídia
          </a>
          <a className="transition-colors hover:text-celeste" href="#contato">
            Contato
          </a>
        </div>
        <a
          href="#contato"
          className="text-[13px] font-semibold uppercase tracking-wide text-celeste md:hidden"
        >
          Contato
        </a>
      </div>
    </nav>
  );
}

function Heroi() {
  return (
    <header id="inicio" className="hero-fundo mt-16">
      <div className="relative mx-auto flex min-h-[400px] max-w-6xl flex-col items-center justify-center px-5 py-16 text-center md:min-h-[460px]">
        <div className="logo-wrap surgir">
          <span className="logo-tag">Vereador</span>
          <div className="logo-neim">
            <span className="logo-streak logo-streak-1" aria-hidden />
            <span className="logo-streak logo-streak-2" aria-hidden />
            <div className="logo-neim-inner">
              <span className="logo-nome">Wellington Neim</span>
              <svg
                className="logo-swoosh"
                width="200"
                height="26"
                viewBox="0 0 200 26"
                aria-hidden
              >
                <path
                  d="M6 5 Q100 34 194 5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="logo-numero" aria-label="Número de urna 11333">
              11333
            </span>
          </div>
        </div>
        <p className="surgir-2 surgir mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-white md:text-base">
          Presidente da Câmara Municipal de Ponte Nova
        </p>
        <div className="surgir-3 surgir mt-4 flex items-center gap-3 text-white/80">
          <span className="h-px w-8 bg-white/40" />
          <span className="text-xs font-bold uppercase tracking-[0.22em] md:text-sm">
            Biênio 2025 · 2026
          </span>
          <span className="h-px w-8 bg-white/40" />
        </div>
      </div>
    </header>
  );
}

const CARTOES_NUMEROS = [
  { numero: <Contador ate={1060} />, rotulo: "Votos em 2024" },
  { numero: "2º", rotulo: "Mais votado da cidade" },
  { numero: "2", rotulo: "Mandatos de vereador" },
  { numero: "2025", rotulo: "Presidente da Câmara" },
];

function Numeros() {
  return (
    <section aria-label="Números do mandato" className="bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 py-12 md:grid-cols-4 md:gap-6 md:px-8 md:py-16">
        {CARTOES_NUMEROS.map((c) => (
          <div key={c.rotulo} className="card-numero cartao-vivo px-4 py-9 text-center">
            <p className="num-ouro text-4xl font-extrabold tracking-tight md:text-6xl">
              {c.numero}
            </p>
            <span className="mx-auto mt-3 block h-[3px] w-9 rounded-full bg-white/60" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/85 md:text-xs">
              {c.rotulo}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MinhaHistoria() {
  return (
    <section id="minha-historia" className="scroll-mt-16 bg-fundocinza">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div>
          <h2 className="text-2xl font-extrabold italic text-royal md:text-3xl">
            VEREADOR WELLINGTON NEIM
          </h2>
          <p className="mt-5 leading-relaxed text-apoio">
            Nascido em Ponte Nova em 15 de outubro de 1982, construí minha vida
            como empresário na cidade antes da vida pública. Em 2024, tive a
            honra de voltar à Câmara com a confiança de 1.060 ponte-novenses,
            a segunda maior votação do município.
          </p>
          <p className="mt-4 font-bold text-celeste">
            2013 · Primeiro mandato de vereador
          </p>
          <p className="font-bold text-royal">
            2024 · 1.060 votos, o 2º mais votado!
          </p>
          <h3 className="mt-7 text-lg font-extrabold italic text-marinho">
            PRESIDENTE DA CÂMARA MUNICIPAL
          </h3>
          <p className="mt-3 leading-relaxed text-apoio">
            Na posse de 1º de janeiro de 2025, fui eleito presidente da Câmara
            para o biênio 2025/2026 sem nenhum voto contrário. Em maio de 2026,
            recebi o governador do Estado no plenário quando Ponte Nova se
            tornou a capital simbólica de Minas Gerais.
          </p>
          <a
            href="#mandato"
            className="mt-8 inline-block rounded-md bg-marinho px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-marinhoesc active:translate-y-px"
          >
            Ver o mandato
          </a>
        </div>
        <div className="overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(13,27,54,0.25)]">
          <img
            src="/assets/historia.jpg"
            alt="Retrato oficial do vereador Wellington Neim, de braços cruzados"
            className="w-full"
            width={1000}
            height={1305}
          />
        </div>
      </div>
    </section>
  );
}

const BANDEIRAS = [
  {
    titulo: "VALORIZAÇÃO DO SERVIDOR PÚBLICO",
    texto:
      "A marca do mandato: cobrança constante por quem serve a cidade. Gratificação dos fiscais de posturas, adicional de desempenho da saúde bucal, cesta básica e quinquênio com retroativo, e fardas novas para os agentes de trânsito.",
    destaque: true,
  },
  {
    titulo: "FISCALIZAÇÃO DO DINHEIRO PÚBLICO",
    texto:
      "Acompanhamento dos recursos do acordo da Samarco e cobrança de respostas sobre obras paradas na cidade.",
  },
  {
    titulo: "INFRAESTRUTURA NOS BAIRROS",
    texto:
      "Iluminação para a quadra da Rasa, praça de Palmeiras cuidada, retomada do ônibus do Chopotó e trânsito seguro nas obras.",
  },
  {
    titulo: "SEGURANÇA PÚBLICA",
    texto:
      "Defesa da elevação da Companhia da Polícia Militar a Batalhão e de um novo caminhão para o Corpo de Bombeiros.",
  },
  {
    titulo: "PROTEÇÃO ANIMAL",
    texto:
      "Apoio de médico veterinário nas ações municipais de proteção e cuidado com os animais.",
  },
];

function Mandato() {
  return (
    <section id="mandato" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-4xl font-extrabold uppercase text-slate-300 md:text-5xl">
          Mandato
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-apoio">
          As bandeiras que guiam o trabalho na Câmara, com requerimentos
          aprovados em plenário.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {BANDEIRAS.map((b) =>
            b.destaque ? (
              <article
                key={b.titulo}
                className="cartao-vivo rounded-2xl bg-marinho p-8 text-white shadow-[0_12px_30px_rgba(13,27,54,0.3)] md:col-span-2"
              >
                <h3 className="text-xl font-extrabold italic text-celeste">{b.titulo}</h3>
                <p className="mt-4 leading-relaxed text-white/85">{b.texto}</p>
              </article>
            ) : (
              <article
                key={b.titulo}
                className="cartao-vivo rounded-2xl border-t-4 border-celeste bg-white p-8 shadow-[0_12px_30px_rgba(13,27,54,0.12)]"
              >
                <h3 className="text-lg font-extrabold italic text-marinho">{b.titulo}</h3>
                <p className="mt-4 leading-relaxed text-apoio">{b.texto}</p>
              </article>
            ),
          )}
          <article
            className="cartao-vivo relative overflow-hidden rounded-2xl p-8 text-white shadow-[0_12px_30px_rgba(13,27,54,0.3)]"
            style={{
              backgroundImage: "url(/assets/retrato-tinta.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 12%",
            }}
          >
            <div className="absolute inset-0 bg-marinhoesc/60" aria-hidden />
            <div className="relative">
              <h3 className="text-lg font-extrabold italic">TRABALHO NO PLENÁRIO</h3>
              <p className="mt-4 leading-relaxed text-white/90">
                Requerimentos aprovados por unanimidade e diálogo permanente com
                o Executivo e com quem mais importa: a população.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Palavra() {
  return (
    <section aria-label="Palavra do presidente" className="aba-fala">
      <span className="aba-aspas text-[150px] md:text-[240px]" aria-hidden>
        &ldquo;
      </span>
      <figure className="relative mx-auto max-w-4xl px-5 py-24 text-center md:px-8 md:py-32">
        <blockquote className="text-2xl font-bold leading-snug text-white md:text-4xl md:leading-tight">
          Vamos trabalhar em benefício de Ponte Nova. Esta Casa é a porta de
          entrada da cidade.
        </blockquote>
        <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-celeste" />
        <figcaption className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-celeste">
          Wellington Neim
          <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-white/60">
            Discurso de posse na presidência da Câmara · 1º de janeiro de 2025
          </span>
        </figcaption>
      </figure>
    </section>
  );
}

const REQUERIMENTOS_CURADOS: Noticia[] = [
  {
    titulo: "Valorização e gratificação para os fiscais de posturas",
    resumo:
      "Requerimento aprovado por unanimidade em defesa de quem fiscaliza e organiza a cidade, função de risco diário.",
    data: "6 abr 2026",
    link: "https://www.lidernoticias.net.br/sociedade/wellington-neim-pp-solicita-informacoes-sobre-valorizacao-dos-fiscais-de-posturas-e-destaca-riscos-da-funcao",
    tipo: "requerimento",
  },
  {
    titulo: "Controle de trânsito nas obras de recapeamento",
    resumo:
      "Requerimento pede a atuação da Semut, a secretaria de trânsito da cidade, nas vias durante as obras.",
    data: "8 jun 2026",
    link: "https://www.lidernoticias.net.br/sociedade/vereador-cobra-informacoes-sobre-controle-do-transito-durante-obras-de-recapeamento-em-ponte-nova",
    tipo: "requerimento",
  },
  {
    titulo: "Adicional de desempenho às equipes de saúde bucal",
    resumo:
      "Solicitação à Prefeitura de informações sobre o pagamento do adicional às equipes de saúde bucal.",
    data: "18 mai 2026",
    link: "https://www.lidernoticias.net.br/sociedade/wellington-neim-pp-solicita-a-prefeitura-informacoes-sobre-o-pagamento-do-adicional-por-desempenho-as-equipes-de-saude-bucal-da-atencao-primaria-a-saude",
    tipo: "requerimento",
  },
  {
    titulo: "Retomada da linha de ônibus para o Chopotó",
    resumo:
      "Requerimento cobra informações sobre o restabelecimento do transporte coletivo suspenso na região.",
    data: "24 jun 2026",
    link: "https://www.pontenova.mg.leg.br/",
    tipo: "requerimento",
  },
];

function Projetos({ requerimentos }: { requerimentos: Noticia[] }) {
  const aoVivo = requerimentos.length >= 3;
  const itens = aoVivo ? requerimentos : REQUERIMENTOS_CURADOS;
  return (
    <section id="requerimentos" className="scroll-mt-16 bg-fundocinza">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-3xl font-extrabold uppercase text-slate-300 md:text-5xl">
          Projetos e Requerimentos
        </h2>
        <p className="mt-2 text-sm font-medium text-apoio">
          {aoVivo
            ? "Atualizado automaticamente com a atuação legislativa registrada na Câmara Municipal."
            : "A atuação legislativa do mandato, com link para a fonte na Câmara."}
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {itens.map((r) => (
            <a
              key={r.link + r.titulo}
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className="cartao-vivo group flex flex-col rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(13,27,54,0.10)]"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-marinho px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Requerimento
                </span>
                {r.data && (
                  <span className="text-xs font-semibold text-apoio">{r.data}</span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-bold italic leading-snug text-marinho">
                {r.titulo}
              </h3>
              {r.resumo && (
                <p className="mt-2 text-sm leading-relaxed text-apoio">{r.resumo}</p>
              )}
              <span className="mt-4 text-sm font-bold text-royal">
                Ver na fonte{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const ATOS = [
  {
    data: "8 jun 2026",
    titulo: "Cobrança de controle de trânsito nas obras de recapeamento",
    texto:
      "Requerimento aprovado por unanimidade pede a atuação da Semut, a secretaria de trânsito da cidade, nas vias durante as obras.",
    fonte:
      "https://www.lidernoticias.net.br/sociedade/vereador-cobra-informacoes-sobre-controle-do-transito-durante-obras-de-recapeamento-em-ponte-nova",
  },
  {
    data: "18 mai 2026",
    titulo: "Adicional de desempenho às equipes de saúde bucal",
    texto:
      "O mandato solicitou à Prefeitura informações sobre o pagamento do adicional de desempenho às equipes de saúde bucal.",
    fonte:
      "https://www.lidernoticias.net.br/sociedade/wellington-neim-pp-solicita-a-prefeitura-informacoes-sobre-o-pagamento-do-adicional-por-desempenho-as-equipes-de-saude-bucal-da-atencao-primaria-a-saude",
  },
  {
    data: "11 mai 2026",
    titulo: "Ponte Nova vira capital simbólica de Minas Gerais",
    texto:
      "À frente da cerimônia com o governador do Estado, cobrou a elevação da Companhia da PM a Batalhão e um novo caminhão para o Corpo de Bombeiros.",
    fonte:
      "https://www.pontenova.mg.leg.br/institucional/noticias/ponte-nova-vira-capital-de-mg-apos-cerimonia-com-o-governador-na-camara",
  },
  {
    data: "6 abr 2026",
    titulo: "Valorização e gratificação para os fiscais de posturas",
    texto:
      "Requerimento aprovado por unanimidade defende quem fiscaliza e organiza a cidade, função de risco diário.",
    fonte:
      "https://www.lidernoticias.net.br/sociedade/wellington-neim-pp-solicita-informacoes-sobre-valorizacao-dos-fiscais-de-posturas-e-destaca-riscos-da-funcao",
  },
  {
    data: "1 jan 2025",
    titulo: "Posse e eleição para a presidência da Câmara Municipal",
    texto:
      "Eleito presidente do Legislativo de Ponte Nova para o biênio 2025/2026, sem nenhum voto contrário.",
    fonte:
      "https://www.pontenova.mg.leg.br/institucional/noticias/vereadores-prefeito-e-vice-prefeita-tomam-posse-na-camara-e-mesa-diretora-e-definida",
  },
];

function NaMidia({ noticias }: { noticias: Noticia[] }) {
  // usa as notícias ao vivo quando há material suficiente; senão, cai para a
  // lista curada de atos (o site nunca fica vazio ou desatualizado)
  const aoVivo = noticias.length >= 3;
  const itens = aoVivo
    ? noticias.map((n) => ({
        data: n.data,
        titulo: n.titulo,
        texto: n.resumo || "Notícia da Câmara Municipal de Ponte Nova.",
        fonte: n.link,
      }))
    : ATOS;
  return (
    <section id="na-midia" className="scroll-mt-16 bg-fundocinza">
      <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-4xl font-extrabold uppercase text-slate-300 md:text-5xl">
          Na Mídia
        </h2>
        <p className="mt-2 text-sm font-medium text-apoio">
          {aoVivo
            ? "Atualizado automaticamente com as notícias mais recentes da Câmara Municipal de Ponte Nova."
            : "Atos e cobranças do mandato, com data e link para a fonte."}
        </p>
        <div className="mt-10 space-y-6">
          {itens.map((ato) => (
            <a
              key={ato.fonte}
              href={ato.fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="linha-atuacao cartao-vivo block rounded-2xl border-l-4 border-celeste bg-white p-7 shadow-[0_12px_30px_rgba(13,27,54,0.12)]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-royal">
                {ato.data}
              </p>
              <h3 className="mt-1 text-lg font-bold italic text-marinho">{ato.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-apoio">{ato.texto}</p>
              <p className="mt-3 text-sm font-bold text-royal">
                Ler na fonte <span className="seta inline-block">→</span>
              </p>
            </a>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a
            href={PORTAL_CAMARA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-celeste px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-royal active:translate-y-px"
          >
            Ver mais no portal da Câmara
          </a>
        </div>
      </div>
    </section>
  );
}

function Contato() {
  return (
    <section id="contato" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-4xl font-extrabold uppercase text-slate-300 md:text-5xl">
          Contato
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-extrabold italic text-marinho">
              GABINETE DA PRESIDÊNCIA
            </h3>
            <p className="mt-4 leading-relaxed text-apoio">
              Câmara Municipal de Ponte Nova
              <br />
              Ponte Nova · Minas Gerais
            </p>
            <p className="mt-3 leading-relaxed text-apoio">
              Atendimento de segunda a sexta, das 12h às 18h
            </p>
            <p className="mt-3 font-semibold text-marinho">
              <a className="hover:text-royal" href="tel:+553138193250">
                (31) 3819-3250
              </a>
              <br />
              <a className="break-all hover:text-royal" href="mailto:camara@pontenova.mg.leg.br">
                camara@pontenova.mg.leg.br
              </a>
            </p>
          </div>
          <div className="md:text-right">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-marinho px-9 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-marinhoesc active:translate-y-px"
            >
              Fale comigo
            </a>
            <div className="mt-7 flex gap-3 md:justify-end">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram do vereador"
                className="cartao-vivo flex h-11 w-11 items-center justify-center rounded-lg bg-[#E1306C] text-white"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook do vereador"
                className="cartao-vivo flex h-11 w-11 items-center justify-center rounded-lg bg-[#1877F2] text-xl font-extrabold text-white"
              >
                f
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="bg-marinho text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="border-b border-white/20 pb-2 text-lg font-extrabold italic">
            Links
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>
              <a className="hover:text-celeste" href="#inicio">
                Início
              </a>
            </li>
            <li>
              <a className="hover:text-celeste" href="#minha-historia">
                Minha História
              </a>
            </li>
            <li>
              <a className="hover:text-celeste" href="#mandato">
                Mandato
              </a>
            </li>
            <li>
              <a className="hover:text-celeste" href="#requerimentos">
                Requerimentos
              </a>
            </li>
            <li>
              <a className="hover:text-celeste" href="#na-midia">
                Na Mídia
              </a>
            </li>
            <li>
              <a className="hover:text-celeste" href="#contato">
                Contato
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="border-b border-white/20 pb-2 text-lg font-extrabold italic">
            Contatos
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Câmara Municipal de Ponte Nova
            <br />
            Ponte Nova · Minas Gerais
            <br />
            (31) 3819-3250
            <br />
            camara@pontenova.mg.leg.br
          </p>
        </div>
        <div>
          <h3 className="border-b border-white/20 pb-2 text-lg font-extrabold italic">
            Mídias
          </h3>
          <div className="mt-4 flex gap-3">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do vereador"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E1306C] text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook do vereador"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877F2] text-lg font-extrabold text-white"
            >
              f
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-2xl">
            © 2026 Mandato do vereador Wellington Neim · Conteúdo baseado em
            fontes públicas: Câmara Municipal de Ponte Nova, Justiça Eleitoral e
            imprensa local.
          </p>
          <p className="shrink-0 text-white/70">
            Desenvolvido por{" "}
            <span className="font-extrabold italic text-white">Gois Group</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
