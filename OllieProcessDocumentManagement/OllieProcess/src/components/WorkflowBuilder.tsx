import React, { useState, useRef, useEffect } from 'react';
import { Play, Plus, Trash2, Save, Settings, Zap, Clock, GitBranch, Mail, Bell, Database, Webhook } from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subtype: string;
  label: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface WorkflowBuilderProps {
  workflow?: {
    id?: string;
    name: string;
    flow_diagram: {
      nodes: WorkflowNode[];
      connections: WorkflowConnection[];
    };
  };
  onSave: (workflow: any) => void;
  onClose: () => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflow, onSave, onClose }) => {
  const [name, setName] = useState(workflow?.name || '');
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.flow_diagram?.nodes || []);
  const [connections, setConnections] = useState<WorkflowConnection[]>(workflow?.flow_diagram?.connections || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'add'>('select');
  const [nodeToAdd, setNodeToAdd] = useState<'trigger' | 'action' | 'condition' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nodeTypes = {
    trigger: [
      { subtype: 'schedule', label: 'Schedule', icon: Clock },
      { subtype: 'event', label: 'Event', icon: Zap },
      { subtype: 'webhook', label: 'Webhook', icon: Webhook },
    ],
    action: [
      { subtype: 'email', label: 'Send Email', icon: Mail },
      { subtype: 'notification', label: 'Send Notification', icon: Bell },
      { subtype: 'create_task', label: 'Create Task', icon: Plus },
      { subtype: 'update_field', label: 'Update Field', icon: Database },
      { subtype: 'api_call', label: 'API Call', icon: Webhook },
    ],
    condition: [
      { subtype: 'if', label: 'If Condition', icon: GitBranch },
    ],
  };

  useEffect(() => {
    drawCanvas();
  }, [nodes, connections, selectedNode]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x + 50, fromNode.y + 30);
        ctx.lineTo(toNode.x + 50, toNode.y + 30);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        const midX = (fromNode.x + toNode.x) / 2 + 50;
        const midY = (fromNode.y + toNode.y) / 2 + 30;
        ctx.beginPath();
        ctx.arc(midX, midY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX - 5, midY - 5);
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + 5, midY - 5);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    nodes.forEach(node => {
      const isSelected = selectedNode === node.id;

      let color = '#3b82f6';
      if (node.type === 'trigger') color = '#10b981';
      if (node.type === 'condition') color = '#f59e0b';

      ctx.fillStyle = isSelected ? color : 'white';
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 2;

      if (node.type === 'condition') {
        ctx.beginPath();
        ctx.moveTo(node.x + 50, node.y);
        ctx.lineTo(node.x + 100, node.y + 30);
        ctx.lineTo(node.x + 50, node.y + 60);
        ctx.lineTo(node.x, node.y + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(node.x, node.y, 100, 60);
        ctx.strokeRect(node.x, node.y, 100, 60);
      }

      ctx.fillStyle = isSelected ? 'white' : color;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x + 50, node.y + 30);
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'add' && nodeToAdd) {
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: nodeToAdd,
        subtype: nodeTypes[nodeToAdd][0].subtype,
        label: nodeTypes[nodeToAdd][0].label,
        config: {},
        x: x - 50,
        y: y - 30,
      };
      setNodes([...nodes, newNode]);
      setMode('select');
      setNodeToAdd(null);
      return;
    }

    if (connectingFrom) {
      const clickedNode = nodes.find(n =>
        x >= n.x && x <= n.x + 100 && y >= n.y && y <= n.y + 60
      );
      if (clickedNode && clickedNode.id !== connectingFrom) {
        const newConnection: WorkflowConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: clickedNode.id,
        };
        setConnections([...connections, newConnection]);
        setConnectingFrom(null);
      }
      return;
    }

    const clickedNode = nodes.find(n =>
      x >= n.x && x <= n.x + 100 && y >= n.y && y <= n.y + 60
    );
    setSelectedNode(clickedNode ? clickedNode.id : null);
  };

  const handleConnect = () => {
    if (selectedNode) {
      setConnectingFrom(selectedNode);
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      setNodes(nodes.filter(n => n.id !== selectedNode));
      setConnections(connections.filter(c => c.from !== selectedNode && c.to !== selectedNode));
      setSelectedNode(null);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    onSave({
      id: workflow?.id,
      name,
      flow_diagram: { nodes, connections },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Workflow Builder</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow Name"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Zap size={16} />
                  Triggers
                </h3>
                <div className="space-y-2">
                  {nodeTypes.trigger.map((type) => (
                    <button
                      key={type.subtype}
                      onClick={() => {
                        setMode('add');
                        setNodeToAdd('trigger');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-colors text-sm"
                    >
                      <type.icon size={16} className="text-green-600" />
                      <span className="text-slate-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Play size={16} />
                  Actions
                </h3>
                <div className="space-y-2">
                  {nodeTypes.action.map((type) => (
                    <button
                      key={type.subtype}
                      onClick={() => {
                        setMode('add');
                        setNodeToAdd('action');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm"
                    >
                      <type.icon size={16} className="text-blue-600" />
                      <span className="text-slate-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <GitBranch size={16} />
                  Logic
                </h3>
                <div className="space-y-2">
                  {nodeTypes.condition.map((type) => (
                    <button
                      key={type.subtype}
                      onClick={() => {
                        setMode('add');
                        setNodeToAdd('condition');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-sm"
                    >
                      <type.icon size={16} className="text-orange-600" />
                      <span className="text-slate-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center gap-2">
              <button
                onClick={() => setMode('select')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Select
              </button>
              {selectedNode && (
                <>
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-white text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <GitBranch size={16} />
                    Connect
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
              {connectingFrom && (
                <span className="text-sm text-blue-600 font-medium">
                  Click a node to connect...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-white p-4">
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                onClick={handleCanvasClick}
                className="border border-slate-200 rounded-lg cursor-crosshair"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Save size={18} />
            Save Workflow
          </button>
        </div>
      </div>
    </div>
  );
};
