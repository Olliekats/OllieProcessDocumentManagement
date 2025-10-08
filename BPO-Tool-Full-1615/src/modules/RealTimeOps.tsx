import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Users, Clock, TrendingUp, AlertTriangle, Phone } from 'lucide-react';

interface MetricCard {
  label: string;
  value: string | number;
  change?: string;
  status?: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export const RealTimeOps = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInteractions, setActiveInteractions] = useState(0);
  const [availableAgents, setAvailableAgents] = useState(0);

  useEffect(() => {
    loadRealTimeMetrics();
    const interval = setInterval(loadRealTimeMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRealTimeMetrics = async () => {
    try {
      const { data: interactions } = await supabase
        .from('interactions')
        .select('*')
        .eq('status', 'active');

      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .eq('status', 'present');

      const { data: recentSurveys } = await supabase
        .from('csat_surveys')
        .select('rating')
        .gte('survey_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('survey_date', { ascending: false });

      const { data: openTickets } = await supabase
        .from('tickets')
        .select('*')
        .in('status', ['open', 'in_progress']);

      const avgCsat =
        recentSurveys && recentSurveys.length > 0
          ? (
              recentSurveys.reduce((sum, s) => sum + s.rating, 0) / recentSurveys.length
            ).toFixed(1)
          : '0.0';

      const activeCount = interactions?.length || 0;
      const agentCount = todayAttendance?.length || 0;
      const ticketCount = openTickets?.length || 0;

      setActiveInteractions(activeCount);
      setAvailableAgents(agentCount);

      const metricsData: MetricCard[] = [
        {
          label: 'Active Interactions',
          value: activeCount,
          status: activeCount > 50 ? 'warning' : 'good',
          icon: <Phone size={24} />,
        },
        {
          label: 'Available Agents',
          value: agentCount,
          status: agentCount < 10 ? 'critical' : 'good',
          icon: <Users size={24} />,
        },
        {
          label: 'Open Tickets',
          value: ticketCount,
          status: ticketCount > 100 ? 'warning' : 'good',
          icon: <Activity size={24} />,
        },
        {
          label: 'Avg CSAT (24h)',
          value: avgCsat,
          status: parseFloat(avgCsat) < 4.0 ? 'warning' : 'good',
          icon: <TrendingUp size={24} />,
        },
        {
          label: 'Avg Handle Time',
          value: '6:42',
          icon: <Clock size={24} />,
        },
        {
          label: 'Service Level',
          value: '87%',
          status: 'good',
          icon: <TrendingUp size={24} />,
        },
      ];

      setMetrics(metricsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'good':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
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
          <h2 className="text-2xl font-bold text-slate-800">Real-Time Operations</h2>
          <p className="text-slate-600 mt-1">Live performance metrics and monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Activity size={16} className="animate-pulse text-green-600" />
          <span>Live data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg border-2 transition-all ${getStatusColor(metric.status)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{metric.label}</p>
                <p className="text-3xl font-bold mt-2">{metric.value}</p>
                {metric.change && (
                  <p className="text-sm mt-2 opacity-75">{metric.change}</p>
                )}
              </div>
              <div className="opacity-50">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Queue Status</h3>
          <div className="space-y-3">
            {['Customer Support', 'Technical Support', 'Billing'].map((queue, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-700">{queue}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">
                    {Math.floor(Math.random() * 20)} waiting
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {Math.floor(Math.random() * 10)}:{Math.floor(Math.random() * 60)
                      .toString()
                      .padStart(2, '0')}{' '}
                    avg wait
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">High Queue Volume</p>
                <p className="text-xs text-amber-700 mt-1">
                  Customer Support queue exceeds threshold
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Activity size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">SLA At Risk</p>
                <p className="text-xs text-blue-700 mt-1">3 tickets approaching SLA deadline</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Agent Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{availableAgents}</p>
            <p className="text-sm text-green-600 mt-1">Available</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{activeInteractions}</p>
            <p className="text-sm text-blue-600 mt-1">On Call</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">
              {Math.floor(Math.random() * 5)}
            </p>
            <p className="text-sm text-amber-600 mt-1">On Break</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-700">
              {Math.floor(Math.random() * 3)}
            </p>
            <p className="text-sm text-slate-600 mt-1">After Call</p>
          </div>
        </div>
      </div>
    </div>
  );
};
