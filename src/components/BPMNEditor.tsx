import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { Save, X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export interface BPMNNode {
  id: string;
  type: 'start' | 'task' | 'decision' | 'end';
  label: string;
  x: number;
  y: number;
}

export interface BPMNConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface BPMNDiagram {
  nodes: BPMNNode[];
  connections: BPMNConnection[];
}

interface BPMNEditorProps {
  initialDiagram?: BPMNDiagram;
  initialXML?: string;
  onSave: (xml: string, diagram?: BPMNDiagram) => void;
  onCancel?: () => void;
}

const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const BPMNEditor: React.FC<BPMNEditorProps> = ({
  initialDiagram,
  initialXML,
  onSave,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: {
        bindTo: document
      },
      height: '100%'
    });

    modelerRef.current = modeler;

    const xmlToLoad = initialXML || EMPTY_BPMN_XML;

    modeler.importXML(xmlToLoad).then(() => {
      const canvas = modeler.get('canvas');
      canvas.zoom('fit-viewport');
      setIsReady(true);
    }).catch((err: any) => {
      console.error('Error loading BPMN diagram:', err);
      setIsReady(true);
    });

    const eventBus = modeler.get('eventBus');
    eventBus.on('commandStack.changed', () => {
      setHasChanges(true);
    });

    return () => {
      modeler.destroy();
    };
  }, []);

  const handleSave = async () => {
    if (!modelerRef.current) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      if (xml) {
        onSave(xml);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Error saving BPMN diagram:', err);
      alert('Failed to save diagram. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!modelerRef.current) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      if (xml) {
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `process-${Date.now()}.bpmn`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading BPMN diagram:', err);
    }
  };

  const handleZoomIn = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom + 0.1);
  };

  const handleZoomOut = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    const currentZoom = canvas.zoom();
    canvas.zoom(currentZoom - 0.1);
  };

  const handleZoomReset = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas');
    canvas.zoom('fit-viewport');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">BPMN Process Modeler</h3>
          {hasChanges && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Download</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">Save</span>
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Cancel</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-white"
        style={{ minHeight: '600px', height: '100%' }}
      >
        {!isReady && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-600">
        <p>
          <strong>Tips:</strong> Drag elements from the palette on the left. Click elements to edit properties.
          Use the context menu (right-click) for more options.
        </p>
      </div>
    </div>
  );
};
