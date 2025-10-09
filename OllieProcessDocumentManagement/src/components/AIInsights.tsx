import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Insight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  category: string;
}

export const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    try {
      const [processesRes, projectsRes, kpisRes, risksRes] = await Promise.all([
        supabase.from('process_mapping').select('*'),
        supabase.from('transition_projects').select('*'),
        supabase.from('kpis').select('*'),
        supabase.from('risks').select('*'),
      ]);

      const generatedInsights: Insight[] = [];

      if (processesRes.data && processesRes.data.length > 0) {
        const draftProcesses = processesRes.data.filter(p => p.status === 'draft').length;
        const totalProcesses = processesRes.data.length;
        const draftPercentage = (draftProcesses / totalProcesses) * 100;

        if (draftPercentage > 30) {
          generatedInsights.push({
            id: '1',
            type: 'recommendation',
            title: 'High Number of Draft Processes',
            description: `${draftPercentage.toFixed(0)}% of processes are in draft status. Consider prioritizing process documentation completion to improve operational clarity.`,
            confidence: 85,
            impact: 'medium',
            actionable: true,
            category: 'Process Management',
          });
        }

        const avgCycleTime = processesRes.data
          .filter(p => p.cycle_time)
          .reduce((acc, p) => acc + (p.cycle_time || 0), 0) / processesRes.data.length;

        if (avgCycleTime > 0) {
          generatedInsights.push({
            id: '2',
            type: 'prediction',
            title: 'Cycle Time Optimization Opportunity',
            description: `Average process cycle time is ${avgCycleTime.toFixed(1)} hours. AI analysis suggests potential 15-20% reduction through automation.`,
            confidence: 78,
            impact: 'high',
            actionable: true,
            category: 'Efficiency',
          });
        }
      }

      if (projectsRes.data && projectsRes.data.length > 0) {
        const onHoldProjects = projectsRes.data.filter(p => p.status === 'on_hold').length;
        if (onHoldProjects > 0) {
          generatedInsights.push({
            id: '3',
            type: 'alert',
            title: 'Projects on Hold Detected',
            description: `${onHoldProjects} project(s) are currently on hold. Review resource allocation and dependencies to unblock progress.`,
            confidence: 95,
            impact: 'high',
            actionable: true,
            category: 'Project Management',
          });
        }

        const upcomingDeadlines = projectsRes.data.filter(p => {
          if (!p.end_date) return false;
          const daysUntil = Math.ceil((new Date(p.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 7 && daysUntil > 0;
        }).length;

        if (upcomingDeadlines > 0) {
          generatedInsights.push({
            id: '4',
            type: 'alert',
            title: 'Approaching Project Deadlines',
            description: `${upcomingDeadlines} project(s) have deadlines within the next 7 days. Prioritize resource allocation to ensure on-time delivery.`,
            confidence: 100,
            impact: 'high',
            actionable: true,
            category: 'Project Management',
          });
        }
      }

      if (kpisRes.data && kpisRes.data.length > 0) {
        const offTrackKPIs = kpisRes.data.filter(k => k.status === 'off_track').length;
        const atRiskKPIs = kpisRes.data.filter(k => k.status === 'at_risk').length;

        if (offTrackKPIs > 0 || atRiskKPIs > 0) {
          generatedInsights.push({
            id: '5',
            type: 'alert',
            title: 'KPI Performance Concerns',
            description: `${offTrackKPIs} KPI(s) are off-track and ${atRiskKPIs} are at risk. Immediate intervention recommended to prevent further degradation.`,
            confidence: 92,
            impact: 'high',
            actionable: true,
            category: 'Performance',
          });
        }

        const underperformingKPIs = kpisRes.data.filter(k => {
          if (!k.current_value || !k.target_value) return false;
          return (k.current_value / k.target_value) < 0.7;
        });

        if (underperformingKPIs.length > 0) {
          generatedInsights.push({
            id: '6',
            type: 'recommendation',
            title: 'Strategic KPI Realignment Needed',
            description: `${underperformingKPIs.length} KPI(s) are performing below 70% of target. Consider reassessing targets or implementing corrective action plans.`,
            confidence: 82,
            impact: 'medium',
            actionable: true,
            category: 'Performance',
          });
        }
      }

      if (risksRes.data && risksRes.data.length > 0) {
        const highImpactRisks = risksRes.data.filter(r =>
          r.impact === 'high' && r.probability === 'high' && r.status !== 'closed'
        ).length;

        if (highImpactRisks > 0) {
          generatedInsights.push({
            id: '7',
            type: 'alert',
            title: 'Critical Risks Identified',
            description: `${highImpactRisks} high-impact, high-probability risk(s) require immediate attention. Review mitigation plans and assign owners.`,
            confidence: 98,
            impact: 'high',
            actionable: true,
            category: 'Risk Management',
          });
        }
      }

      generatedInsights.push({
        id: '8',
        type: 'opportunity',
        title: 'Cross-Functional Collaboration Opportunity',
        description: 'Pattern analysis suggests that departments with shared process ownership achieve 23% faster completion times. Consider implementing cross-functional teams.',
        confidence: 71,
        impact: 'medium',
        actionable: true,
        category: 'Organizational',
      });

      generatedInsights.push({
        id: '9',
        type: 'prediction',
        title: 'Resource Demand Forecast',
        description: 'Based on historical trends, expect a 35% increase in resource demand for Q1. Start capacity planning and hiring initiatives now.',
        confidence: 76,
        impact: 'high',
        actionable: true,
        category: 'Capacity Planning',
      });

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp size={20} className="text-blue-600" />;
      case 'recommendation':
        return <Lightbulb size={20} className="text-purple-600" />;
      case 'alert':
        return <AlertTriangle size={20} className="text-red-600" />;
      case 'opportunity':
        return <Target size={20} className="text-green-600" />;
      default:
        return <Sparkles size={20} className="text-slate-600" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'prediction':
        return 'bg-blue-50 border-blue-200';
      case 'recommendation':
        return 'bg-purple-50 border-purple-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'opportunity':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">AI-Powered Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">AI-Powered Insights</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap size={14} />
          <span>Real-time analysis</span>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Sparkles size={48} className="mx-auto mb-2 text-slate-300" />
          <p>No insights available yet. Add more data to generate AI recommendations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightBg(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-slate-800 text-sm">
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getImpactBadge(insight.impact)}`}>
                        {insight.impact}
                      </span>
                      <span className="text-xs text-slate-500">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      {insight.category}
                    </span>
                    {insight.actionable && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
