import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import ExcelJS from 'exceljs';
import pptxgen from 'pptxgenjs';

export interface ExportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  date?: Date;
}

export async function exportToPDF(content: any, type: 'sop' | 'raci' | 'risk', options: ExportOptions): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  if (options.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const dateStr = (options.date || new Date()).toLocaleDateString();
  doc.text(`Generated: ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  if (type === 'sop') {
    yPosition = await renderSOPContent(doc, content, yPosition, margin, pageWidth, pageHeight);
  } else if (type === 'raci') {
    yPosition = await renderRACIContent(doc, content, yPosition, margin, pageWidth, pageHeight);
  } else if (type === 'risk') {
    yPosition = await renderRiskContent(doc, content, yPosition, margin, pageWidth, pageHeight);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc.output('blob');
}

async function renderSOPContent(doc: jsPDF, content: string, yPos: number, margin: number, pageWidth: number, pageHeight: number): Promise<number> {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const sections = content.split('\n\n');
  let currentY = yPos;

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const heading = lines[0];

    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }

    if (heading.match(/^[A-Z\s]+:/) || heading.match(/^\d+\./)) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
    }

    const splitText = doc.splitTextToSize(section, pageWidth - 2 * margin);

    for (const line of splitText) {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      doc.text(line, margin, currentY);
      currentY += 7;
    }

    currentY += 5;
  }

  return currentY;
}

async function renderRACIContent(doc: jsPDF, content: any, yPos: number, margin: number, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = yPos;

  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      doc.setFontSize(11);
      doc.text(content, margin, currentY);
      return currentY + 10;
    }
  }

  if (content.matrix && Array.isArray(content.matrix)) {
    const tableData = content.matrix.map((row: any) => [
      row.task || '',
      row.responsible || '',
      row.accountable || '',
      row.consulted || '',
      row.informed || ''
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Task/Activity', 'Responsible', 'Accountable', 'Consulted', 'Informed']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  return currentY;
}

async function renderRiskContent(doc: jsPDF, content: any, yPos: number, margin: number, pageWidth: number, pageHeight: number): Promise<number> {
  let currentY = yPos;

  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      doc.setFontSize(11);
      doc.text(content, margin, currentY);
      return currentY + 10;
    }
  }

  if (content.risks && Array.isArray(content.risks)) {
    const tableData = content.risks.map((risk: any) => [
      risk.risk || '',
      risk.likelihood || '',
      risk.impact || '',
      risk.control || '',
      risk.mitigation || ''
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Risk', 'Likelihood', 'Impact', 'Control', 'Mitigation']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  return currentY;
}

export async function exportToDOCX(content: any, type: 'sop' | 'raci' | 'risk', options: ExportOptions): Promise<Blob> {
  const children: any[] = [];

  children.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  if (options.subtitle) {
    children.push(
      new Paragraph({
        text: options.subtitle,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );
  }

  children.push(
    new Paragraph({
      text: `Generated: ${(options.date || new Date()).toLocaleDateString()}`,
      alignment: AlignmentType.CENTER,
      italics: true,
      spacing: { after: 400 }
    })
  );

  if (type === 'sop') {
    const sections = (typeof content === 'string' ? content : JSON.stringify(content, null, 2)).split('\n\n');
    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const heading = lines[0];

      if (heading.match(/^[A-Z\s]+:/) || heading.match(/^\d+\./)) {
        children.push(
          new Paragraph({
            text: heading,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        );

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            children.push(
              new Paragraph({
                text: lines[i],
                spacing: { after: 100 }
              })
            );
          }
        }
      } else {
        children.push(
          new Paragraph({
            text: section,
            spacing: { after: 200 }
          })
        );
      }
    }
  } else if (type === 'raci') {
    const data = typeof content === 'string' ? JSON.parse(content) : content;

    if (data.matrix && Array.isArray(data.matrix)) {
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Task/Activity', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Responsible', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Accountable', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Consulted', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Informed', bold: true })] })
            ]
          }),
          ...data.matrix.map((row: any) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(row.task || '')] }),
              new TableCell({ children: [new Paragraph(row.responsible || '')] }),
              new TableCell({ children: [new Paragraph(row.accountable || '')] }),
              new TableCell({ children: [new Paragraph(row.consulted || '')] }),
              new TableCell({ children: [new Paragraph(row.informed || '')] })
            ]
          }))
        ]
      });
      children.push(table);
    }
  } else if (type === 'risk') {
    const data = typeof content === 'string' ? JSON.parse(content) : content;

    if (data.risks && Array.isArray(data.risks)) {
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Risk', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Likelihood', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Impact', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Control', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Mitigation', bold: true })] })
            ]
          }),
          ...data.risks.map((risk: any) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(risk.risk || '')] }),
              new TableCell({ children: [new Paragraph(risk.likelihood || '')] }),
              new TableCell({ children: [new Paragraph(risk.impact || '')] }),
              new TableCell({ children: [new Paragraph(risk.control || '')] }),
              new TableCell({ children: [new Paragraph(risk.mitigation || '')] })
            ]
          }))
        ]
      });
      children.push(table);
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  return await Packer.toBlob(doc);
}

export async function exportToXLSX(content: any, type: 'raci' | 'risk', options: ExportOptions): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = options.author || 'OllieProcess';
  workbook.created = options.date || new Date();

  const worksheet = workbook.addWorksheet(type.toUpperCase());

  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: type === 'raci' ? 'FF2980B9' : 'FFE74C3C' }
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };

  worksheet.getRow(1).height = 30;
  worksheet.addRow([]);

  const data = typeof content === 'string' ? JSON.parse(content) : content;

  if (type === 'raci' && data.matrix) {
    worksheet.addRow(['Task/Activity', 'Responsible', 'Accountable', 'Consulted', 'Informed']).font = { bold: true };

    data.matrix.forEach((row: any) => {
      worksheet.addRow([
        row.task || '',
        row.responsible || '',
        row.accountable || '',
        row.consulted || '',
        row.informed || ''
      ]);
    });

    worksheet.columns = [
      { width: 40 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 }
    ];
  } else if (type === 'risk' && data.risks) {
    worksheet.addRow(['Risk', 'Likelihood', 'Impact', 'Control', 'Mitigation']).font = { bold: true };

    data.risks.forEach((risk: any) => {
      worksheet.addRow([
        risk.risk || '',
        risk.likelihood || '',
        risk.impact || '',
        risk.control || '',
        risk.mitigation || ''
      ]);
    });

    worksheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 30 },
      { width: 30 }
    ];
  }

  const headerRow = worksheet.getRow(3);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 3) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportToPPTX(content: any, type: 'sop' | 'raci' | 'risk', options: ExportOptions): Promise<Blob> {
  const pres = new pptxgen();

  const titleSlide = pres.addSlide();
  titleSlide.background = { color: type === 'raci' ? '2980B9' : type === 'risk' ? 'E74C3C' : '27AE60' };
  titleSlide.addText(options.title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle'
  });

  if (options.subtitle) {
    titleSlide.addText(options.subtitle, {
      x: 0.5,
      y: 4.0,
      w: 9,
      h: 0.5,
      fontSize: 24,
      color: 'FFFFFF',
      align: 'center'
    });
  }

  titleSlide.addText(`Generated: ${(options.date || new Date()).toLocaleDateString()}`, {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.3,
    fontSize: 14,
    italic: true,
    color: 'FFFFFF',
    align: 'center'
  });

  const data = typeof content === 'string' ? JSON.parse(content) : content;

  if (type === 'raci' && data.matrix) {
    const rows = [
      [
        { text: 'Task/Activity', options: { bold: true, color: 'FFFFFF', fill: '2980B9' } },
        { text: 'Responsible', options: { bold: true, color: 'FFFFFF', fill: '2980B9' } },
        { text: 'Accountable', options: { bold: true, color: 'FFFFFF', fill: '2980B9' } },
        { text: 'Consulted', options: { bold: true, color: 'FFFFFF', fill: '2980B9' } },
        { text: 'Informed', options: { bold: true, color: 'FFFFFF', fill: '2980B9' } }
      ],
      ...data.matrix.map((row: any) => [
        row.task || '',
        row.responsible || '',
        row.accountable || '',
        row.consulted || '',
        row.informed || ''
      ])
    ];

    const chunkSize = 10;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slide = pres.addSlide();
      slide.addText('RACI Matrix', { x: 0.5, y: 0.3, fontSize: 24, bold: true });

      const chunk = [rows[0], ...rows.slice(Math.max(1, i), i + chunkSize)];
      slide.addTable(chunk, {
        x: 0.5,
        y: 1.0,
        w: 9,
        fontSize: 11,
        border: { pt: 1, color: '999999' }
      });
    }
  } else if (type === 'risk' && data.risks) {
    const rows = [
      [
        { text: 'Risk', options: { bold: true, color: 'FFFFFF', fill: 'E74C3C' } },
        { text: 'Likelihood', options: { bold: true, color: 'FFFFFF', fill: 'E74C3C' } },
        { text: 'Impact', options: { bold: true, color: 'FFFFFF', fill: 'E74C3C' } },
        { text: 'Control', options: { bold: true, color: 'FFFFFF', fill: 'E74C3C' } },
        { text: 'Mitigation', options: { bold: true, color: 'FFFFFF', fill: 'E74C3C' } }
      ],
      ...data.risks.map((risk: any) => [
        risk.risk || '',
        risk.likelihood || '',
        risk.impact || '',
        risk.control || '',
        risk.mitigation || ''
      ])
    ];

    const chunkSize = 8;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slide = pres.addSlide();
      slide.addText('Risk & Control Matrix', { x: 0.5, y: 0.3, fontSize: 24, bold: true });

      const chunk = [rows[0], ...rows.slice(Math.max(1, i), i + chunkSize)];
      slide.addTable(chunk, {
        x: 0.5,
        y: 1.0,
        w: 9,
        fontSize: 10,
        border: { pt: 1, color: '999999' }
      });
    }
  } else if (type === 'sop') {
    const sections = (typeof content === 'string' ? content : JSON.stringify(content, null, 2)).split('\n\n');

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const heading = lines[0];
      const body = lines.slice(1).join('\n');

      const slide = pres.addSlide();
      slide.addText(heading, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 24,
        bold: true,
        color: '27AE60'
      });

      if (body) {
        slide.addText(body, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4.5,
          fontSize: 14,
          valign: 'top'
        });
      }
    }
  }

  const buffer = await pres.write({ outputType: 'arraybuffer' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}

export async function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
