import React, { useState, useRef, useEffect } from 'react';
import { Plus, Square, Circle, Diamond, ArrowRight, Trash2, Save, Move } from 'lucide-react';

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
  onSave: (diagram: BPMNDiagram) => void;
  onCancel?: () => void;
}

export const BPMNEditor: React.FC<BPMNEditorProps> = ({ initialDiagram, onSave, onCancel }) => {
  const [nodes, setNodes] = useState<BPMNNode[]>(initialDiagram?.nodes || []);
  const [connections, setConnections] = useState<BPMNConnection[]>(initialDiagram?.connections || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add'>('select');
  const [nodeType, setNodeType] = useState<BPMNNode['type']>('task');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = (x: number, y: number) => {
    const newNode: BPMNNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${nodes.length + 1}`,
      x,
      y,
    };
    setNodes([...nodes, newNode]);
    setMode('select');
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
  };

  const updateNodeLabel = (nodeId: string, label: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, label } : n));
  };

  const startConnection = (nodeId: string) => {
    setConnectingFrom(nodeId);
  };

  const completeConnection = (toNodeId: string) => {
    if (connectingFrom && connectingFrom !== toNodeId) {
      const newConnection: BPMNConnection = {
        id: `conn-${Date.now()}`,
        from: connectingFrom,
        to: toNodeId,
      };
      setConnections([...connections, newConnection]);
    }
    setConnectingFrom(null);
  };

  const deleteConnection = (connId: string) => {
    setConnections(connections.filter(c => c.id !== connId));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'add' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addNode(x, y);
    } else {
      setSelectedNode(null);
    }
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'select') {
      setSelectedNode(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setDraggingNode(nodeId);
        setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x + nodes.find(n => n.id === draggingNode)!.x;
      const y = e.clientY - rect.top - dragOffset.y + nodes.find(n => n.id === draggingNode)!.y;
      setNodes(nodes.map(n =>
        n.id === draggingNode ? { ...n, x, y } : n
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const getNodeCenter = (node: BPMNNode) => {
    const width = 120;
    const height = 60;
    return { x: node.x + width / 2, y: node.y + height / 2 };
  };

  const handleSave = () => {
    onSave({ nodes, connections });
  };

  const renderNode = (node: BPMNNode) => {
    const isSelected = selectedNode === node.id;
    const isConnecting = connectingFrom === node.id;

    let nodeShape;
    switch (node.type) {
      case 'start':
        nodeShape = <Circle className="w-6 h-6" />;
        break;
      case 'task':
        nodeShape = <Square className="w-6 h-6" />;
        break;
      case 'decision':
        nodeShape = <Diamond className="w-6 h-6" />;
        break;
      case 'end':
        nodeShape = <Circle className="w-6 h-6 fill-current" />;
        break;
    }

    return (
      <div
        key={node.id}
        className={`absolute flex flex-col items-center justify-center bg-white rounded-lg shadow-lg cursor-move transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isConnecting ? 'ring-2 ring-green-500' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: 120,
          height: 60,
          transform: node.type === 'decision' ? 'rotate(45deg)' : undefined,
        }}
        onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
        onClick={(e) => {
          e.stopPropagation();
          if (connectingFrom) {
            completeConnection(node.id);
          }
        }}
      >
        <div className={node.type === 'decision' ? 'transform -rotate-45' : ''}>
          {nodeShape}
          <input
            type="text"
            value={node.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className="text-xs text-center mt-1 bg-transparent border-none focus:outline-none w-full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  const renderConnections = () => {
    return connections.map(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return null;

      const from = getNodeCenter(fromNode);
      const to = getNodeCenter(toNode);

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);
      const length = Math.sqrt(dx * dx + dy * dy);

      return (
        <div key={conn.id} className="absolute" style={{ left: from.x, top: from.y }}>
          <div
            className="bg-gray-400 hover:bg-red-500 cursor-pointer"
            style={{
              width: length,
              height: 2,
              transformOrigin: '0 50%',
              transform: `rotate(${angle}rad)`,
            }}
            onClick={() => deleteConnection(conn.id)}
          />
          <div
            className="absolute bg-gray-400"
            style={{
              left: length - 10,
              top: -4,
              width: 0,
              height: 0,
              borderLeft: '10px solid currentColor',
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              transform: `rotate(${angle}rad)`,
            }}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">BPMN Diagram Editor</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('select')}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                mode === 'select' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              <Move className="w-4 h-4" />
              Select
            </button>
            <button
              onClick={() => { setMode('add'); setNodeType('start'); }}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                mode === 'add' && nodeType === 'start' ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
            >
              <Circle className="w-4 h-4" />
              Start
            </button>
            <button
              onClick={() => { setMode('add'); setNodeType('task'); }}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                mode === 'add' && nodeType === 'task' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              <Square className="w-4 h-4" />
              Task
            </button>
            <button
              onClick={() => { setMode('add'); setNodeType('decision'); }}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                mode === 'add' && nodeType === 'decision' ? 'bg-yellow-600 text-white' : 'bg-gray-200'
              }`}
            >
              <Diamond className="w-4 h-4" />
              Decision
            </button>
            <button
              onClick={() => { setMode('add'); setNodeType('end'); }}
              className={`px-3 py-1 rounded flex items-center gap-1 ${
                mode === 'add' && nodeType === 'end' ? 'bg-red-600 text-white' : 'bg-gray-200'
              }`}
            >
              <Circle className="w-4 h-4 fill-current" />
              End
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {selectedNode && (
            <>
              <button
                onClick={() => startConnection(selectedNode)}
                className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1"
              >
                <ArrowRight className="w-4 h-4" />
                Connect
              </button>
              <button
                onClick={() => deleteNode(selectedNode)}
                className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-1 bg-gray-300 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 bg-gray-50 relative overflow-auto"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ minHeight: 600 }}
      >
        {renderConnections()}
        {nodes.map(renderNode)}

        {connectingFrom && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            Click on another node to create connection
          </div>
        )}

        {mode === 'add' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
            Click anywhere to add {nodeType} node
          </div>
        )}
      </div>
    </div>
  );
};
