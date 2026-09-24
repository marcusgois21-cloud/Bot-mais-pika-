'use client'

import { Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Botao } from '@/components/sistema/Botao'
import { Icone, IconeErro, Seta } from '@/components/sistema/Icone'
import { Txt } from '@/components/sistema/Txt'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { contato as t } from '@/content/copy/contato'
import { texto } from '@/lib/conteudo'
import { porExtenso } from '@/lib/formatar'
import { BUILD_SHA, CONTACT_EMAIL, CONTACT_ENDPOINT } from '@/lib/env'
import {
  PROJETO,
  SOBRE_VOCE,
  camposAtivos,
  camposDoEnvio,
  ehEscolha,
  ehObrigatorio,
  ehTexto,
  ehTipo,
  limparOrigem,
  linhasPreenchidas,
  normalizarUrl,
  validarCampo,
  validarTudo,
  valorInicial,
  type Campo,
  type Erros,
  type Linha,
  type TipoProjeto,
  type Valor,
  type Valores,
} from './campos'
import { mailtoHref, mensagemComoTexto, montarMensagem } from './mailto'
import s from './Formulario.module.css'

/**
 * Formulário de /contato/ (spec §14.7, §19). Uma página, revelação progressiva por tipo, nunca wizard.
 * Renderiza completo no HTML estático: só a leitura de `?tipo=` e `?origem=` depende de JS (dentro de
 * <Suspense>, por causa do export estático). Sem JS, o formulário usa a validação nativa e envia para o
 * endpoint (ou abre o e-mail) pelo próprio `action`.
 */

type Fase = 'editando' | 'enviando' | 'falhou' | 'enviado'

const TIMEOUT_MS = 10_000
const MINIMO_MS = 3_000

const TODOS: Campo[] = [...SOBRE_VOCE, ...Object.values(PROJETO).flat()].filter(
  (c, i, lista) => lista.findIndex(o => o.id === c.id) === i,
)
const INICIAL: Valores = Object.fromEntries(TODOS.map(c => [c.id, valorInicial(c)]))

const idCampo = (id: string) => `campo-${id}`
const idOpcao = (id: string, i: number) => `campo-${id}-${i}`
const idErro = (id: string) => `erro-${id}`
const idAjuda = (id: string) => `ajuda-${id}`

/** Alvo de foco de cada campo: o próprio controle, ou a primeira opção do grupo. */
function alvoDe(id: string): string {
  if (id === 'tipo') return idOpcao('tipo', 0)
  const c = TODOS.find(x => x.id === id)
  return c && (c.controle === 'radio' || c.controle === 'checkbox') ? idOpcao(id, 0) : idCampo(id)
}
function rotuloDe(id: string): string {
  return id === 'tipo' ? t.tipo.legenda : (TODOS.find(c => c.id === id)?.rotulo ?? id)
}

function LerParametros({ aoLer }: { aoLer: (tipo: string | null, origem: string | null) => void }) {
  const params = useSearchParams()
  const tipo = params.get('tipo')
  const origem = params.get('origem')
  useEffect(() => aoLer(tipo, origem), [tipo, origem, aoLer])
  return null
}

export function Formulario() {
  const [tipo, setTipo] = useState<TipoProjeto | null>(null)
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [erros, setErros] = useState<Erros>({})
  const [resumoAtivo, setResumoAtivo] = useState(false)
  const [fase, setFase] = useState<Fase>('editando')
  const [origem, setOrigem] = useState('')
  const [enviados, setEnviados] = useState<Linha[]>([])
  const [copiado, setCopiado] = useState(false)
  const [montado, setMontado] = useState(false)
  const [foco, setFoco] = useState<{ alvo: 'resumo' | 'sucesso' | 'falha'; n: number } | null>(null)

  const inicio = useRef(0)
  const pressionado = useRef(false)
  const armadilha = useRef<HTMLInputElement>(null)
  const resumoRef = useRef<HTMLDivElement>(null)
  const sucessoRef = useRef<HTMLDivElement>(null)
  const falhaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inicio.current = Date.now()
    setMontado(true)
    // Um erro que aparece no blur empurra o que está abaixo. Se o blur veio de um clique (ponteiro
    // pressionado), a validação espera o clique terminar, para o botão não fugir de baixo do cursor.
    const baixo = () => { pressionado.current = true }
    const cima = () => { pressionado.current = false }
    document.addEventListener('pointerdown', baixo, true)
    document.addEventListener('pointerup', cima, true)
    document.addEventListener('pointercancel', cima, true)
    return () => {
      document.removeEventListener('pointerdown', baixo, true)
      document.removeEventListener('pointerup', cima, true)
      document.removeEventListener('pointercancel', cima, true)
    }
  }, [])

  const aoLer = useCallback((tipoParam: string | null, origemParam: string | null) => {
    if (ehTipo(tipoParam)) setTipo(tipoParam)
    const o = limparOrigem(origemParam)
    if (o) setOrigem(o)
  }, [])

  // Foco depois do render: resumo de erros, painel de sucesso ou primeira ação de recuperação.
  useEffect(() => {
    if (!foco) return
    if (foco.alvo === 'resumo') resumoRef.current?.focus()
    if (foco.alvo === 'sucesso') sucessoRef.current?.focus()
    if (foco.alvo === 'falha') falhaRef.current?.querySelector<HTMLElement>('button, a')?.focus()
  }, [foco])

  const ativos = camposAtivos(tipo)
  const ordem = ['tipo', ...ativos.map(c => c.id)]
  const errosVisiveis = ordem.filter(id => erros[id])
  const ocupado = fase === 'enviando'

  function definirErro(id: string, msg: string | null) {
    setErros(atual => {
      if ((atual[id] ?? null) === msg) return atual
      const novo = { ...atual }
      if (msg) novo[id] = msg
      else delete novo[id]
      return novo
    })
  }

  function mudar(c: Campo, valor: Valor) {
    setValores(v => ({ ...v, [c.id]: valor }))
    // Um erro já mostrado some assim que o campo fica certo; erro novo só no blur ou no envio.
    if (erros[c.id] && !validarCampo(c, valor, tipo)) definirErro(c.id, null)
    if (fase === 'falhou') setFase('editando')
  }

  function sair(c: Campo) {
    const validar = () => {
      let v = valores[c.id]
      if (c.controle === 'url' && typeof v === 'string' && v.trim()) {
        const n = normalizarUrl(v)
        if (n !== v && !validarCampo(c, n, tipo)) {
          v = n
          setValores(atual => ({ ...atual, [c.id]: n }))
        }
      }
      const vazio = Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim()
      if (!vazio || erros[c.id]) definirErro(c.id, validarCampo(c, v, tipo))
    }
    if (!pressionado.current) return validar()
    const depois = () => window.setTimeout(validar, 0)
    document.addEventListener('pointerup', depois, { once: true, capture: true })
  }

  function escolherTipo(novo: TipoProjeto) {
    setTipo(novo)
    setErros(atual => {
      const validos = new Set(camposAtivos(novo).map(c => c.id))
      const novoErros: Erros = {}
      for (const [id, msg] of Object.entries(atual)) if (validos.has(id)) novoErros[id] = msg
      // a exigência da empresa muda com o tipo
      const empresa = SOBRE_VOCE.find(c => c.id === 'empresa')
      if (empresa && novoErros.empresa && !validarCampo(empresa, valores.empresa, novo)) delete novoErros.empresa
      return novoErros
    })
    if (fase === 'falhou') setFase('editando')
  }

  function focarCampo(id: string) {
    const el = document.getElementById(alvoDe(id))
    if (!el) return
    const bloco = el.closest<HTMLElement>('[data-campo]') ?? el
    el.focus({ preventScroll: true })
    bloco.scrollIntoView({ block: 'center', behavior: 'auto' })
  }

  async function enviar(tipoAtual: TipoProjeto) {
    setFase('enviando')
    const controle = new AbortController()
    const limite = window.setTimeout(() => controle.abort(), TIMEOUT_MS)
    try {
      const resposta = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          tipo: tipoAtual,
          campos: camposDoEnvio(tipoAtual, valores),
          origem: origem || null,
          pagina: window.location.href,
          enviadoEm: new Date().toISOString(),
          versaoSite: BUILD_SHA,
        }),
        signal: controle.signal,
      })
      if (!resposta.ok) throw new Error(String(resposta.status))
      setEnviados(linhasPreenchidas(tipoAtual, valores))
      setFase('enviado')
      setFoco({ alvo: 'sucesso', n: Date.now() })
    } catch {
      setFase('falhou')
      setFoco({ alvo: 'falha', n: Date.now() })
    } finally {
      window.clearTimeout(limite)
    }
  }

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (ocupado) return
    const encontrados = validarTudo(tipo, valores)
    if (Object.keys(encontrados).length || !tipo) {
      setErros(encontrados)
      setResumoAtivo(true)
      setFoco({ alvo: 'resumo', n: Date.now() })
      return
    }
    setErros({})
    setResumoAtivo(false)
    // anti-spam: campo-armadilha preenchido ou envio cedo demais (< 3 s) — descartado em silêncio
    if (armadilha.current?.value || Date.now() - inicio.current < MINIMO_MS) return

    if (CONTACT_ENDPOINT) {
      void enviar(tipo)
    } else if (CONTACT_EMAIL) {
      window.location.href = mailtoHref(CONTACT_EMAIL, montarMensagem(tipo, valores, origem))
    } else {
      setFase('falhou')
      setFoco({ alvo: 'falha', n: Date.now() })
    }
  }

  async function copiarMensagem() {
    if (!tipo) return
    try {
      await navigator.clipboard.writeText(mensagemComoTexto(montarMensagem(tipo, valores, origem)))
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1200)
    } catch {
      /* sem área de transferência: o formulário continua preenchido, e o e-mail (se houver) segue ao lado */
    }
  }

  /* ── sucesso: o painel substitui o formulário ─────────────────────────────── */
  if (fase === 'enviado') {
    return (
      <div ref={sucessoRef} className={s.sucesso} role="status" tabIndex={-1} data-dentro="Confirmação de envio">
        <h2 className="t-display-m">{t.sucesso.titulo}</h2>
        <p className={`t-lead c-2 ${s.sucessoTexto}`}>{t.sucesso.texto}</p>
        <h3 className={`t-eyebrow c-3 ${s.sucessoRotulo}`}>{t.sucesso.resumo}</h3>
        <dl className={s.enviados}>
          {enviados.map(l => (
            <div key={l.id} className={s.enviado}>
              <dt className="t-small c-3">{l.rotulo}</dt>
              <dd className={s.enviadoValor}>{l.valor}</dd>
            </div>
          ))}
        </dl>
        <p className={s.voltar}>
          <TransitionLink href="/" className="link">
            <Seta dir="esquerda" />
            {t.sucesso.voltar}
          </TransitionLink>
        </p>
      </div>
    )
  }

  const acaoSemJs = CONTACT_ENDPOINT || (CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : undefined)
  const porEmail = !CONTACT_ENDPOINT && Boolean(CONTACT_EMAIL)
  const mensagem = tipo ? montarMensagem(tipo, valores, origem) : null

  return (
    <form
      className={s.form}
      action={acaoSemJs}
      method="post"
      encType={porEmail ? 'text/plain' : undefined}
      noValidate={montado}
      aria-labelledby="contato-titulo"
      aria-busy={ocupado || undefined}
      onSubmit={aoEnviar}
      data-dentro="Formulário de entrada"
    >
      <Suspense fallback={null}>
        <LerParametros aoLer={aoLer} />
      </Suspense>

      {resumoAtivo && errosVisiveis.length > 0 && (
        <div ref={resumoRef} className={s.resumo} tabIndex={-1} aria-labelledby="resumo-erros" data-dentro="Resumo dos ajustes">
          <h2 id="resumo-erros" className={s.resumoTitulo}>
            <IconeErro className={s.iconeErro} />
            {t.erros.resumo(errosVisiveis.length, porExtenso(errosVisiveis.length))}
          </h2>
          <ul className={s.resumoLista}>
            {errosVisiveis.map(id => (
              <li key={id}>
                <a
                  href={`#${alvoDe(id)}`}
                  className={s.resumoLink}
                  onClick={e => {
                    e.preventDefault()
                    focarCampo(id)
                  }}
                >
                  <span className={s.resumoRotulo}>{rotuloDe(id)}</span>
                  <span className={s.resumoMensagem}>{erros[id]}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1 · O que você quer construir? */}
      <fieldset
        className={`${s.bloco} ${erros.tipo ? s.grupoComErro : ''}`}
        aria-describedby={erros.tipo ? idErro('tipo') : undefined}
        data-campo=""
        data-dentro="Pergunta principal: o tipo de projeto"
      >
        <legend className={s.legenda}>
          <span className="t-display-m">{t.tipo.legenda}</span>
          <span className={s.obrigatorio}>{t.obrigatorio}</span>
        </legend>
        {erros.tipo && <MensagemErro id={idErro('tipo')} texto={erros.tipo} />}
        <div className={s.tipos}>
          {t.tipo.opcoes.map((o, i) => (
            <div key={o.valor} className={s.tipo} data-marcado={tipo === o.valor || undefined}>
              <input
                type="radio"
                className={s.radio}
                id={idOpcao('tipo', i)}
                name="tipo"
                value={o.valor}
                checked={tipo === o.valor}
                required
                disabled={ocupado}
                aria-invalid={erros.tipo ? true : undefined}
                aria-describedby={`apoio-tipo-${i}`}
                onChange={() => escolherTipo(o.valor)}
              />
              <label htmlFor={idOpcao('tipo', i)} className={`t-title ${s.tipoTitulo}`}>
                {o.titulo}
              </label>
              <p id={`apoio-tipo-${i}`} className={s.tipoApoio}>
                {o.apoio}
              </p>
            </div>
          ))}
        </div>
      </fieldset>

      {/* 2 · Sobre você */}
      <fieldset className={s.bloco} data-dentro="Dados de contato">
        <legend className={s.legenda}>
          <span className="t-display-m">{t.sobreVoce.legenda}</span>
        </legend>
        <div className={s.grade}>
          {SOBRE_VOCE.map(c => (
            <CampoView key={c.id} campo={c} tipo={tipo} valor={valores[c.id]} erro={erros[c.id]} ocupado={ocupado} mudar={mudar} sair={sair} />
          ))}
        </div>
      </fieldset>

      {/* 3 · Sobre o projeto (varia com o tipo; aparece com fade de 240 ms) */}
      {tipo && (
        <fieldset key={tipo} className={`${s.bloco} ${s.revela}`} data-dentro="Perguntas sobre o projeto">
          <legend className={s.legenda}>
            <span className="t-display-m">{t.projeto.legenda}</span>
          </legend>
          <div className={s.grade}>
            {PROJETO[tipo].map(c => (
              <CampoView key={c.id} campo={c} tipo={tipo} valor={valores[c.id]} erro={erros[c.id]} ocupado={ocupado} mudar={mudar} sair={sair} />
            ))}
          </div>
        </fieldset>
      )}

      {/* anti-spam: fora da tela e fora do foco */}
      <div className={s.armadilha} aria-hidden="true">
        <label htmlFor="campo-website">{t.armadilha}</label>
        <input ref={armadilha} id="campo-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name="origem" value={origem} />

      <div className={s.final}>
        <p className={`t-small c-2 ${s.privacidade}`} data-dentro="Aviso de privacidade">
          <Txt t={t.privacidade.texto} /> {t.privacidade.antesDoLink}{' '}
          <TransitionLink href={t.privacidade.href} className="link">
            {t.privacidade.link}
          </TransitionLink>
          .
        </p>

        {fase === 'falhou' ? (
          <div ref={falhaRef} className={s.falha} data-dentro="Falha no envio, com saídas">
            <p className={s.falhaTexto} role="alert">
              <IconeErro className={s.iconeErro} />
              <span>
                <strong className={s.falhaTitulo}>{t.falha.titulo}</strong> {t.falha.texto}
              </span>
            </p>
            <div className={s.acoes}>
              {CONTACT_ENDPOINT && (
                <Botao type="submit" seta>
                  {t.falha.tentar}
                </Botao>
              )}
              {CONTACT_EMAIL && mensagem && (
                <Botao href={mailtoHref(CONTACT_EMAIL, mensagem)} variante="secundario">
                  {t.falha.email}
                </Botao>
              )}
              <Botao variante="secundario" onClick={copiarMensagem}>
                {copiado ? t.falha.copiado : t.falha.copiar}
              </Botao>
            </div>
            <span className="sr-only" aria-live="polite">
              {copiado ? t.falha.copiadoAnuncio : ''}
            </span>
          </div>
        ) : (
          <div className={s.envio}>
            <Botao type="submit" seta disabled={ocupado} className={s.enviar} data-dentro="Botão de envio">
              {ocupado ? t.envio.enviando : porEmail ? t.envio.porEmail : t.envio.enviar}
            </Botao>
            {porEmail && <p className="t-small c-2">{t.envio.porEmailNota}</p>}
            <span className="sr-only" aria-live="polite">
              {ocupado ? t.envio.enviando : ''}
            </span>
          </div>
        )}
      </div>
    </form>
  )
}

function MensagemErro({ id, texto: msg }: { id: string; texto: string }) {
  return (
    <p id={id} className={s.erro}>
      <IconeErro className={s.iconeErro} />
      <span>{msg}</span>
    </p>
  )
}

function Rotulo({ campo, tipo }: { campo: Campo; tipo: TipoProjeto | null }) {
  return (
    <>
      <span>{campo.rotulo}</span>
      {ehObrigatorio(campo, tipo) && <span className={s.obrigatorio}>{t.obrigatorio}</span>}
    </>
  )
}

type PropsCampo = {
  campo: Campo
  tipo: TipoProjeto | null
  valor: Valor | undefined
  erro: string | undefined
  ocupado: boolean
  mudar: (c: Campo, v: Valor) => void
  sair: (c: Campo) => void
}

function CampoView({ campo: c, tipo, valor, erro, ocupado, mudar, sair }: PropsCampo) {
  const obrigatorio = ehObrigatorio(c, tipo)
  const invalido = erro ? true : undefined

  if (ehEscolha(c)) {
    const marcados = Array.isArray(valor) ? valor : valor ? [valor] : []
    return (
      <fieldset
        className={`${s.grupo} ${s.inteiro} ${erro ? s.grupoComErro : ''}`}
        aria-describedby={erro ? idErro(c.id) : undefined}
        data-campo=""
      >
        <legend className={s.rotulo}>
          <Rotulo campo={c} tipo={tipo} />
        </legend>
        {erro && <MensagemErro id={idErro(c.id)} texto={erro} />}
        <div className={c.controle === 'checkbox' ? s.opcoesDuplas : s.opcoes}>
          {c.opcoes.map((o, i) => {
            const v = texto(o)
            const marcado = marcados.includes(v)
            return (
              <label key={v} className={s.opcao} htmlFor={idOpcao(c.id, i)}>
                <input
                  type={c.controle}
                  className={c.controle === 'radio' ? s.radio : s.caixa}
                  id={idOpcao(c.id, i)}
                  name={c.id}
                  value={v}
                  checked={marcado}
                  required={c.controle === 'radio' && obrigatorio}
                  disabled={ocupado}
                  aria-invalid={invalido}
                  onChange={e => {
                    if (c.controle === 'radio') mudar(c, v)
                    else mudar(c, e.target.checked ? [...marcados, v] : marcados.filter(m => m !== v))
                  }}
                />
                <span>
                  <Txt t={o} />
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    )
  }

  const linha = ehTexto(c) ? c : null
  const ajuda = linha?.ajuda
  const descritores = [ajuda && !erro ? idAjuda(c.id) : '', erro ? idErro(c.id) : ''].filter(Boolean).join(' ') || undefined
  const largura = linha?.meia ? s.meia : s.inteiro
  const comum = {
    id: idCampo(c.id),
    name: c.id,
    required: obrigatorio,
    disabled: ocupado,
    'aria-invalid': invalido,
    'aria-describedby': descritores,
    onBlur: () => sair(c),
  }

  return (
    <div className={`${s.campo} ${largura} ${erro ? s.comErro : ''}`} data-campo="">
      <label htmlFor={idCampo(c.id)} className={s.rotulo}>
        <Rotulo campo={c} tipo={tipo} />
      </label>
      {c.controle === 'textarea' ? (
        <textarea {...comum} className={s.area} rows={5} value={String(valor ?? '')} onChange={e => mudar(c, e.target.value)} />
      ) : c.controle === 'select' ? (
        <span className={s.selectCaixa}>
          <select {...comum} className={s.controle} value={String(valor ?? '')} onChange={e => mudar(c, e.target.value)}>
            {c.opcoes.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Icone nome="seta-baixo" className={s.selectIcone} />
        </span>
      ) : (
        linha && (
          <input
            {...comum}
            className={s.controle}
            type={linha.controle}
            autoComplete={linha.autocomplete}
            placeholder={linha.placeholder}
            spellCheck={linha.controle === 'email' || linha.controle === 'url' ? false : undefined}
            autoCapitalize={linha.controle === 'email' || linha.controle === 'url' ? 'none' : undefined}
            inputMode={linha.controle === 'url' ? 'url' : undefined}
            value={String(valor ?? '')}
            onChange={e => mudar(c, e.target.value)}
          />
        )
      )}
      {ajuda && !erro && (
        <p id={idAjuda(c.id)} className={s.ajuda}>
          {ajuda}
        </p>
      )}
      {erro && <MensagemErro id={idErro(c.id)} texto={erro} />}
    </div>
  )
}
