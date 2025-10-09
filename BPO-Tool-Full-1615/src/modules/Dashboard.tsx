import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  Users,
  FolderKanban,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Activity,
  Calendar,
  BarChart3,
  Zap,
  Bell,
} from 'lucide-react';

interface Stats {
  processes: number;
  projects: number;
  kpis: number;
  improvements: number;
  risks: number;
  changes: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    processes: 0,
    projects: 0,
    kpis: 0,
    improvements: 0,
    risks: 0,
    changes: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [processes, projects, kpis, improvements, risks, changes] = await Promise.all([
        supabase.from('processes').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('kpis').select('id', { count: 'exact', head: true }),
        supabase.from('improvements').select('id', { count: 'exact', head: true }),
        supabase.from('risks').select('id', { count: 'exact', head: true }),
        supabase.from('change_initiatives').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        processes: processes.count || 0,
        projects: projects.count || 0,
        kpis: kpis.count || 0,
        improvements: improvements.count || 0,
        risks: risks.count || 0,
        changes: changes.count || 0,
      });

      const [recentProjects, recentChanges, recentImprovements] = await Promise.all([
        supabase.from('projects').select('id, name, created_at').order('created_at', { ascending: false }).limit(2),
        supabase.from('change_initiatives').select('id, title, created_at').order('created_at', { ascending: false }).limit(2),
        supabase.from('improvements').select('id, title, created_at').order('created_at', { ascending: false }).limit(2),
      ]);

      const recent: RecentItem[] = [];

      recentProjects.data?.forEach(item => {
        recent.push({
          id: item.id,
          title: item.name,
          type: 'Project Created',
          time: formatTime(item.created_at),
          icon: <FolderKanban size={18} />,
          color: 'bg-blue-100 text-blue-600',
        });
      });

      recentChanges.data?.forEach(item => {
        recent.push({
          id: item.id,
          title: item.title,
          type: 'Change Initiative',
          time: formatTime(item.created_at),
          icon: <Users size={18} />,
          color: 'bg-orange-100 text-orange-600',
        });
      });

      recentImprovements.data?.forEach(item => {
        recent.push({
          id: item.id,
          title: item.title,
          type: 'Improvement Proposed',
          time: formatTime(item.created_at),
          icon: <TrendingUp size={18} />,
          color: 'bg-green-100 text-green-600',
        });
      });

      recent.sort((a, b) => b.time.localeCompare(a.time));
      setRecentItems(recent.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const statCards = [
    {
      label: 'Active Processes',
      value: stats.processes,
      change: '+12%',
      trend: 'up',
      icon: <TrendingUp size={24} />,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Active Projects',
      value: stats.projects,
      change: '+8%',
      trend: 'up',
      icon: <FolderKanban size={24} />,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'KPIs Tracked',
      value: stats.kpis,
      change: '+15%',
      trend: 'up',
      icon: <Target size={24} />,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Change Initiatives',
      value: stats.changes,
      change: '+5%',
      trend: 'up',
      icon: <Users size={24} />,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Improvements',
      value: stats.improvements,
      change: '+23%',
      trend: 'up',
      icon: <CheckCircle size={24} />,
      gradient: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
    {
      label: 'Active Risks',
      value: stats.risks,
      change: '-3%',
      trend: 'down',
      icon: <AlertTriangle size={24} />,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  const aiInsights = [
    {
      title: 'Process Optimization Opportunity',
      description: 'AI detected 3 processes that can be automated to save 40% time',
      icon: <Zap className="text-yellow-600" size={20} />,
      action: 'Review Now',
      priority: 'high',
    },
    {
      title: 'KPI Performance Alert',
      description: '2 KPIs are trending below target. Immediate attention recommended',
      icon: <Activity className="text-red-600" size={20} />,
      action: 'View Details',
      priority: 'high',
    },
    {
      title: 'Resource Utilization Insight',
      description: 'Team capacity is at 85%. Consider resource reallocation',
      icon: <Users className="text-blue-600" size={20} />,
      action: 'Optimize',
      priority: 'medium',
    },
    {
      title: 'Cost Savings Identified',
      description: 'Potential savings of $12K identified in operational processes',
      icon: <DollarSign className="text-green-600" size={20} />,
      action: 'Explore',
      priority: 'medium',
    },
  ];

  const upcomingItems = [
    { title: 'Q1 Performance Review', date: 'Tomorrow', type: 'Meeting' },
    { title: 'Process Audit Due', date: 'In 3 days', type: 'Deadline' },
    { title: 'Training Session: New SOP', date: 'Next Week', type: 'Training' },
    { title: 'Budget Review Meeting', date: 'Next Week', type: 'Meeting' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Sparkles size={18} />
          <span className="font-medium">AI Insights</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bgColor} p-3 rounded-xl`}>
                <div className={card.textColor}>{card.icon}</div>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                card.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {card.change}
              </div>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${card.gradient} rounded-full`} style={{ width: '70%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-slate-600" size={24} />
              <h3 className="text-lg font-semibold text-slate-800">AI-Powered Insights</h3>
            </div>
            <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              Powered by AI
            </span>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.priority === 'high'
                    ? 'bg-amber-50 border-amber-600'
                    : 'bg-slate-50 border-slate-500'
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{insight.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">{insight.title}</h4>
                      <p className="text-sm text-slate-600">{insight.description}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-lg border border-slate-300 transition-colors whitespace-nowrap shadow-sm">
                    {insight.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-slate-600" size={20} />
              <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {recentItems.length > 0 ? (
                recentItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className={`${item.color} p-2 rounded-lg`}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.type}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-slate-600" size={20} />
              <h3 className="text-lg font-semibold text-slate-800">Upcoming</h3>
            </div>
            <div className="space-y-3">
              {upcomingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.type}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={24} />
              <h3 className="text-xl font-bold">Performance Summary</h3>
            </div>
            <p className="text-blue-100 mb-4">
              Your organization is performing above industry benchmarks in 8 out of 10 key metrics.
              Continue the momentum with focused improvement initiatives.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Process Efficiency</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Team Productivity</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Quality Score</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Customer Satisfaction</p>
                <p className="text-2xl font-bold">96%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
