import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { RdoCompleto } from '../rdo/rdo.repository';

/**
 * Renderiza o RDO em PDF.
 *
 * O layout segue a convenção do RDO impresso que engenheiro e fiscalização já
 * conhecem: cabeçalho de identificação, blocos por assunto e rodapé com a
 * origem do dado. Documento gerado por IA precisa parecer documento de obra,
 * não relatório de software.
 */
@Injectable()
export class RelatorioPdfService {
  private static readonly AZUL = '#1e3a5c';
  private static readonly CINZA = '#5b6470';
  private static readonly LINHA = '#d5dae1';

  async gerarRdo(dados: RdoCompleto): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    const pedacos: Buffer[] = [];
    doc.on('data', (c: Buffer) => pedacos.push(c));

    const pronto = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(pedacos)));
    });

    this.cabecalho(doc, dados);
    this.identificacao(doc, dados);
    this.atividades(doc, dados);
    this.recursos(doc, dados);
    this.ocorrencias(doc, dados);
    this.encerramento(doc, dados);
    this.rodape(doc);

    doc.end();
    return pronto;
  }

  private cabecalho(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    const [ano, mes, dia] = dados.rdo.data.split('-');

    doc.rect(0, 0, doc.page.width, 90).fill(RelatorioPdfService.AZUL);
    doc
      .fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('RELATÓRIO DIÁRIO DE OBRA', 50, 30);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`${dados.rdo.obra_nome}  ·  ${dia}/${mes}/${ano}`, 50, 58);

    doc.fillColor('#000000').y = 115;
  }

  private identificacao(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    const linhas: Array<[string, string]> = [
      ['Obra', dados.rdo.obra_nome],
      ['Endereço', dados.rdo.endereco ?? '—'],
      ['Responsável pelo registro', dados.rdo.autor_nome ?? '—'],
      ['Clima', dados.rdo.clima ?? 'Não informado'],
      ['Efetivo total', dados.rdo.efetivo_total ? String(dados.rdo.efetivo_total) : '—'],
      ['Jornada', dados.rdo.horas_trabalhadas ? `${dados.rdo.horas_trabalhadas} h` : '—'],
    ];

    this.secao(doc, 'Identificação');
    for (const [rotulo, valor] of linhas) {
      doc
        .fontSize(9)
        .fillColor(RelatorioPdfService.CINZA)
        .font('Helvetica-Bold')
        .text(rotulo.toUpperCase(), { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(`   ${valor}`);
      doc.moveDown(0.25);
    }
    doc.moveDown(0.6);
  }

  private atividades(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    this.secao(doc, 'Serviços executados');

    if (!dados.atividades.length) {
      this.vazio(doc, 'Nenhum serviço registrado.');
      return;
    }

    for (const a of dados.atividades) {
      const quantidade =
        a.quantidade != null ? ` — ${a.quantidade}${a.unidade ? ` ${a.unidade}` : ''}` : '';
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(`• ${String(a.etapa)}${a.local ? ` (${String(a.local)})` : ''}${quantidade}`);

      if (a.descricao) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(RelatorioPdfService.CINZA)
          .text(String(a.descricao), { indent: 12 });
      }
      doc.moveDown(0.35);
    }
    doc.moveDown(0.5);
  }

  private recursos(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    if (dados.maoDeObra.length) {
      this.secao(doc, 'Mão de obra');
      const texto = dados.maoDeObra
        .map((m) => `${m.quantidade} ${String(m.funcao)}`)
        .join('  ·  ');
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(texto);
      doc.moveDown(0.8);
    }

    if (dados.equipamentos.length) {
      this.secao(doc, 'Equipamentos');
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(dados.equipamentos.map((e) => String(e.nome)).join('  ·  '));
      doc.moveDown(0.8);
    }
  }

  private ocorrencias(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    if (!dados.ocorrencias.length) return;

    this.secao(doc, 'Ocorrências');
    for (const o of dados.ocorrencias) {
      const critica = o.gravidade === 'alta' || o.gravidade === 'critica';
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(critica ? '#b3261e' : '#8a6100')
        .text(`[${String(o.tipo).toUpperCase()} · ${String(o.gravidade)}]`, { continued: true })
        .font('Helvetica')
        .fillColor('#000000')
        .text(`  ${String(o.descricao)}`);
      doc.moveDown(0.35);
    }
    doc.moveDown(0.5);
  }

  private encerramento(doc: PDFKit.PDFDocument, dados: RdoCompleto): void {
    if (dados.rdo.observacoes) {
      this.secao(doc, 'Observações');
      doc.fontSize(10).font('Helvetica').fillColor('#000000').text(dados.rdo.observacoes);
      doc.moveDown(0.8);
    }

    if (dados.rdo.proximas_atividades?.length) {
      this.secao(doc, 'Próximas atividades');
      for (const p of dados.rdo.proximas_atividades) {
        doc.fontSize(10).font('Helvetica').text(`• ${p}`);
      }
      doc.moveDown(0.8);
    }

    if (dados.fotos.length) {
      this.secao(doc, 'Registro fotográfico');
      doc
        .fontSize(9)
        .fillColor(RelatorioPdfService.CINZA)
        .text(`${dados.fotos.length} foto(s) anexada(s):`);
      for (const f of dados.fotos) {
        doc.text(`• ${String(f.etapa ?? 'Sem classificação')} — ${String(f.legenda ?? '')}`, {
          indent: 12,
        });
      }
    }
  }

  private rodape(doc: PDFKit.PDFDocument): void {
    const total = doc.bufferedPageRange().count;

    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 45;

      doc
        .moveTo(50, y - 8)
        .lineTo(doc.page.width - 50, y - 8)
        .strokeColor(RelatorioPdfService.LINHA)
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(7.5)
        .fillColor(RelatorioPdfService.CINZA)
        .font('Helvetica')
        .text(
          'Documento gerado pela ObraIA a partir de registros de campo. ' +
            'Nenhum dado foi estimado automaticamente.',
          50,
          y,
          { width: doc.page.width - 140, lineBreak: false },
        )
        .text(`${i + 1}/${total}`, doc.page.width - 85, y, { width: 35, align: 'right' });
    }
  }

  private secao(doc: PDFKit.PDFDocument, titulo: string): void {
    // Quebra de página antes de um título órfão no pé da folha.
    if (doc.y > doc.page.height - 130) doc.addPage();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(RelatorioPdfService.AZUL)
      .text(titulo.toUpperCase());

    doc
      .moveTo(50, doc.y + 2)
      .lineTo(doc.page.width - 50, doc.y + 2)
      .strokeColor(RelatorioPdfService.AZUL)
      .lineWidth(1)
      .stroke();

    doc.moveDown(0.6).fillColor('#000000');
  }

  private vazio(doc: PDFKit.PDFDocument, texto: string): void {
    doc.fontSize(9).font('Helvetica-Oblique').fillColor(RelatorioPdfService.CINZA).text(texto);
    doc.moveDown(0.8).font('Helvetica').fillColor('#000000');
  }
}
