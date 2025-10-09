import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ActivityHistory } from '../components/ActivityHistory';
import { ApprovalCard } from '../components/ApprovalCard';
import { useIntegration, useTableSubscription } from '../hooks/useIntegration';
import {
  Sparkles,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Phone,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const EnhancedDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProcesses: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    completedKPIs: 0,
    openTickets: 0,
    criticalComplaints: 0,
  });
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'all' | 'operations' | 'management'>('all');
  const [aiInsights, setAiInsights] = useState({
    ticketTrend: 'increasing',
    avgResolutionTime: '3.2 hours',
    topCategory: 'Technical Support',
    satisfactionScore: 4.7,
    urgentActions: 3,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const [processesRes, projectsRes, approvalsRes, kpisRes, ticketsRes, complaintsRes] =
        await Promise.all([
          supabase.from('process_mapping').select('id', { count: 'exact', head: true }),
          supabase.from('transition_projects').select('id', { count: 'exact', head: true }),
          supabase.from('approvals').select('*').eq('status', 'pending').limit(5),
          supabase.from('kpi_tracking').select('id', { count: 'exact', head: true }),
          supabase
            .from('tickets')
            .select('id', { count: 'exact', head: true })
            .in('status', ['open', 'in_progress']),
          supabase
            .from('complaints')
            .select('id', { count: 'exact', head: true })
            .eq('severity', 'critical'),
        ]);

      setStats({
        totalProcesses: processesRes.count || 0,
        activeProjects: projectsRes.count || 0,
        pendingApprovals: approvalsRes.data?.length || 0,
        completedKPIs: kpisRes.count || 0,
        openTickets: ticketsRes.count || 0,
        criticalComplaints: complaintsRes.count || 0,
      });

      if (approvalsRes.data) {
        for (const approval of approvalsRes.data) {
          if (approval.entity_type === 'time_off_request') {
            const { data: timeOffData } = await supabase
              .from('time_off_requests')
              .select('start_date, end_date, request_type, reason')
              .eq('id', approval.entity_id)
              .single();

            approval.entity_data = timeOffData;
          }
        }
        setApprovals(approvalsRes.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useIntegration(
    'dashboard',
    ['ticket.created', 'ticket.resolved', 'complaint.created', 'complaint.escalated', 'csat.received', 'approval.requested'],
    useCallback(async (event) => {
      await loadDashboardData();
    }, [loadDashboardData])
  );

  useTableSubscription('tickets', useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]));

  useTableSubscription('complaints', useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]));

  useTableSubscription('approvals', useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]));

  const operationsStats = [
    {
      label: 'Open Tickets',
      value: stats.openTickets,
      icon: <Phone size={24} />,
      color: 'bg-blue-500',
      trend: '+12%',
      priority: stats.openTickets > 50 ? 'high' : 'normal',
    },
    {
      label: 'Critical Complaints',
      value: stats.criticalComplaints,
      icon: <AlertTriangle size={24} />,
      color: 'bg-red-500',
      trend: '-5%',
      priority: stats.criticalComplaints > 0 ? 'high' : 'normal',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: <Clock size={24} />,
      color: 'bg-yellow-500',
      trend: '+3%',
      priority: stats.pendingApprovals > 10 ? 'high' : 'normal',
    },
    {
      label: 'Satisfaction Score',
      value: aiInsights.satisfactionScore,
      icon: <TrendingUp size={24} />,
      color: 'bg-green-500',
      trend: '+0.3',
      priority: 'normal',
    },
  ];

  const managementStats = [
    {
      label: 'Total Processes',
      value: stats.totalProcesses,
      icon: <FileText size={24} />,
      color: 'bg-emerald-500',
      trend: '+12%',
    },
    {
      label: 'Active Projects',
      value: stats.activeProjects,
      icon: <Target size={24} />,
      color: 'bg-blue-500',
      trend: '+8%',
    },
    {
      label: 'KPIs Tracked',
      value: stats.completedKPIs,
      icon: <TrendingUp size={24} />,
      color: 'bg-purple-500',
      trend: '+15%',
    },
  ];

  const renderStats = () => {
    if (viewFilter === 'operations') return operationsStats;
    if (viewFilter === 'management') return managementStats;
    return [...operationsStats.slice(0, 3), ...managementStats.slice(0, 3)];
  };

  const chartData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 52 },
    { label: 'Wed', value: 61 },
    { label: 'Thu', value: 58 },
    { label: 'Fri', value: 70 },
    { label: 'Sat', value: 35 },
    { label: 'Sun', value: 28 },
  ];

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
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
          <p className="text-slate-600 mt-1">Real-time insights and AI-powered highlights</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-600" />
          <div className="flex gap-2">
            {['all', 'operations', 'management'].map((filter) => (
              <button
                key={filter}
                onClick={() => setViewFilter(filter as any)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  viewFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI-Powered Insights</h3>
              <p className="text-purple-100 text-sm">Real-time intelligent analysis</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm font-medium">Ticket Trends</span>
            </div>
            <p className="text-2xl font-bold mb-1">{aiInsights.ticketTrend}</p>
            <p className="text-xs text-purple-100">Top: {aiInsights.topCategory}</p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} />
              <span className="text-sm font-medium">Avg Resolution</span>
            </div>
            <p className="text-2xl font-bold mb-1">{aiInsights.avgResolutionTime}</p>
            <p className="text-xs text-purple-100">15% faster than last week</p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Urgent Actions</span>
            </div>
            <p className="text-2xl font-bold mb-1">{aiInsights.urgentActions}</p>
            <p className="text-xs text-purple-100">Require immediate attention</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderStats().map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-green-600">{stat.trend}</span>
                {(stat as any).priority === 'high' && (
                  <AlertTriangle size={16} className="text-red-500" />
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {viewFilter !== 'management' && approvals.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Pending Approvals</h3>
            <span className="text-sm text-slate-600">{approvals.length} items</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprovalComplete={loadDashboardData}
              />
            ))}
          </div>
        </div>
      )}

      {viewFilter !== 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Activity</h3>
            <AnalyticsChart data={chartData} color="#3b82f6" />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
            <ActivityHistory limit={5} />
          </div>
        </div>
      )}
    </div>
  );
};
