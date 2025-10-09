import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProcessMap {
  id: string;
  process_id: string;
  name: string;
  description: string;
  map_type: string;
  diagram_data: any;
  version: string;
  status: string;
  created_at: string;
}

export const ProcessMapping: React.FC = () => {
  const { user } = useAuth();
  const [maps, setMaps] = useState<ProcessMap[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    process_id: '',
    name: '',
    description: '',
    map_type: 'flowchart',
    status: 'draft',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mapsData, processesData] = await Promise.all([
        supabase.from('process_maps').select('*').order('created_at', { ascending: false }),
        supabase.from('processes').select('*'),
      ]);

      if (mapsData.data) setMaps(mapsData.data);
      if (processesData.data) setProcesses(processesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('process_maps').insert({
        ...formData,
        diagram_data: { nodes: [], edges: [] },
        created_by: user?.id,
      });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        process_id: '',
        name: '',
        description: '',
        map_type: 'flowchart',
        status: 'draft',
      });
      loadData();
    } catch (error) {
      console.error('Error creating map:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this process map?')) return;

    try {
      await supabase.from('process_maps').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting map:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Process Mapping</h1>
          <p className="text-slate-600 mt-1">Visual process documentation and flow diagrams</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Map
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Create Process Map</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Process
                </label>
                <select
                  value={formData.process_id}
                  onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Process</option>
                  {processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Map Type</label>
                <select
                  value={formData.map_type}
                  onChange={(e) => setFormData({ ...formData, map_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="flowchart">Flowchart</option>
                  <option value="swimlane">Swimlane</option>
                  <option value="value_stream">Value Stream</option>
                  <option value="data_flow">Data Flow</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save size={20} />
                Create Map
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maps.map((map) => (
          <div
            key={map.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-1">{map.name}</h3>
                <p className="text-sm text-slate-600">{map.description}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Type:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {map.map_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Version:</span>
                <span className="font-medium text-slate-800">{map.version}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    map.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {map.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(map.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {maps.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-600">No process maps yet. Create your first one!</p>
        </div>
      )}
    </div>
  );
};
