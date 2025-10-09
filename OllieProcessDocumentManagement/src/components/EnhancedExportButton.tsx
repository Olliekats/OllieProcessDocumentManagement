import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileText, File, Table, Presentation } from 'lucide-react';
import { exportSOPToPDF, exportRACIToPDF, exportRiskToPDF, downloadFile } from '../utils/professionalDocumentExport';
import { exportBPMNAsPNG, exportBPMNAsPDF, downloadBPMN } from '../utils/bpmnUtils';

interface EnhancedExportButtonProps {
  artifactType: 'sop' | 'raci' | 'risk' | 'bpmn';
  content: any;
  title: string;
  subtitle?: string;
}

export default function EnhancedExportButton({ artifactType, content, title, subtitle }: EnhancedExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExport = async (format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'xml' | 'png') => {
    setShowMenu(false);
    setExporting(true);
    try {
      if (!content) {
        throw new Error('No content available for export');
      }

      const options = {
        title,
        subtitle,
        author: 'OllieProcess',
        date: new Date(),
        processCode: 'BP-001',
        version: '1.0'
      };

      const timestamp = new Date().toISOString().split('T')[0];
      const baseFilename = `${title.replace(/\s+/g, '_')}_${timestamp}`;

      if (artifactType === 'bpmn') {
        const bpmnContent = typeof content === 'string' ? content : content?.bpmn_xml || '';
        if (!bpmnContent) {
          throw new Error('No BPMN content found');
        }

        if (format === 'xml') {
          const blob = new Blob([bpmnContent], { type: 'application/xml' });
          await downloadBPMN(blob, `${baseFilename}.bpmn`);
        } else if (format === 'png') {
          const blob = await exportBPMNAsPNG(bpmnContent, 2);
          await downloadBPMN(blob, `${baseFilename}.png`);
        } else if (format === 'pdf') {
          const blob = await exportBPMNAsPDF(bpmnContent);
          await downloadBPMN(blob, `${baseFilename}.pdf`);
        }
      } else if (format === 'pdf') {
        let blob: Blob;

        if (artifactType === 'sop') {
          blob = await exportSOPToPDF(content, options);
        } else if (artifactType === 'raci') {
          blob = await exportRACIToPDF(content, options);
        } else if (artifactType === 'risk') {
          blob = await exportRiskToPDF(content, options);
        } else {
          throw new Error('Unsupported artifact type');
        }

        await downloadFile(blob, `${baseFilename}.pdf`);
      } else {
        alert(`${format.toUpperCase()} export coming soon. PDF export is available now.`);
        return;
      }

      setShowMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export document: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console for details.`);
    } finally {
      setExporting(false);
    }
  };

  const getAvailableFormats = () => {
    if (artifactType === 'bpmn') {
      return [
        { format: 'xml' as const, icon: FileText, label: 'BPMN XML (Editable)', description: 'Editable BPMN diagram' },
        { format: 'png' as const, icon: File, label: 'PNG Image', description: 'High-resolution image' },
        { format: 'pdf' as const, icon: FileText, label: 'PDF Document', description: 'Printable format' }
      ];
    }

    const formats = [
      { format: 'pdf' as const, icon: FileText, label: 'PDF Document', description: 'Professional PDF with pagination' },
      { format: 'docx' as const, icon: File, label: 'Word Document', description: 'Editable Microsoft Word format' },
      { format: 'pptx' as const, icon: Presentation, label: 'PowerPoint', description: 'Presentation slides' }
    ];

    if (artifactType === 'raci' || artifactType === 'risk') {
      formats.splice(2, 0, {
        format: 'xlsx' as const,
        icon: Table,
        label: 'Excel Spreadsheet',
        description: 'Editable spreadsheet format'
      });
    }

    return formats;
  };

  const handleToggleMenu = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 320
      });
    }
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const menuContent = showMenu && createPortal(
    <div
      ref={menuRef}
      className="fixed w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`
      }}
    >
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Export Format</h3>
        <p className="text-xs text-gray-500 mt-1">Choose your preferred format</p>
      </div>
      <div className="p-2">
              {getAvailableFormats().map(({ format, icon: Icon, label, description }) => (
                <button
                  key={format}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(format);
                  }}
                  disabled={exporting}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                  </div>
                </button>
              ))}
      </div>
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-600">
          All exports include proper formatting, pagination, and professional styling.
        </p>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleMenu}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        {exporting ? 'Exporting...' : 'Export'}
      </button>
      {menuContent}
    </>
  );
}
