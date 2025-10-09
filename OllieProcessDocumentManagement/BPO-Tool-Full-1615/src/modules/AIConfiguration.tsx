import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Edit2, Trash2, Power, PowerOff, Save, X } from 'lucide-react';

interface RoutingRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  actions: any;
  target_category: string | null;
  target_priority: string | null;
  is_active: boolean;
  priority_order: number;
}

interface ModelConfig {
  id: string;
  feature_name: string;
  is_enabled: boolean;
  model_type: string | null;
  confidence_threshold: number;
  parameters: any;
}

export const AIConfiguration = () => {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesResponse, configsResponse] = await Promise.all([
        supabase.from('ai_routing_rules').select('*').order('priority_order', { ascending: false }),
        supabase.from('ai_model_config').select('*').order('feature_name'),
      ]);

      if (rulesResponse.data) setRules(rulesResponse.data);
      if (configsResponse.data) setModelConfigs(configsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading AI configuration:', error);
      setLoading(false);
    }
  };

  const toggleRuleActive = async (ruleId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('ai_routing_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId);
      loadData();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const toggleFeature = async (featureName: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('ai_model_config')
        .update({ is_enabled: !currentStatus })
        .eq('feature_name', featureName);
      loadData();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await supabase.from('ai_routing_rules').delete().eq('id', ruleId);
      loadData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
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
          <h2 className="text-2xl font-bold text-slate-800">AI Configuration</h2>
          <p className="text-slate-600 mt-1">Manage AI routing rules and model settings</p>
        </div>
        <button
          onClick={() => setShowRuleForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="text-slate-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-800">AI Features</h3>
        </div>

        <div className="space-y-4">
          {modelConfigs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 capitalize">
                  {config.feature_name.replace(/_/g, ' ')}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span>Type: {config.model_type || 'N/A'}</span>
                  <span>Confidence: {(config.confidence_threshold * 100).toFixed(0)}%</span>
                </div>
              </div>

              <button
                onClick={() => toggleFeature(config.feature_name, config.is_enabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  config.is_enabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {config.is_enabled ? <Power size={16} /> : <PowerOff size={16} />}
                <span>{config.is_enabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Routing Rules</h3>
          <p className="text-sm text-slate-600 mt-1">
            Rules are processed in order of priority (higher first)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Rule Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Target Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">{rule.priority_order}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {rule.rule_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                      {rule.rule_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                    {rule.target_category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                    {rule.target_priority || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        rule.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rules.length === 0 && (
          <div className="text-center py-12">
            <Settings size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No routing rules configured</p>
          </div>
        )}
      </div>

      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Create New Rule</h3>
              <button
                onClick={() => setShowRuleForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., High Priority Keywords"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rule Type
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="keyword">Keyword</option>
                  <option value="pattern">Pattern</option>
                  <option value="sentiment">Sentiment</option>
                  <option value="priority">Priority</option>
                  <option value="category">Category</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="urgent, emergency, critical"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Category
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., escalation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Priority
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority Order
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  defaultValue={50}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher numbers = higher priority (processed first)
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <button
                  onClick={() => {
                    setShowRuleForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Rule
                </button>
                <button
                  onClick={() => setShowRuleForm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
