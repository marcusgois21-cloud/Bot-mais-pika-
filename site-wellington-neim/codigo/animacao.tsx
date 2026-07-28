import { useEffect, useState } from "react";

/* Contador que sobe até o valor final. No servidor (e para quem prefere
 * menos movimento) o valor final é mostrado direto, sem truque de opacidade. */
export function Contador({ ate, duracao = 1400 }: { ate: number; duracao?: number }) {
  const [valor, setValor] = useState(ate);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // O valor final já está na tela; a contagem só começa quando o navegador
    // desenha o primeiro quadro. Se nada desenhar, o número certo permanece.
    let quadro = 0;
    let inicio = 0;
    const passo = (agora: number) => {
      if (!inicio) inicio = agora;
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(ate * suave));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [ate, duracao]);

  return <>{valor.toLocaleString("pt-BR")}</>;
}

/* Diz se a página já rolou (a navegação ganha um filete de sombra). */
export function useRolou() {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ler = () => setRolou(window.scrollY > 8);
    ler();
    window.addEventListener("scroll", ler, { passive: true });
    return () => window.removeEventListener("scroll", ler);
  }, []);
  return rolou;
}
