import BpmnModeler from 'bpmn-js/lib/Modeler';

export interface BPMNExportOptions {
  title: string;
  format: 'svg' | 'png' | 'pdf' | 'xml';
  scale?: number;
}

export async function loadBPMNInEditor(xml: string, container: HTMLElement): Promise<BpmnModeler> {
  const modeler = new BpmnModeler({
    container,
    keyboard: {
      bindTo: document
    }
  });

  try {
    await modeler.importXML(xml);
    const canvas = modeler.get('canvas');
    canvas.zoom('fit-viewport');
    return modeler;
  } catch (error) {
    console.error('Error loading BPMN:', error);
    throw error;
  }
}

export async function saveBPMNFromEditor(modeler: BpmnModeler): Promise<string> {
  try {
    const { xml } = await modeler.saveXML({ format: true });
    return xml || '';
  } catch (error) {
    console.error('Error saving BPMN:', error);
    throw error;
  }
}

export async function exportBPMNAsSVG(modeler: BpmnModeler, options?: { scale?: number }): Promise<string> {
  try {
    const { svg } = await modeler.saveSVG();
    return svg || '';
  } catch (error) {
    console.error('Error exporting BPMN as SVG:', error);
    throw error;
  }
}

export async function exportBPMNAsPNG(xml: string, scale: number = 2): Promise<Blob> {
  const container = document.createElement('div');
  container.style.width = '2000px';
  container.style.height = '2000px';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const modeler = new BpmnModeler({ container });
    await modeler.importXML(xml);

    const canvas = modeler.get('canvas');
    canvas.zoom('fit-viewport');

    const { svg } = await modeler.saveSVG();

    const blob = await svgToPng(svg, scale);

    document.body.removeChild(container);
    modeler.destroy();

    return blob;
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}

async function svgToPng(svgString: string, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
}

export async function exportBPMNAsPDF(xml: string): Promise<Blob> {
  const pngBlob = await exportBPMNAsPNG(xml, 2);

  const jsPDF = (await import('jspdf')).default;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imgData = reader.result as string;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const img = new Image();
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

        const width = imgWidth * ratio * 0.9;
        const height = imgHeight * ratio * 0.9;

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        doc.addImage(imgData, 'PNG', x, y, width, height);
        resolve(doc.output('blob'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imgData;
    };

    reader.onerror = () => reject(new Error('Failed to read PNG blob'));
    reader.readAsDataURL(pngBlob);
  });
}

export function validateBPMNXML(xml: string): boolean {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return false;
    }

    const definitions = xmlDoc.querySelector('definitions');
    if (!definitions) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function downloadBPMN(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
