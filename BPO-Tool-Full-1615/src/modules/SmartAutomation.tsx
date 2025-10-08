import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, CreditCard as Edit, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { WorkflowBuilder } from '../components/WorkflowBuilder';

export const SmartAutomation: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data } = await supabase
        .from('workflow_automations_enhanced')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (workflow: any) => {
    try {
      const user = await supabase.auth.getUser();
      if (workflow.id) {
        await supabase
          .from('workflow_automations_enhanced')
          .update({
            name: workflow.name,
            flow_diagram: workflow.flow_diagram,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workflow.id);
      } else {
        await supabase
          .from('workflow_automations_enhanced')
          .insert({
            name: workflow.name,
            flow_diagram: workflow.flow_diagram,
            created_by: user.data.user?.id,
          });
      }

      await loadWorkflows();
      setShowBuilder(false);
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase
      .from('workflow_automations_enhanced')
      .update({ is_active: !isActive })
      .eq('id', id);
    await loadWorkflows();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await supabase.from('workflow_automations_enhanced').delete().eq('id', id);
      await loadWorkflows();
    }
  };

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Smart Automation</h1>
          <p className="text-slate-600 mt-1">Build no-code workflow automations</p>
        </div>
        <button
          onClick={() => {
            setEditingWorkflow(null);
            setShowBuilder(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <Zap size={20} className={workflow.is_active ? 'text-green-600' : 'text-slate-400'} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{workflow.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {workflow.description && (
              <p className="text-sm text-slate-600 mb-4">{workflow.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <span>{workflow.flow_diagram?.nodes?.length || 0} nodes</span>
              <span>•</span>
              <span>{workflow.execution_count || 0} executions</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(workflow.id, workflow.is_active)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  workflow.is_active
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {workflow.is_active ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => handleEdit(workflow)}
                className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(workflow.id)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Zap size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Workflows Yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first automation workflow to streamline repetitive tasks
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Workflow
          </button>
        </div>
      )}

      {showBuilder && (
        <WorkflowBuilder
          workflow={editingWorkflow}
          onSave={handleSave}
          onClose={() => {
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
};
