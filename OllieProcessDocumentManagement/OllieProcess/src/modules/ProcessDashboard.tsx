import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  FolderKanban,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Activity,
  Calendar,
  BarChart3,
  Zap,
  GitBranch,
  Workflow,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';

interface Stats {
  processes: number;
  activeProcesses: number;
  completedTasks: number;
  pendingApprovals: number;
  bottlenecks: number;
  improvements: number;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

export const ProcessDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    processes: 0,
    activeProcesses: 0,
    completedTasks: 0,
    pendingApprovals: 0,
    bottlenecks: 0,
    improvements: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [processes, activeProcs, tasks, approvals, improvements] = await Promise.all([
        supabase.from('processes').select('id', { count: 'exact', head: true }),
        supabase.from('processes').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('improvements').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        processes: processes.count || 0,
        activeProcesses: activeProcs.count || 0,
        completedTasks: tasks.count || 0,
        pendingApprovals: approvals.count || 0,
        bottlenecks: 0,
        improvements: improvements.count || 0,
      });

      const [recentProcesses, recentImprovements] = await Promise.all([
        supabase.from('processes').select('id, name, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('improvements').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
      ]);

      const recent: RecentItem[] = [];

      recentProcesses.data?.forEach(item => {
        recent.push({
          id: item.id,
          title: item.name,
          type: 'Process Created',
          time: formatTime(item.created_at),
          icon: <Workflow size={18} />,
          color: 'bg-blue-100 text-blue-600',
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
      label: 'Total Processes',
      value: stats.processes,
      change: '+12%',
      trend: 'up',
      icon: <GitBranch size={24} />,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Active Processes',
      value: stats.activeProcesses,
      change: '+8%',
      trend: 'up',
      icon: <PlayCircle size={24} />,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: 'Completed Tasks',
      value: stats.completedTasks,
      change: '+23%',
      trend: 'up',
      icon: <CheckCircle size={24} />,
      gradient: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      change: '+5%',
      trend: 'up',
      icon: <Clock size={24} />,
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'Process Improvements',
      value: stats.improvements,
      change: '+15%',
      trend: 'up',
      icon: <TrendingUp size={24} />,
      gradient: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
    {
      label: 'Bottlenecks Detected',
      value: stats.bottlenecks,
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
      title: 'Process Automation Opportunity',
      description: 'AI identified 3 manual processes that can be fully automated to save 40% execution time',
      icon: <Zap className="text-yellow-600" size={20} />,
      action: 'Review Now',
      priority: 'high',
    },
    {
      title: 'Bottleneck Detection',
      description: 'Approval step in "Order Processing" is causing 2-day delays. Consider parallel routing',
      icon: <Activity className="text-red-600" size={20} />,
      action: 'Optimize',
      priority: 'high',
    },
    {
      title: 'Process Efficiency Insight',
      description: 'Customer Onboarding process efficiency improved by 35% after recent optimization',
      icon: <TrendingUp className="text-green-600" size={20} />,
      action: 'View Details',
      priority: 'medium',
    },
    {
      title: 'Compliance Alert',
      description: '2 processes need documentation updates to meet new compliance requirements',
      icon: <AlertTriangle className="text-amber-600" size={20} />,
      action: 'Update',
      priority: 'medium',
    },
  ];

  const upcomingItems = [
    { title: 'Process Performance Review', date: 'Tomorrow', type: 'Meeting' },
    { title: 'Quarterly Process Audit', date: 'In 3 days', type: 'Audit' },
    { title: 'Process Mapping Workshop', date: 'Next Week', type: 'Training' },
    { title: 'Optimization Sprint Planning', date: 'Next Week', type: 'Planning' },
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
          <h1 className="text-3xl font-bold text-slate-800">Process Management Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor, analyze, and optimize your business processes.</p>
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
              <h3 className="text-xl font-bold">Process Performance Summary</h3>
            </div>
            <p className="text-blue-100 mb-4">
              Your processes are performing excellently with 92% efficiency and 87% automation rate.
              Continue optimizing with AI-powered recommendations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Process Efficiency</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Automation Rate</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">Compliance Score</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-blue-100 text-sm mb-1">On-Time Completion</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
