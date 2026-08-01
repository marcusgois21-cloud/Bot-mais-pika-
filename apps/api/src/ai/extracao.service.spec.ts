import { ExtracaoService } from './extracao.service';
import { ChamadaFuncao, ProvedorIA } from './provedor';
import { ExtracaoRDO } from './esquema';

class ProvedorFalso implements ProvedorIA {
  resposta: Record<string, unknown> | null = null;

  async transcrever(): Promise<string> {
    return '';
  }
  async chamarComFuncao(): Promise<ChamadaFuncao | null> {
    return this.resposta ? { nome: 'registrar_rdo', argumentos: this.resposta } : null;
  }
  async analisarImagem(): Promise<string> {
    return '';
  }
}

describe('ExtracaoService', () => {
  let ia: ProvedorFalso;
  let servico: ExtracaoService;

  const obras = [
    { id: 'obra-1', nome: 'Residencial Aurora', apelidos: ['aurora', 'obra do aurora'] },
    { id: 'obra-2', nome: 'Galpão Industrial Norte', apelidos: ['galpão', 'norte'] },
  ];

  beforeEach(() => {
    ia = new ProvedorFalso();
    servico = new ExtracaoService(ia);
  });

  describe('resolverObra', () => {
    it('resolve pelo apelido usado no canteiro', () => {
      expect(servico.resolverObra('aurora', obras)?.id).toBe('obra-1');
    });

    it('ignora acento e caixa', () => {
      expect(servico.resolverObra('GALPÃO', obras)?.id).toBe('obra-2');
      expect(servico.resolverObra('galpao', obras)?.id).toBe('obra-2');
    });

    it('resolve dentro de uma frase', () => {
      expect(servico.resolverObra('na obra do aurora hoje', obras)?.id).toBe('obra-1');
    });

    it('devolve a única obra quando o usuário só tem uma, mesmo sem menção', () => {
      expect(servico.resolverObra(null, [obras[0]])?.id).toBe('obra-1');
    });

    it('devolve null quando não há menção e há várias obras', () => {
      // Preferimos perguntar a arriscar lançar o RDO na obra errada.
      expect(servico.resolverObra(null, obras)).toBeNull();
    });

    it('devolve null quando o termo é ambíguo entre obras', () => {
      const ambiguas = [
        { id: 'a', nome: 'Edifício Central', apelidos: ['central'] },
        { id: 'b', nome: 'Praça Central', apelidos: ['central'] },
      ];
      expect(servico.resolverObra('central', ambiguas)).toBeNull();
    });
  });

  describe('extrair', () => {
    const contexto = { obrasDisponiveis: obras, dataReferencia: new Date('2026-08-12') };

    it('converte a resposta do modelo no objeto validado', async () => {
      ia.resposta = {
        obra_mencionada: 'Residencial Aurora',
        data: '2026-08-12',
        atividades: [{ etapa: 'Concretagem', local: 'Bloco B', quantidade: 12, unidade: 'm3' }],
        materiais: [{ nome: 'concreto', quantidade: 12, unidade: 'm3' }],
        campos_pendentes: [],
        confianca: 0.9,
      };

      const r: ExtracaoRDO = await servico.extrair('concretamos o bloco B', contexto);

      expect(r.atividades[0].etapa).toBe('Concretagem');
      expect(r.materiais[0].quantidade).toBe(12);
      expect(r.campos_pendentes).toHaveLength(0);
    });

    it('preserva as pendências que disparam a pergunta ao usuário', async () => {
      ia.resposta = {
        obra_mencionada: null,
        atividades: [{ etapa: 'Concretagem' }],
        materiais: [],
        campos_pendentes: [
          { campo: 'local', pergunta: 'Qual bloco foi concretado?' },
          { campo: 'quantidade_material', pergunta: 'Quantos m³ de concreto?' },
        ],
        confianca: 0.7,
      };

      const r = await servico.extrair('terminamos a concretagem', contexto);

      expect(r.campos_pendentes).toHaveLength(2);
      expect(r.campos_pendentes[0].pergunta).toContain('bloco');
    });

    it('não inventa quantidade quando o relato não informa', async () => {
      ia.resposta = {
        obra_mencionada: 'Residencial Aurora',
        atividades: [{ etapa: 'Alvenaria' }],
        materiais: [{ nome: 'bloco', quantidade: null, unidade: null }],
        campos_pendentes: [{ campo: 'quantidade_material', pergunta: 'Quantos blocos?' }],
        confianca: 0.6,
      };

      const r = await servico.extrair('subimos alvenaria hoje', contexto);

      // A regra central do produto: campo vazio é aceitável; valor chutado não.
      expect(r.materiais[0].quantidade).toBeNull();
      expect(r.campos_pendentes).toHaveLength(1);
    });

    it('aceita resposta que omite os campos opcionais', async () => {
      // Regressão: o function schema só torna alguns campos obrigatórios, então
      // o modelo legitimamente omite clima, observações, descrição da atividade.
      // Exigir a chave presente descartaria uma extração boa e o usuário
      // perderia o RDO.
      ia.resposta = {
        atividades: [{ etapa: 'Alvenaria' }],
        materiais: [{ nome: 'bloco' }],
        campos_pendentes: [],
        confianca: 0.8,
      };

      const r = await servico.extrair('subimos alvenaria', contexto);

      expect(r.atividades).toHaveLength(1);
      expect(r.atividades[0].etapa).toBe('Alvenaria');
      expect(r.atividades[0].local).toBeNull();
      expect(r.clima).toBeNull();
      expect(r.materiais[0].quantidade).toBeNull();
    });

    it('devolve extração vazia quando o modelo não chama a função', async () => {
      ia.resposta = null;
      const r = await servico.extrair('bom dia', contexto);
      expect(r.confianca).toBe(0);
      expect(r.atividades).toHaveLength(0);
    });

    it('devolve extração vazia quando o modelo responde fora do schema', async () => {
      ia.resposta = { atividades: 'isto deveria ser uma lista', confianca: 'alta' };
      const r = await servico.extrair('qualquer coisa', contexto);
      expect(r.confianca).toBe(0);
    });
  });
});
