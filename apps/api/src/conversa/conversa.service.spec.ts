import { ConversaService } from './conversa.service';
import { ExtracaoRDO } from '../ai/esquema';
import { DatabaseService } from '../database/database.service';

function extracao(parcial: Partial<ExtracaoRDO> = {}): ExtracaoRDO {
  return {
    obra_mencionada: null,
    data: null,
    clima: null,
    atividades: [],
    materiais: [],
    equipamentos: [],
    mao_de_obra: [],
    horas_trabalhadas: null,
    ocorrencias: [],
    proximas_atividades: [],
    observacoes: null,
    campos_pendentes: [],
    confianca: 0.8,
    ...parcial,
  };
}

describe('ConversaService.mesclar', () => {
  const servico = new ConversaService({} as DatabaseService);

  it('devolve a nova extração quando não há rascunho anterior', () => {
    const nova = extracao({ atividades: [{ etapa: 'Concretagem', local: null, descricao: null, quantidade: null, unidade: null }] });
    expect(servico.mesclar(undefined, nova)).toBe(nova);
  });

  it('completa a atividade do primeiro áudio com a resposta do segundo', () => {
    // Cenário real: "terminamos a concretagem" → "bloco B, 12 metros"
    const primeiro = extracao({
      atividades: [{ etapa: 'Concretagem', local: null, descricao: null, quantidade: null, unidade: null }],
    });
    const segundo = extracao({
      atividades: [{ etapa: 'Concretagem', local: 'Bloco B', descricao: null, quantidade: 12, unidade: 'm3' }],
    });

    const r = servico.mesclar(primeiro, segundo);

    // Uma atividade completa, não duas pela metade.
    expect(r.atividades).toHaveLength(1);
    expect(r.atividades[0].local).toBe('Bloco B');
    expect(r.atividades[0].quantidade).toBe(12);
  });

  it('acumula atividades diferentes do mesmo dia', () => {
    const manha = extracao({
      atividades: [{ etapa: 'Concretagem', local: 'Bloco B', descricao: null, quantidade: null, unidade: null }],
    });
    const tarde = extracao({
      atividades: [{ etapa: 'Alvenaria', local: 'Bloco A', descricao: null, quantidade: null, unidade: null }],
    });

    expect(servico.mesclar(manha, tarde).atividades).toHaveLength(2);
  });

  it('completa a quantidade de um material citado antes sem número', () => {
    const antes = extracao({ materiais: [{ nome: 'concreto', quantidade: null, unidade: null }] });
    const depois = extracao({ materiais: [{ nome: 'concreto', quantidade: 12, unidade: 'm3' }] });

    const r = servico.mesclar(antes, depois);

    expect(r.materiais).toHaveLength(1);
    expect(r.materiais[0].quantidade).toBe(12);
  });

  it('não sobrescreve escalar já preenchido pelo primeiro relato', () => {
    const antes = extracao({ clima: 'Ensolarado', horas_trabalhadas: 8 });
    const depois = extracao({ clima: 'Chuvoso', horas_trabalhadas: 4 });

    const r = servico.mesclar(antes, depois);

    expect(r.clima).toBe('Ensolarado');
    expect(r.horas_trabalhadas).toBe(8);
  });

  it('acumula ocorrências em vez de substituir', () => {
    const antes = extracao({
      ocorrencias: [{ tipo: 'problema', gravidade: 'baixa', descricao: 'Falta de material', epi_citado: [] }],
    });
    const depois = extracao({
      ocorrencias: [{ tipo: 'seguranca', gravidade: 'alta', descricao: 'Sem capacete', epi_citado: ['capacete'] }],
    });

    // Perder um registro de segurança na mesclagem seria inaceitável.
    expect(servico.mesclar(antes, depois).ocorrencias).toHaveLength(2);
  });

  it('usa sempre as pendências mais recentes', () => {
    const antes = extracao({ campos_pendentes: [{ campo: 'local', pergunta: 'Qual bloco?' }] });
    const depois = extracao({ campos_pendentes: [] });

    // O usuário respondeu: a pendência antiga não pode ressuscitar.
    expect(servico.mesclar(antes, depois).campos_pendentes).toHaveLength(0);
  });

  it('não duplica equipamentos repetidos entre turnos', () => {
    const antes = extracao({ equipamentos: ['bomba de concreto'] });
    const depois = extracao({ equipamentos: ['bomba de concreto', 'betoneira'] });

    expect(servico.mesclar(antes, depois).equipamentos).toEqual([
      'bomba de concreto',
      'betoneira',
    ]);
  });
});
