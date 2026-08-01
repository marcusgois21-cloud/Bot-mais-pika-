# Melhorias futuras

O que existe hoje é o MVP: o loop de áudio → RDO funcionando ponta a ponta, com
estoque, cronograma, segurança, financeiro e BI apoiados nele. Este documento
lista o que vem depois e — mais importante — **por que nessa ordem**.

---

## Fase 2 · Fechar as lacunas do MVP

Antes de qualquer recurso novo de IA, o que falta para o produto ser confiável:

| Item | Motivo |
|---|---|
| Testes de integração (Testcontainers) | Hoje o caminho webhook → fila → banco não tem cobertura automática |
| Painel completo (obras, RDOs, conversas, financeiro) | Existe o dashboard; as demais telas estão no contrato da API mas não na UI |
| Login no painel ligado ao front | A API tem JWT; o painel ainda renderiza dados de exemplo |
| Cache de transcrição por hash | Corta custo de IA em reenvios e retentativas |
| Varredura de malware na mídia | Ponto de extensão já previsto em `StorageService.salvar` |
| Relatório semanal/mensal automático | O RDO existe; a agregação e o envio por template ainda não |
| Medição de custo de IA por obra | É o principal custo variável e hoje não é atribuído |

---

## Fase 3 · Visão computacional de verdade

O que hoje é classificação de foto pode virar medição.

**Evolução por embeddings.** O schema já reserva `fotos.embedding` (pgvector).
Falta o pipeline que gera o vetor e agrupa fotos da mesma frente ao longo do
tempo, montando uma linha de evolução automática por ângulo.

**Fiscal de EPI.** Detecção de capacete, cinto e bota em imagem, gerando
ocorrência de segurança automática. O gancho já existe — hoje o risco é
detectado pelo modelo multimodal e vira ocorrência; um detector dedicado seria
muito mais confiável.

> **Cuidado deliberado:** isso identifica *equipamento*, não *pessoa*.
> Reconhecimento facial de trabalhadores está fora do escopo por decisão de
> produto e por LGPD — dado biométrico é dado sensível, e a função aqui é
> segurança do trabalho, não vigilância de indivíduo.

**Progresso por captura 360º.** Medir avanço físico por ambiente comparando
capturas periódicas, substituindo o percentual informado à mão.

---

## Fase 4 · Inteligência preditiva

O BI atual calcula o que já aconteceu e projeta de forma linear. O passo
seguinte exige histórico:

- **Previsão de atraso** por padrão de execução, não por extrapolação linear.
  Só faz sentido com algumas obras concluídas na base.
- **Curva S projetada** de custo até a conclusão.
- **Detecção de desperdício**: consumo de material por m² acima da média das
  obras da própria empresa.
- **Sugestão de recuperação de cronograma**: onde alocar efetivo para recuperar
  prazo, dado o caminho crítico.

Ordem importa: modelo preditivo com três meses de dado produz número bonito e
errado. A extrapolação linear atual é honesta sobre sua imprecisão.

---

## Fase 5 · Ecossistema

- **Integração com ERPs** de construção (Sienge e similares). É a tese de longo
  prazo: ser a camada de captura por WhatsApp que alimenta o ERP que a
  construtora já usa, em vez de tentar substituí-lo.
- **API pública** para parceiros.
- **Marketplace de fornecedores**: o pedido de compra gerado pela IA vira
  cotação automática.
- **Orçamento por conversa**: IA generativa monta orçamento e cronograma
  inicial a partir de descrição em linguagem natural.

---

## Melhorias de conversa

Pequenas, mas de alto impacto na adoção:

- **Resposta em áudio** para quem está de mãos ocupadas — conversa 100% por voz.
- **Agente proativo** que cobra o RDO ("faltou o registro da frente 2 hoje") em
  vez de esperar. Exige template aprovado pela Meta (janela de 24h).
- **Comandos por voz** para consulta ("como está o estoque da aurora?").
- **Multi-idioma**, para equipes com trabalhadores estrangeiros.

---

## Dívida técnica conhecida

Registrada para não virar surpresa:

1. **`OrquestradorService` está grande.** Concentra roteamento, fluxo de RDO,
   estoque e comandos. Quando crescer mais, separar por caso de uso.
2. **Sem fallback entre provedores de IA.** A abstração `ProvedorIA` já existe;
   falta a lógica de queda para um secundário quando o primário falha.
3. **Retenção de mídia não tem job de expurgo.** A variável
   `MEDIA_RETENTION_DAYS` está definida e documentada, mas o processo agendado
   que apaga a mídia vencida ainda precisa ser escrito — é requisito de LGPD.
4. **Painel sem estado de carregamento e erro** ligados à API real.
5. **`BiService` sem cobertura de teste** nos cálculos de curva S e projeção.
