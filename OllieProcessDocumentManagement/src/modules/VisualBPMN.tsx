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
  bpmn_xml: string | null;
  diagram_data: BPMNDiagram | null;
  created_at: string;
}

export const VisualBPMN: React.FC = () => {
  const { user } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
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
    setShowFormModal(true);
  };

  const handleFormSubmit = () => {
    if (!formData.name.trim()) {
      alert('Please enter a process name');
      return;
    }
    setShowFormModal(false);
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

  const handleSaveDiagram = async (xml: string) => {
    try {
      const dataToSave = {
        ...formData,
        bpmn_xml: xml,
        owner_id: user?.id,
      };

      let processId = editingProcess?.id;

      if (editingProcess) {
        const { error } = await supabase
          .from('processes')
          .update(dataToSave)
          .eq('id', editingProcess.id);
        if (error) throw error;
      } else {
        const { data: newProcess, error } = await supabase
          .from('processes')
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;

        processId = newProcess.id;
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

  const renderFormModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold">New Process</h3>
          <p className="text-sm text-gray-600 mt-1">Enter process details before opening the modeler</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Process Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Customer Onboarding Process"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., HR, Finance, Operations"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe what this process does..."
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={() => setShowFormModal(false)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Modeler
          </button>
        </div>
      </div>
    </div>
  );

  const renderViewer = () => {
    if (!viewingProcess?.bpmn_xml) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No diagram data available</p>
        </div>
      );
    }

    return (
      <div className="h-screen">
        <BPMNEditor
          initialXML={viewingProcess.bpmn_xml}
          onSave={() => setShowViewer(false)}
          onCancel={() => setShowViewer(false)}
        />
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
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{formData.name || 'Untitled Process'}</h2>
            <p className="text-sm text-gray-600">{formData.category}</p>
          </div>
          <div className="text-sm text-gray-500">
            Status: <span className="font-medium">{formData.status}</span>
          </div>
        </div>
        <div className="flex-1">
          <BPMNEditor
            initialXML={editingProcess?.bpmn_xml || undefined}
            onSave={handleSaveDiagram}
            onCancel={() => {
              setShowEditor(false);
              setEditingProcess(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (showViewer) {
    return renderViewer();
  }

  return (
    <div className="space-y-6">
      {showFormModal && renderFormModal()}

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
              {process.bpmn_xml ? 'Diagram available' : 'No diagram'}
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
              {process.status === 'active' && process.bpmn_xml && (
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
