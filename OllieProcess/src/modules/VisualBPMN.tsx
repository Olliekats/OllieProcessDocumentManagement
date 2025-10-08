import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CreditCard as Edit2, Trash2, Eye, Play } from 'lucide-react';
import { BPMNEditor, BPMNDiagram } from '../components/BPMNEditor';
import { startProcessInstance, createProcessVersion } from '../utils/processExecution';

interface Process {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  diagram_data: BPMNDiagram | null;
  created_at: string;
}

export const VisualBPMN: React.FC = () => {
  const { user } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [viewingProcess, setViewingProcess] = useState<Process | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'draft',
  });

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error('Error loading processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      status: 'draft',
    });
    setEditingProcess(null);
    setShowEditor(true);
  };

  const handleEdit = (process: Process) => {
    setFormData({
      name: process.name,
      description: process.description || '',
      category: process.category || '',
      status: process.status,
    });
    setEditingProcess(process);
    setShowEditor(true);
  };

  const handleView = (process: Process) => {
    setViewingProcess(process);
    setShowViewer(true);
  };

  const handleSaveDiagram = async (diagram: BPMNDiagram) => {
    try {
      const dataToSave = {
        ...formData,
        diagram_data: diagram,
        owner_id: user?.id,
      };

      let processId = editingProcess?.id;

      if (editingProcess) {
        const { error } = await supabase
          .from('processes')
          .update(dataToSave)
          .eq('id', editingProcess.id);
        if (error) throw error;

        await createProcessVersion(editingProcess.id, diagram, 'Process updated');
      } else {
        const { data: newProcess, error } = await supabase
          .from('processes')
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;

        processId = newProcess.id;
        await createProcessVersion(newProcess.id, diagram, 'Initial version');
      }

      setShowEditor(false);
      setEditingProcess(null);
      loadProcesses();
    } catch (error: any) {
      console.error('Error saving process:', error);
      alert('Failed to save process: ' + error.message);
    }
  };

  const handleExecuteProcess = async (process: Process) => {
    const instanceName = prompt('Enter a name for this process instance:');
    if (!instanceName) return;

    try {
      const instanceId = await startProcessInstance(process.id, instanceName);
      alert(`Process instance created successfully! ID: ${instanceId}`);
      loadProcesses();
    } catch (error: any) {
      console.error('Error starting process:', error);
      alert('Failed to start process: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this process?')) return;

    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
    }
  };

  const renderProcessForm = () => (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">Process Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderViewer = () => {
    if (!viewingProcess?.diagram_data) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No diagram data available</p>
        </div>
      );
    }

    const diagram = viewingProcess.diagram_data;

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{viewingProcess.name}</h3>
            <p className="text-sm text-gray-600">{viewingProcess.description}</p>
          </div>
          <button
            onClick={() => setShowViewer(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
        <div className="p-4 bg-gray-50 relative" style={{ minHeight: 600 }}>
          {diagram.connections.map(conn => {
            const fromNode = diagram.nodes.find(n => n.id === conn.from);
            const toNode = diagram.nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const from = { x: fromNode.x + 60, y: fromNode.y + 30 };
            const to = { x: toNode.x + 60, y: toNode.y + 30 };
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angle = Math.atan2(dy, dx);
            const length = Math.sqrt(dx * dx + dy * dy);

            return (
              <div key={conn.id} className="absolute" style={{ left: from.x, top: from.y }}>
                <div
                  className="bg-gray-400"
                  style={{
                    width: length,
                    height: 2,
                    transformOrigin: '0 50%',
                    transform: `rotate(${angle}rad)`,
                  }}
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
          })}
          {diagram.nodes.map(node => (
            <div
              key={node.id}
              className="absolute flex flex-col items-center justify-center bg-white rounded-lg shadow-lg"
              style={{
                left: node.x,
                top: node.y,
                width: 120,
                height: 60,
                transform: node.type === 'decision' ? 'rotate(45deg)' : undefined,
              }}
            >
              <div className={node.type === 'decision' ? 'transform -rotate-45' : ''}>
                <div className="text-xs text-center font-medium">{node.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="space-y-6">
        {renderProcessForm()}
        <BPMNEditor
          initialDiagram={editingProcess?.diagram_data || undefined}
          onSave={handleSaveDiagram}
          onCancel={() => {
            setShowEditor(false);
            setEditingProcess(null);
          }}
        />
      </div>
    );
  }

  if (showViewer) {
    return renderViewer();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visual BPMN Builder</h2>
          <p className="text-gray-600">Create and manage process diagrams visually</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Process
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processes.map(process => (
          <div key={process.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{process.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{process.description}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                process.status === 'active' ? 'bg-green-100 text-green-800' :
                process.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {process.status}
              </span>
            </div>

            {process.category && (
              <div className="mb-3">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {process.category}
                </span>
              </div>
            )}

            <div className="text-xs text-gray-500 mb-4">
              {process.diagram_data ?
                `${process.diagram_data.nodes?.length || 0} nodes, ${process.diagram_data.connections?.length || 0} connections` :
                'No diagram'
              }
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleView(process)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => handleEdit(process)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              {process.status === 'active' && process.diagram_data && (
                <button
                  onClick={() => handleExecuteProcess(process)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  title="Start Process Instance"
                >
                  <Play className="w-4 h-4" />
                  Execute
                </button>
              )}
              <button
                onClick={() => handleDelete(process.id)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {processes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 mb-4">No processes yet</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Your First Process
          </button>
        </div>
      )}
    </div>
  );
};
