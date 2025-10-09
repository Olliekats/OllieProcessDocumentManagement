import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { integrationService } from '../services/integrationService';
import { useIntegration, useTableSubscription } from '../hooks/useIntegration';
import { AlertTriangle, Plus, TrendingUp, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Complaint {
  id: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  assigned_to?: string;
  client_id?: string;
  created_at: string;
  resolved_at?: string;
}

export default function IntegratedComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    description: '',
    severity: 'medium',
    category: 'service',
  });

  const loadComplaints = useCallback(async () => {
    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useTableSubscription<Complaint>('complaints', useCallback(() => {
    loadComplaints();
  }, [loadComplaints]));

  useIntegration(
    'complaints',
    ['complaint.escalated', 'complaint.resolved'],
    useCallback(async () => {
      await loadComplaints();
    }, [loadComplaints])
  );

  const createComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data: complaint, error } = await supabase
        .from('complaints')
        .insert({
          ...newComplaint,
          status: 'open',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await integrationService.notifyComplaintCreated(complaint);

      setNewComplaint({
        subject: '',
        description: '',
        severity: 'medium',
        category: 'service',
      });
      setShowNew(false);
      await loadComplaints();
    } catch (error) {
      console.error('Error creating complaint:', error);
    }
  };

  const escalateComplaint = async (complaintId: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          severity: 'critical',
          status: 'escalated',
          escalated_at: new Date().toISOString()
        })
        .eq('id', complaintId);

      if (error) throw error;

      await integrationService.notifyComplaintEscalated(complaintId, {
        escalated_at: new Date().toISOString(),
        escalated_by: user?.id,
      });

      await loadComplaints();
    } catch (error) {
      console.error('Error escalating complaint:', error);
    }
  };

  const resolveComplaint = async (complaintId: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', complaintId);

      if (error) throw error;

      await integrationService.publishEvent({
        event_type: 'complaint.resolved',
        source_module: 'complaints',
        target_modules: ['dashboard', 'client_mgmt', 'analytics', 'quality_assurance'],
        event_data: {
          complaint_id: complaintId,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        },
      });

      await loadComplaints();
    } catch (error) {
      console.error('Error resolving complaint:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrated Complaints Management</h1>
          <p className="text-slate-600 mt-1">Real-time complaint tracking with automatic routing</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Complaint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Complaints</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{complaints.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {complaints.filter(c => c.severity === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {complaints.filter(c => c.status === 'in_progress').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {complaints.filter(c => c.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'open', 'escalated', 'in_progress', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">File New Complaint</h2>
            <form onSubmit={createComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newComplaint.subject}
                  onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={newComplaint.severity}
                    onChange={(e) => setNewComplaint({ ...newComplaint, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newComplaint.category}
                    onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="service">Service Quality</option>
                    <option value="billing">Billing</option>
                    <option value="delivery">Delivery</option>
                    <option value="product">Product</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  File Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="divide-y divide-slate-200">
          {complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No complaints found</p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{complaint.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-2 py-1 rounded border text-xs font-medium ${getSeverityColor(complaint.severity)}`}>
                        {complaint.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(complaint.created_at).toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-700">
                        {complaint.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {complaint.status !== 'resolved' && complaint.severity !== 'critical' && (
                      <button
                        onClick={() => escalateComplaint(complaint.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Escalate
                      </button>
                    )}
                    {complaint.status !== 'resolved' && (
                      <button
                        onClick={() => resolveComplaint(complaint.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
