import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ApprovalCard } from '../components/ApprovalCard';
import { Clock, CheckCircle, XCircle, Filter } from 'lucide-react';

export const ApprovalsQueue = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadApprovals();
  }, [filter]);

  const loadApprovals = async () => {
    try {
      let query = supabase
        .from('approvals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      for (const approval of (data || [])) {
        if (approval.entity_type === 'time_off_request') {
          const { data: timeOffData } = await supabase
            .from('time_off_requests')
            .select('start_date, end_date, request_type, reason')
            .eq('id', approval.entity_id)
            .single();

          approval.entity_data = timeOffData;
        }
      }

      setApprovals(data || []);

      const pending = data?.filter(a => a.status === 'pending').length || 0;
      const approved = data?.filter(a => a.status === 'approved').length || 0;
      const rejected = data?.filter(a => a.status === 'rejected').length || 0;

      setStats({ pending, approved, rejected });
      setLoading(false);
    } catch (error) {
      console.error('Error loading approvals:', error);
      setLoading(false);
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
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Approvals Queue</h2>
        <p className="text-slate-600 mt-1">Review and process pending approval requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <Clock size={32} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <CheckCircle size={32} className="text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
            <XCircle size={32} className="text-red-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter:</span>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {approvals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onApprovalComplete={loadApprovals}
          />
        ))}
      </div>

      {approvals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <CheckCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">
            {filter === 'pending' ? 'No pending approvals' : `No ${filter} approvals`}
          </p>
        </div>
      )}
    </div>
  );
};
