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

// dados estruturados (schema.org) para o Google reconhecer a página pelo nome
const DADOS_ESTRUTURADOS = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Fernanda Bitenco",
  alternateName: "Fernanda Félix Bitencourt",
  jobTitle: "Vereadora de Ponte Nova",
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
  sameAs: ["https://www.instagram.com/vereadorafernandabitenco"],
};

/* Site oficial da vereadora Fernanda Bitenco (Fernanda Félix Bitencourt), de
 * Ponte Nova (MG). Paleta de duas cores: Raspberry (#C2185B) e Pale Sky
 * (#E0F2FE). Conteúdo baseado em fontes públicas (TSE, Câmara Municipal,
 * imprensa local); os blocos marcados como rascunho aguardam confirmação da
 * vereadora. */

const INSTAGRAM = "https://www.instagram.com/vereadorafernandabitenco";
const PORTAL_CAMARA = "https://www.pontenova.mg.leg.br/";

function Pagina() {
  const { noticias } = Route.useLoaderData();
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
        <QuemE />
        <Prioridades />
        <Mensagem />
        <NaMidia noticias={noticias} />
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
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all ${
        rolou
          ? "border-paleskymed bg-white/95 shadow-[0_4px_18px_rgba(143,18,70,0.10)] backdrop-blur"
          : "border-transparent bg-white/85 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <a href="#inicio" aria-label="Início" className="flex items-baseline gap-2">
          <span className="marca-fern text-xl text-rasp md:text-2xl">Fernanda Bitenco</span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-rasp/70 sm:inline">
            Vereadora
          </span>
        </a>
        <div className="hidden items-center gap-7 text-[13px] font-semibold uppercase tracking-wide text-texto md:flex">
          <a className="link-nav" href="#quem-e">Quem é</a>
          <a className="link-nav" href="#prioridades">Prioridades</a>
          <a className="link-nav" href="#na-midia">Na Mídia</a>
          <a className="link-nav" href="#contato">Contato</a>
        </div>
        <a
          href="#contato"
          className="text-[13px] font-semibold uppercase tracking-wide text-rasp md:hidden"
        >
          Contato
        </a>
      </div>
    </nav>
  );
}

function Heroi() {
  return (
    <header id="inicio" className="scroll-mt-16 bg-palesky pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:px-8 md:py-24">
        <div>
          <span className="olho olho-so surgir text-rasp">
            Vereadora · Ponte Nova (MG)
          </span>
          <h1 className="nome-grande surgir surgir-2 mt-6 text-texto">
            Fernanda
            <br />
            <span className="text-rasp">Bitenco</span>
          </h1>
          <p className="surgir surgir-3 mt-6 max-w-md leading-relaxed text-apoio">
            Ponte-novense de nascimento, no primeiro mandato na Câmara Municipal.
            Uma voz nova no Legislativo, eleita em 2024 para o mandato 2025/2028.
          </p>
          <div className="surgir surgir-3 mt-9 flex flex-wrap items-center gap-4">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-rasp px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-raspesc active:translate-y-px"
            >
              Fale comigo
            </a>
            <a
              href="#prioridades"
              className="link-nav text-sm font-bold uppercase tracking-wide text-rasp"
            >
              Conheça as prioridades
            </a>
          </div>
        </div>
        <div className="moldura mx-auto w-full max-w-sm shadow-[0_20px_44px_rgba(143,18,70,0.18)]">
          <img
            src="/assets/fernanda-hero.jpg"
            alt="Retrato da vereadora Fernanda Bitenco"
            width={1309}
            height={1580}
          />
        </div>
      </div>
    </header>
  );
}

// Fatos reais e verificáveis (cadastro eleitoral + Câmara Municipal)
const CARTOES_NUMEROS = [
  { numero: <Contador ate={530} />, rotulo: "Votos em 2024" },
  { numero: "1º", rotulo: "Mandato de vereadora" },
  { numero: "2025", rotulo: "Início do mandato" },
  { numero: "AGIR", rotulo: "Partido · nº 36555" },
];

function Numeros() {
  return (
    <section aria-label="Números do mandato" className="faixa-rasp">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-14 md:grid-cols-4 md:px-8 md:py-16">
        {CARTOES_NUMEROS.map((c) => (
          <div key={c.rotulo} className="text-center">
            <p className="num-clara text-4xl font-bold tracking-tight md:text-6xl">
              {c.numero}
            </p>
            <span className="mx-auto mt-3 block h-px w-9 bg-palesky/60" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/85 md:text-xs">
              {c.rotulo}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuemE() {
  return (
    <section id="quem-e" className="scroll-mt-16 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div className="moldura order-2 mx-auto w-full max-w-sm shadow-[0_18px_40px_rgba(143,18,70,0.16)] md:order-1">
          <img
            src="/assets/fernanda-hero.jpg"
            alt="A vereadora Fernanda Bitenco no plenário da Câmara de Ponte Nova"
            width={1309}
            height={1580}
          />
        </div>
        <div className="order-1 md:order-2">
          <span className="olho olho-so text-rasp">Quem é</span>
          <h2 className="mt-4 font-serifa text-3xl font-bold text-rasp md:text-4xl">
            Fernanda Félix Bitencourt
          </h2>
          <p className="mt-5 leading-relaxed text-apoio">
            Nascida em Ponte Nova em 10 de maio de 1992, Fernanda construiu sua
            trajetória na cidade antes da vida pública, com trabalho como
            cabeleireira e presença nas redes como comunicadora. Em 2024,
            filiada ao AGIR, disputou pela primeira vez uma eleição e conquistou
            uma cadeira na Câmara Municipal.
          </p>
          <p className="mt-4 font-semibold text-rasp">
            2024 · Eleita vereadora com 530 votos
          </p>
          <p className="font-semibold text-texto">
            2025 · Posse para o mandato 2025/2028
          </p>
          <p className="mt-5 text-sm leading-relaxed text-apoio">
            Uma representante de primeira viagem no Legislativo de Ponte Nova,
            com o compromisso de aproximar o gabinete da população.
          </p>
          <a
            href="#prioridades"
            className="mt-8 inline-block rounded-md bg-rasp px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-raspesc active:translate-y-px"
          >
            Ver as prioridades
          </a>
        </div>
      </div>
    </section>
  );
}

// Temas de plataforma — RASCUNHO plausível para a vereadora revisar e confirmar.
// Não são declaração publicada dela; ajustar quando o gabinete enviar o programa.
const PRIORIDADES = [
  {
    titulo: "Valorização da mulher",
    texto:
      "Apoio ao protagonismo feminino na cidade e a políticas de acolhimento e oportunidade para as mulheres de Ponte Nova.",
  },
  {
    titulo: "Direitos e cidadania",
    texto:
      "Defesa dos direitos da população e de um gabinete de portas abertas para quem precisa ser ouvido.",
  },
  {
    titulo: "Atenção aos bairros",
    texto:
      "Olhar para as demandas do dia a dia dos bairros: infraestrutura, serviços e qualidade de vida.",
  },
  {
    titulo: "Transparência e participação",
    texto:
      "Prestação de contas do mandato e canais para a população acompanhar e participar das decisões.",
  },
];

function Prioridades() {
  return (
    <section id="prioridades" className="scroll-mt-16 bg-palesky">
      <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-24">
        <span className="olho olho-so text-rasp">Compromissos</span>
        <h2 className="mt-4 font-serifa text-3xl font-bold text-rasp md:text-5xl">
          Prioridades do mandato
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-apoio">
          As frentes de trabalho que orientam a atuação na Câmara Municipal de
          Ponte Nova.
        </p>
        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {PRIORIDADES.map((p, i) => (
            <div key={p.titulo} className="prioridade">
              <span className="prioridade-num text-3xl md:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-serifa text-xl font-bold text-texto">
                {p.titulo}
              </h3>
              <p className="mt-2 leading-relaxed text-apoio">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mensagem() {
  return (
    <section aria-label="Mensagem" className="aba-mensagem">
      <div className="mx-auto max-w-4xl px-5 py-24 text-center md:px-8 md:py-32">
        <p className="font-serifa text-2xl font-bold leading-snug text-white md:text-4xl md:leading-tight">
          Um mandato para servir Ponte Nova, com respeito às pessoas e trabalho
          de perto com a população.
        </p>
        <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-palesky" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-palesky">
          Fernanda Bitenco
          <span className="mt-2 block text-xs font-normal normal-case tracking-normal text-white/60">
            Vereadora de Ponte Nova · mandato 2025/2028
          </span>
        </p>
      </div>
    </section>
  );
}

// Atos reais da Câmara Municipal (usados quando o feed ao vivo ainda não
// retornou material suficiente). Ambos verificáveis no portal oficial.
const ATOS_CURADOS = [
  {
    data: "1 jan 2025",
    titulo: "Posse dos eleitos para o quadriênio 2025/2028",
    texto:
      "Fernanda Bitenco tomou posse como vereadora de Ponte Nova para o mandato 2025/2028, na cerimônia de abertura da nova legislatura.",
    fonte:
      "https://www.pontenova.mg.leg.br/institucional/noticias/eleitos-para-o-quadrienio-2025-2028-tomam-posse-em-1o-de-janeiro",
  },
  {
    data: "2025",
    titulo: "Câmara com Elas celebra o protagonismo feminino",
    texto:
      "A Câmara Municipal de Ponte Nova reuniu cerca de 800 pessoas em evento dedicado à valorização e ao protagonismo das mulheres na cidade.",
    fonte:
      "https://www.pontenova.mg.leg.br/institucional/noticias/i-camara-com-elas-reune-800-pessoas-em-celebracao-ao-protagonismo-feminino",
  },
];

function NaMidia({ noticias }: { noticias: Noticia[] }) {
  // usa as notícias ao vivo quando há material suficiente; senão, cai para a
  // lista curada de atos reais (o site nunca fica vazio ou desatualizado)
  const aoVivo = noticias.length >= 2;
  const itens = aoVivo
    ? noticias.map((n) => ({
        data: n.data,
        titulo: n.titulo,
        texto: n.resumo || "Notícia da Câmara Municipal de Ponte Nova.",
        fonte: n.link,
      }))
    : ATOS_CURADOS;
  return (
    <section id="na-midia" className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-24">
        <span className="olho olho-so text-rasp">Atuação</span>
        <h2 className="mt-4 font-serifa text-3xl font-bold text-rasp md:text-5xl">
          Na Mídia
        </h2>
        <p className="mt-3 text-sm font-medium text-apoio">
          {aoVivo
            ? "Atualizado automaticamente com as notícias mais recentes da Câmara Municipal de Ponte Nova."
            : "Atos do mandato registrados no portal oficial da Câmara, com data e link para a fonte."}
        </p>
        <div className="mt-10 space-y-6">
          {itens.map((ato) => (
            <a
              key={ato.fonte}
              href={ato.fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="linha-atuacao cartao-vivo block rounded-xl border-l-4 border-rasp bg-white p-7 shadow-[0_12px_30px_rgba(143,18,70,0.10)]"
            >
              {ato.data && (
                <p className="text-xs font-bold uppercase tracking-wide text-raspclaro">
                  {ato.data}
                </p>
              )}
              <h3 className="mt-1 font-serifa text-lg font-bold text-rasp">
                {ato.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-apoio">{ato.texto}</p>
              <p className="mt-3 text-sm font-bold text-rasp">
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
            className="inline-block rounded-md border border-rasp px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-rasp transition-colors hover:bg-rasp hover:text-white active:translate-y-px"
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
    <section id="contato" className="scroll-mt-16 bg-palesky">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <span className="olho olho-so text-rasp">Contato</span>
        <h2 className="mt-4 font-serifa text-3xl font-bold text-rasp md:text-5xl">
          Fale com o gabinete
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-serifa text-lg font-bold text-texto">
              Gabinete na Câmara Municipal
            </h3>
            <p className="mt-4 leading-relaxed text-apoio">
              Câmara Municipal de Ponte Nova
              <br />
              Ponte Nova · Minas Gerais
            </p>
            <p className="mt-3 leading-relaxed text-apoio">
              Atendimento de segunda a sexta, das 12h às 18h
            </p>
            <p className="mt-3 font-semibold text-rasp">
              <a className="hover:text-raspclaro" href="tel:+553138193250">
                (31) 3819-3250
              </a>
              <br />
              <a
                className="break-all hover:text-raspclaro"
                href="mailto:camara@pontenova.mg.leg.br"
              >
                camara@pontenova.mg.leg.br
              </a>
            </p>
          </div>
          <div className="md:text-right">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-rasp px-9 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-raspesc active:translate-y-px"
            >
              Fale comigo
            </a>
            <div className="mt-7 flex gap-3 md:justify-end">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da vereadora"
                className="cartao-vivo flex h-11 w-11 items-center justify-center rounded-lg bg-rasp text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4.2" />
                  <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
                </svg>
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
    <footer className="bg-raspesc text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="marca-fern border-b border-white/20 pb-2 text-xl text-white">
            Fernanda Bitenco
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Vereadora de Ponte Nova (MG)
            <br />
            Mandato 2025/2028
          </p>
        </div>
        <div>
          <h3 className="border-b border-white/20 pb-2 text-lg font-bold">Links</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><a className="hover:text-palesky" href="#inicio">Início</a></li>
            <li><a className="hover:text-palesky" href="#quem-e">Quem é</a></li>
            <li><a className="hover:text-palesky" href="#prioridades">Prioridades</a></li>
            <li><a className="hover:text-palesky" href="#na-midia">Na Mídia</a></li>
            <li><a className="hover:text-palesky" href="#contato">Contato</a></li>
          </ul>
        </div>
        <div>
          <h3 className="border-b border-white/20 pb-2 text-lg font-bold">Contato</h3>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Câmara Municipal de Ponte Nova
            <br />
            (31) 3819-3250
            <br />
            camara@pontenova.mg.leg.br
          </p>
          <div className="mt-4">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da vereadora"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-2xl">
            © 2026 Mandato da vereadora Fernanda Bitenco · Conteúdo baseado em
            fontes públicas: Câmara Municipal de Ponte Nova, Justiça Eleitoral e
            imprensa local.
          </p>
          <p className="shrink-0 text-white/70">
            Desenvolvido por{" "}
            <span className="marca-fern text-white">Gois Group</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
