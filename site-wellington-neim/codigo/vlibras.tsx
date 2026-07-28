import { useEffect } from "react";

/* Widget oficial de tradução em Libras do Governo Federal (VLibras).
 * Carrega o plugin só no navegador e monta a estrutura que ele exige. */
export function VLibras() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector("[vw]")) return;

    const wrap = document.createElement("div");
    wrap.setAttribute("vw", "");
    wrap.className = "enabled";
    wrap.innerHTML =
      '<div vw-access-button class="active"></div>' +
      '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(wrap);

    const s = document.createElement("script");
    s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    s.async = true;
    s.onload = () => {
      try {
        // @ts-expect-error carregado pelo script externo
        new window.VLibras.Widget("https://vlibras.gov.br/app");
      } catch {
        /* se o serviço do governo estiver fora, o site segue normal */
      }
    };
    document.body.appendChild(s);
  }, []);

  return null;
}
