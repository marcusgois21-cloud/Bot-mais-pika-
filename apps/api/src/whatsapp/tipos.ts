/**
 * Tipos do payload da WhatsApp Cloud API.
 *
 * Modelados só até onde a ObraIA usa. A Meta envia bem mais campos; ignorar o
 * resto é intencional — cada campo tipado aqui é um campo que precisamos
 * manter quando a API mudar de versão.
 */

export type TipoMensagem =
  | 'text'
  | 'audio'
  | 'image'
  | 'document'
  | 'location'
  | 'interactive'
  | 'button'
  | 'video'
  | 'sticker'
  | 'unsupported';

export interface MensagemWhatsApp {
  id: string;
  from: string; // E.164 sem "+"
  timestamp: string; // epoch em segundos, como string
  type: TipoMensagem;
  text?: { body: string };
  audio?: { id: string; mime_type: string; voice?: boolean };
  image?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; mime_type: string; filename?: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  button?: { text: string; payload: string };
  context?: { id: string }; // mensagem respondida
}

export interface StatusWhatsApp {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface WebhookWhatsApp {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: MensagemWhatsApp[];
        statuses?: StatusWhatsApp[];
      };
    }>;
  }>;
}

/** Payload normalizado que circula na fila — desacopla o resto do formato da Meta. */
export interface MensagemNormalizada {
  waMessageId: string;
  telefone: string;
  nomePerfil?: string;
  tipo: TipoMensagem;
  texto?: string;
  mediaId?: string;
  mimeType?: string;
  legenda?: string;
  localizacao?: { latitude: number; longitude: number; endereco?: string };
  respostaBotao?: { id: string; titulo: string };
  recebidaEm: Date;
}

/** Extrai as mensagens do envelope da Meta em formato plano. */
export function normalizarWebhook(payload: WebhookWhatsApp): MensagemNormalizada[] {
  const resultado: MensagemNormalizada[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const valor = change.value;
      if (!valor?.messages?.length) continue;

      const nomePorTelefone = new Map(
        (valor.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]),
      );

      for (const msg of valor.messages) {
        const base = {
          waMessageId: msg.id,
          telefone: msg.from,
          nomePerfil: nomePorTelefone.get(msg.from),
          tipo: msg.type,
          recebidaEm: new Date(Number(msg.timestamp) * 1000),
        };

        switch (msg.type) {
          case 'text':
            resultado.push({ ...base, texto: msg.text?.body });
            break;
          case 'audio':
            resultado.push({ ...base, mediaId: msg.audio?.id, mimeType: msg.audio?.mime_type });
            break;
          case 'image':
            resultado.push({
              ...base,
              mediaId: msg.image?.id,
              mimeType: msg.image?.mime_type,
              legenda: msg.image?.caption,
            });
            break;
          case 'document':
            resultado.push({
              ...base,
              mediaId: msg.document?.id,
              mimeType: msg.document?.mime_type,
              legenda: msg.document?.caption,
            });
            break;
          case 'location':
            resultado.push({
              ...base,
              localizacao: msg.location
                ? {
                    latitude: msg.location.latitude,
                    longitude: msg.location.longitude,
                    endereco: msg.location.address ?? msg.location.name,
                  }
                : undefined,
            });
            break;
          case 'interactive': {
            const resposta = msg.interactive?.button_reply ?? msg.interactive?.list_reply;
            resultado.push({
              ...base,
              texto: resposta?.title,
              respostaBotao: resposta ? { id: resposta.id, titulo: resposta.title } : undefined,
            });
            break;
          }
          case 'button':
            resultado.push({ ...base, texto: msg.button?.text });
            break;
          default:
            resultado.push(base);
        }
      }
    }
  }

  return resultado;
}
