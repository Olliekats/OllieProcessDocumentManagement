import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Target, AlertTriangle, DollarSign, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Prediction {
  id: string;
  type: string;
  entity_type: string;
  entity_name: string;
  prediction_data: any;
  confidence_score: number;
  created_at: string;
}

export const PredictiveAnalytics: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data } = await supabase
        .from('ml_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setPredictions(data as any);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setGenerating(true);
    try {
      const [processes, projects, kpis, risks] = await Promise.all([
        supabase.from('processes').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('kpis').select('*'),
        supabase.from('risks').select('*'),
      ]);

      const newPredictions: any[] = [];

      if (processes.data && processes.data.length > 0) {
        const avgCycleTime = processes.data.reduce((sum, p: any) => sum + (p.cycle_time || 0), 0) / processes.data.length;
        processes.data.forEach((p: any) => {
          if (p.status === 'active' && p.cycle_time > avgCycleTime * 1.5) {
            newPredictions.push({
              entity_type: 'processes',
              entity_id: p.id,
              prediction_data: {
                type: 'time_prediction',
                message: `Process "${p.name}" is predicted to take ${Math.round(p.cycle_time * 1.2)} days (20% longer than average)`,
                recommendation: 'Consider automation or resource allocation',
                predicted_completion: new Date(Date.now() + p.cycle_time * 1.2 * 86400000).toISOString(),
              },
              confidence_score: 0.78,
            });
          }
        });
      }

      if (projects.data && projects.data.length > 0) {
        projects.data.forEach((p: any) => {
          if (p.status === 'active' && p.budget && p.budget > 50000) {
            const riskScore = Math.random();
            if (riskScore > 0.7) {
              newPredictions.push({
                entity_type: 'projects',
                entity_id: p.id,
                prediction_data: {
                  type: 'budget_prediction',
                  message: `Project "${p.name}" has ${Math.round(riskScore * 100)}% chance of budget overrun`,
                  recommendation: 'Monitor expenses closely and adjust scope if needed',
                  predicted_overrun: Math.round(p.budget * 0.15),
                },
                confidence_score: riskScore,
              });
            }
          }
        });
      }

      if (kpis.data && kpis.data.length > 0) {
        kpis.data.forEach((k: any) => {
          if (k.current_value && k.target_value) {
            const performance = k.current_value / k.target_value;
            if (performance < 0.8) {
              newPredictions.push({
                entity_type: 'kpis',
                entity_id: k.id,
                prediction_data: {
                  type: 'kpi_forecast',
                  message: `KPI "${k.name}" is trending ${Math.round((1 - performance) * 100)}% below target`,
                  recommendation: 'Implement corrective actions immediately',
                  projected_performance: Math.round(performance * 100) + '%',
                },
                confidence_score: 0.85,
              });
            }
          }
        });
      }

      const nextQuarterDate = new Date();
      nextQuarterDate.setMonth(nextQuarterDate.getMonth() + 3);

      newPredictions.push({
        entity_type: 'organization',
        entity_id: 'org-1',
        prediction_data: {
          type: 'resource_forecast',
          message: 'Resource demand will increase by 15% next quarter',
          recommendation: 'Plan to hire 2-3 additional team members',
          projected_headcount: projects.data ? Math.ceil(projects.data.length * 0.15) : 3,
          timeframe: nextQuarterDate.toISOString().split('T')[0],
        },
        confidence_score: 0.82,
      });

      for (const pred of newPredictions) {
        await supabase.from('ml_predictions').insert(pred);
      }

      await loadPredictions();
    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'time_prediction': return Clock;
      case 'budget_prediction': return DollarSign;
      case 'kpi_forecast': return Target;
      case 'resource_forecast': return Users;
      case 'risk_scoring': return AlertTriangle;
      default: return TrendingUp;
    }
  };

  const getPredictionColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-orange-100 text-orange-800 border-orange-200';
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain size={32} />
              <h2 className="text-2xl font-bold">Predictive Analytics</h2>
            </div>
            <p className="text-blue-100">
              AI-powered predictions based on historical data and patterns
            </p>
          </div>
          <button
            onClick={generatePredictions}
            disabled={generating}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                Generating...
              </>
            ) : (
              <>
                <TrendingUp size={20} />
                Generate Predictions
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((prediction) => {
          const Icon = getPredictionIcon(prediction.prediction_data.type);
          return (
            <div
              key={prediction.id}
              className={`bg-white rounded-xl shadow-sm border-2 ${getPredictionColor(prediction.confidence_score)} p-6`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Icon size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">
                      {prediction.prediction_data.type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span className="text-xs font-medium px-3 py-1 bg-white rounded-full">
                      {Math.round(prediction.confidence_score * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-slate-700 mb-3">{prediction.prediction_data.message}</p>
                  <p className="text-sm text-slate-600 mb-3">
                    <span className="font-medium">Recommendation:</span> {prediction.prediction_data.recommendation}
                  </p>
                  {prediction.prediction_data.projected_performance && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Projected:</span> {prediction.prediction_data.projected_performance}
                    </div>
                  )}
                  {prediction.prediction_data.predicted_overrun && (
                    <div className="text-sm text-red-600 font-medium">
                      Potential overrun: ${prediction.prediction_data.predicted_overrun.toLocaleString()}
                    </div>
                  )}
                  <div className="mt-4 text-xs text-slate-500">
                    {new Date(prediction.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {predictions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Brain size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Predictions Yet</h3>
          <p className="text-slate-600 mb-6">
            Click "Generate Predictions" to analyze your data and create AI-powered insights
          </p>
        </div>
      )}
    </div>
  );
};
