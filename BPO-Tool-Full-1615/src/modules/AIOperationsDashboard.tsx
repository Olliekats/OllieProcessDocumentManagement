import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Brain, TrendingUp, CheckCircle, AlertCircle, Activity, Users, MessageSquare, BookOpen } from 'lucide-react';

interface AIDecision {
  id: string;
  decision_type: string;
  entity_type: string;
  decision_made: string;
  confidence_score: number;
  was_overridden: boolean;
  created_at: string;
}

interface AIStats {
  totalDecisions: number;
  avgConfidence: number;
  overrideRate: number;
  decisionsToday: number;
}

export default function AIOperationsDashboard() {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [stats, setStats] = useState<AIStats>({
    totalDecisions: 0,
    avgConfidence: 0,
    overrideRate: 0,
    decisionsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadAIDecisions();
    loadStats();

    const subscription = supabase
      .channel('ai_decisions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ai_decision_monitor' }, () => {
        loadAIDecisions();
        loadStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const loadAIDecisions = async () => {
    try {
      let query = supabase
        .from('ai_decision_monitor')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('decision_type', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDecisions(data || []);
    } catch (error) {
      console.error('Error loading AI decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_decision_monitor')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const totalDecisions = data?.length || 0;
      const avgConfidence = data?.reduce((sum, d) => sum + (parseFloat(d.confidence_score) || 0), 0) / (totalDecisions || 1);
      const overrideCount = data?.filter(d => d.was_overridden).length || 0;
      const overrideRate = (overrideCount / (totalDecisions || 1)) * 100;
      const decisionsToday = data?.filter(d => new Date(d.created_at) >= today).length || 0;

      setStats({
        totalDecisions,
        avgConfidence: Math.round(avgConfidence * 100),
        overrideRate: Math.round(overrideRate),
        decisionsToday,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case 'auto_assignment':
        return <Users className="w-5 h-5" />;
      case 'auto_routing':
        return <Activity className="w-5 h-5" />;
      case 'kb_suggestion':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getDecisionColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.75) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const formatDecisionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <h1 className="text-2xl font-bold text-slate-900">AI Operations Dashboard</h1>
          <p className="text-slate-600 mt-1">Real-time monitoring of AI-driven automation decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600 animate-pulse" />
          <span className="text-sm text-slate-600">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total AI Decisions</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalDecisions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Confidence</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.avgConfidence}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Override Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.overrideRate}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Decisions Today</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.decisionsToday}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent AI Decisions</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Decisions</option>
              <option value="auto_assignment">Auto Assignment</option>
              <option value="auto_routing">Auto Routing</option>
              <option value="kb_suggestion">KB Suggestions</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {decisions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No AI decisions recorded yet</p>
            </div>
          ) : (
            decisions.map((decision) => (
              <div key={decision.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDecisionColor(decision.confidence_score)}`}>
                    {getDecisionIcon(decision.decision_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {formatDecisionType(decision.decision_type)}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {decision.entity_type}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 mb-2">{decision.decision_made}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Confidence: {Math.round(decision.confidence_score * 100)}%</span>
                      </div>
                      <span>
                        {new Date(decision.created_at).toLocaleString()}
                      </span>
                      {decision.was_overridden && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="w-3 h-3" />
                          Overridden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDecisionColor(decision.confidence_score)}`}>
                    {Math.round(decision.confidence_score * 100)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">AI Automation Active</h3>
            <p className="text-sm text-slate-700 mb-4">
              The system is automatically making intelligent decisions for ticket assignment, complaint routing,
              and knowledge base article suggestions based on real-time data and machine learning models.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                Auto Assignment
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                Smart Routing
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                KB Suggestions
              </span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-700 border border-slate-200">
                Performance Tracking
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
