import { createServerFn } from "@tanstack/react-start";

/* Mantém a seção "Na Mídia" atualizada sozinha, sem intervenção manual.
 * Fonte: o feed RSS oficial da Câmara Municipal de Ponte Nova, filtrado pelo
 * nome do vereador. É conteúdo oficial e verificável (nunca boato). Se a busca
 * falhar, o site cai para a lista curada de atos (nunca fica vazio). */

export type Noticia = {
  titulo: string;
  resumo: string;
  data: string;
  link: string;
  tipo: "requerimento" | "noticia";
};

// separa a atuação legislativa (requerimentos/projetos) das notícias gerais
const RE_REQUERIMENTO =
  /vereador\s+(pede|solicita|cobra|requer|apresenta|prop|indica|defende)|requerimento|projeto de lei|indica[cç][aã]o/i;

const FEED =
  "https://www.pontenova.mg.leg.br/search_rss" +
  "?SearchableText=Wellington+Neim&sort_on=Date&sort_order=descending";

const MESES_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function limpar(texto: string): string {
  return texto
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function formatarData(iso: string): string {
  const m = iso.match(/(\d{4})[/-](\d{2})[/-](\d{2})/);
  if (!m) return "";
  const dia = parseInt(m[3], 10);
  const mes = MESES_PT[parseInt(m[2], 10) - 1] ?? "";
  return `${dia} ${mes} ${m[1]}`;
}

function pegar(bloco: string, tag: string): string {
  const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? limpar(m[1]) : "";
}

export const getNoticias = createServerFn({ method: "GET" }).handler(
  async (): Promise<Noticia[]> => {
    try {
      const resp = await fetch(FEED, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; wellington-neim-site/1.0; +https://wellington-neim.higgsfield.app)",
        },
        // cache de 30 min na borda: mantém fresco sem pesar no servidor da Câmara
        cf: { cacheTtl: 1800, cacheEverything: true },
      } as RequestInit);
      if (!resp.ok) return [];
      const xml = await resp.text();

      const itens: Noticia[] = [];
      // divide só nos itens reais (<item rdf:about=...>), sem casar a tag
      // container <items> que lista os links no topo do feed RDF
      for (const bloco of xml.split(/<item\s/).slice(1)) {
        // só itens realmente ligados ao vereador
        if (!bloco.includes("Wellington Neim")) continue;
        const titulo = pegar(bloco, "title");
        const link = pegar(bloco, "link");
        if (!titulo || !link) continue;
        const resumo = pegar(bloco, "description");
        const tipo: Noticia["tipo"] = RE_REQUERIMENTO.test(`${titulo} ${resumo}`)
          ? "requerimento"
          : "noticia";
        itens.push({
          titulo,
          resumo,
          data: formatarData(pegar(bloco, "dc:date")),
          link,
          tipo,
        });
        if (itens.length >= 16) break;
      }
      return itens;
    } catch {
      return [];
    }
  },
);
