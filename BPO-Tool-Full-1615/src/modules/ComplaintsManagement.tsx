import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Complaint {
  id: string;
  complaint_number: string;
  customer_name: string;
  complaint_type: string;
  subject: string;
  severity: string;
  status: string;
  reported_date: string;
  assigned_to?: string;
}

export const ComplaintsManagement = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    critical: 0,
    avgResolutionTime: 0,
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('reported_date', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);

      const total = data?.length || 0;
      const open = data?.filter(c => c.status === 'open' || c.status === 'investigating').length || 0;
      const critical = data?.filter(c => c.severity === 'critical').length || 0;

      setStats({ total, open, critical, avgResolutionTime: 24 });
      setLoading(false);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-2xl font-bold text-slate-800">Complaints Management</h2>
          <p className="text-slate-600 mt-1">Track and resolve customer complaints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Complaint</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Complaints</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
            </div>
            <AlertTriangle size={32} className="text-slate-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.open}</p>
            </div>
            <Clock size={32} className="text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.critical}</p>
            </div>
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Resolution (hrs)</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.avgResolutionTime}</p>
            </div>
            <TrendingUp size={32} className="text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Complaint #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {complaint.complaint_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {complaint.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                    {complaint.complaint_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                    {complaint.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(complaint.severity)}`}>
                      {complaint.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(complaint.reported_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {complaints.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No complaints recorded</p>
        </div>
      )}
    </div>
  );
};
