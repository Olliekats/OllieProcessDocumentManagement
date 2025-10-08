import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Plus, Edit2, Trash2, Users, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ApprovalRule {
  id: string;
  entity_type: string;
  approval_level: number;
  role_required: string;
  amount_min: number | null;
  amount_max: number | null;
  requires_all: boolean;
  auto_escalate_hours: number;
  active: boolean;
}

interface ApprovalAssignment {
  id: string;
  user_id: string;
  approval_role: string;
  entity_types: string[];
  max_amount: number | null;
  department: string | null;
  active: boolean;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export const ApprovalMatrixManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'assignments'>('rules');
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [assignments, setAssignments] = useState<ApprovalAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ApprovalAssignment | null>(null);

  const [ruleForm, setRuleForm] = useState({
    entity_type: 'sop',
    approval_level: 1,
    role_required: 'manager',
    amount_min: null as number | null,
    amount_max: null as number | null,
    requires_all: false,
    auto_escalate_hours: 24,
    active: true
  });

  const [assignmentForm, setAssignmentForm] = useState({
    user_id: '',
    approval_role: 'manager',
    entity_types: [] as string[],
    max_amount: null as number | null,
    department: '',
    active: true
  });

  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, assignmentsRes, usersRes] = await Promise.all([
        supabase.from('approval_matrix').select('*').order('entity_type, approval_level'),
        supabase.from('approval_assignments').select('*, user_profiles(full_name, email)'),
        supabase.from('user_profiles').select('user_id, email, full_name')
      ]);

      if (rulesRes.data) setRules(rulesRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
      if (usersRes.data) setUsers(usersRes.data.map(u => ({ id: u.user_id, email: u.email, full_name: u.full_name })));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      if (editingRule) {
        await supabase.from('approval_matrix').update(ruleForm).eq('id', editingRule.id);
      } else {
        await supabase.from('approval_matrix').insert(ruleForm);
      }
      setShowRuleForm(false);
      setEditingRule(null);
      resetRuleForm();
      loadData();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this approval rule?')) return;
    try {
      await supabase.from('approval_matrix').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleSaveAssignment = async () => {
    try {
      if (editingAssignment) {
        await supabase.from('approval_assignments').update(assignmentForm).eq('id', editingAssignment.id);
      } else {
        await supabase.from('approval_assignments').insert({
          ...assignmentForm,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });
      }
      setShowAssignmentForm(false);
      setEditingAssignment(null);
      resetAssignmentForm();
      loadData();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Remove this approval assignment?')) return;
    try {
      await supabase.from('approval_assignments').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const resetRuleForm = () => {
    setRuleForm({
      entity_type: 'sop',
      approval_level: 1,
      role_required: 'manager',
      amount_min: null,
      amount_max: null,
      requires_all: false,
      auto_escalate_hours: 24,
      active: true
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      user_id: '',
      approval_role: 'manager',
      entity_types: [],
      max_amount: null,
      department: '',
      active: true
    });
  };

  const editRule = (rule: ApprovalRule) => {
    setEditingRule(rule);
    setRuleForm(rule);
    setShowRuleForm(true);
  };

  const editAssignment = (assignment: ApprovalAssignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      user_id: assignment.user_id,
      approval_role: assignment.approval_role,
      entity_types: assignment.entity_types,
      max_amount: assignment.max_amount,
      department: assignment.department || '',
      active: assignment.active
    });
    setShowAssignmentForm(true);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Approval Matrix Management</h1>
            <p className="text-slate-600">Define approval rules and assign approvers</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'rules'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              Approval Rules
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Approver Assignments
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">Define approval rules for different entity types and levels</p>
                <button
                  onClick={() => {
                    resetRuleForm();
                    setEditingRule(null);
                    setShowRuleForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              {showRuleForm && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="font-semibold text-slate-800">{editingRule ? 'Edit' : 'Create'} Approval Rule</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Entity Type</label>
                      <select
                        value={ruleForm.entity_type}
                        onChange={(e) => setRuleForm({ ...ruleForm, entity_type: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sop">SOP</option>
                        <option value="process">Process</option>
                        <option value="document">Document</option>
                        <option value="change">Change Request</option>
                        <option value="expense">Expense</option>
                        <option value="timeoff">Time Off</option>
                        <option value="workflow">Workflow</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Approval Level</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={ruleForm.approval_level}
                        onChange={(e) => setRuleForm({ ...ruleForm, approval_level: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Role Required</label>
                      <input
                        type="text"
                        value={ruleForm.role_required}
                        onChange={(e) => setRuleForm({ ...ruleForm, role_required: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., manager, director, admin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Escalate (hours)</label>
                      <input
                        type="number"
                        min="1"
                        value={ruleForm.auto_escalate_hours}
                        onChange={(e) => setRuleForm({ ...ruleForm, auto_escalate_hours: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Amount</label>
                      <input
                        type="number"
                        value={ruleForm.amount_min || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, amount_min: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Amount</label>
                      <input
                        type="number"
                        value={ruleForm.amount_max || ''}
                        onChange={(e) => setRuleForm({ ...ruleForm, amount_max: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ruleForm.requires_all}
                        onChange={(e) => setRuleForm({ ...ruleForm, requires_all: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700">Requires all approvers at this level</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ruleForm.active}
                        onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-700">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveRule}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingRule ? 'Update' : 'Create'} Rule
                    </button>
                    <button
                      onClick={() => {
                        setShowRuleForm(false);
                        setEditingRule(null);
                        resetRuleForm();
                      }}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Entity Type</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Level</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Amount Range</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Escalate</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-800 capitalize">{rule.entity_type}</td>
                        <td className="px-4 py-3 text-sm text-slate-800">Level {rule.approval_level}</td>
                        <td className="px-4 py-3 text-sm text-slate-800 capitalize">{rule.role_required}</td>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          {rule.amount_min !== null || rule.amount_max !== null
                            ? `$${rule.amount_min || 0} - $${rule.amount_max || '∞'}`
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800">{rule.auto_escalate_hours}h</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rule.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editRule(rule)}
                              className="p-1 hover:bg-slate-100 rounded text-blue-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1 hover:bg-slate-100 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">Assign users as approvers for specific entity types</p>
                <button
                  onClick={() => {
                    resetAssignmentForm();
                    setEditingAssignment(null);
                    setShowAssignmentForm(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Assignment
                </button>
              </div>

              {showAssignmentForm && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                  <h3 className="font-semibold text-slate-800">{editingAssignment ? 'Edit' : 'Create'} Approver Assignment</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">User</label>
                      <select
                        value={assignmentForm.user_id}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, user_id: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Approval Role</label>
                      <input
                        type="text"
                        value={assignmentForm.approval_role}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, approval_role: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., manager, director, admin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                      <input
                        type="text"
                        value={assignmentForm.department}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, department: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Amount</label>
                      <input
                        type="number"
                        value={assignmentForm.max_amount || ''}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, max_amount: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Entity Types (Select multiple)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['sop', 'process', 'document', 'change', 'expense', 'timeoff', 'workflow'].map((type) => (
                        <label key={type} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={assignmentForm.entity_types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignmentForm({
                                  ...assignmentForm,
                                  entity_types: [...assignmentForm.entity_types, type]
                                });
                              } else {
                                setAssignmentForm({
                                  ...assignmentForm,
                                  entity_types: assignmentForm.entity_types.filter(t => t !== type)
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-slate-700 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveAssignment}
                      disabled={!assignmentForm.user_id || assignmentForm.entity_types.length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                    >
                      {editingAssignment ? 'Update' : 'Create'} Assignment
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignmentForm(false);
                        setEditingAssignment(null);
                        resetAssignmentForm();
                      }}
                      className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                            {assignment.user_profiles?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800">{assignment.user_profiles?.full_name}</h4>
                            <p className="text-sm text-slate-500">{assignment.user_profiles?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            Role: <span className="font-medium capitalize">{assignment.approval_role}</span>
                          </span>
                          {assignment.max_amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Max: ${assignment.max_amount.toLocaleString()}
                            </span>
                          )}
                          {assignment.department && (
                            <span>Department: {assignment.department}</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {assignment.entity_types.map((type) => (
                            <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          assignment.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {assignment.active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => editAssignment(assignment)}
                          className="p-2 hover:bg-slate-100 rounded text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="p-2 hover:bg-slate-100 rounded text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
