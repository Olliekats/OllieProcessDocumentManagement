import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  Activity,
  Brain,
  Target,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export const AdvancedPredictiveAnalytics: React.FC = () => {
  const [volumeForecast, setVolumeForecast] = useState<any>(null);
  const [churnPredictions, setChurnPredictions] = useState<any>(null);
  const [riskComplaints, setRiskComplaints] = useState<any>(null);
  const [agentPerformance, setAgentPerformance] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('all');

  useEffect(() => {
    loadPredictionModels();
    runAllPredictions();
  }, []);

  const loadPredictionModels = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_models')
        .select('*')
        .eq('is_active', true)
        .order('model_name');

      if (error) throw error;
      if (data) setModels(data);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const runAllPredictions = async () => {
    setLoading(true);
    try {
      const [volumeRes, churnRes, riskRes, performanceRes] = await Promise.all([
        supabase.rpc('predict_ticket_volume', { p_forecast_days: 7 }),
        supabase.rpc('predict_customer_churn'),
        supabase.rpc('identify_risk_complaints'),
        supabase.rpc('predict_agent_performance'),
      ]);

      if (volumeRes.data) setVolumeForecast(volumeRes.data);
      if (churnRes.data) setChurnPredictions(churnRes.data);
      if (riskRes.data) setRiskComplaints(riskRes.data);
      if (performanceRes.data) setAgentPerformance(performanceRes.data);
    } catch (error) {
      console.error('Error running predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="text-green-500" size={20} />;
    if (trend === 'declining') return <TrendingDown className="text-red-500" size={20} />;
    return <Activity className="text-gray-500" size={20} />;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered forecasting and risk prediction</p>
        </div>
        <button
          onClick={runAllPredictions}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Running...' : 'Refresh Predictions'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {models.map((model) => (
          <div key={model.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-blue-600" size={20} />
              <h3 className="font-semibold text-gray-900 text-sm">{model.model_type}</h3>
            </div>
            <div className="text-xs text-gray-600 mb-2">{model.algorithm}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Accuracy</span>
              <span className="text-sm font-bold text-green-600">
                {(Number(model.accuracy_score) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Ticket Volume Forecast</h2>
          </div>

          {volumeForecast && volumeForecast.predictions ? (
            <div className="space-y-2">
              {volumeForecast.predictions.map((prediction: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(prediction.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: {prediction.lower_bound} - {prediction.upper_bound}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {prediction.predicted_volume}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(prediction.confidence * 100).toFixed(0)}% confident
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Generating forecast...' : 'No forecast data available'}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-orange-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">High-Risk Complaints</h2>
          </div>

          {riskComplaints && riskComplaints.predictions ? (
            <div className="space-y-2">
              {riskComplaints.predictions.slice(0, 5).map((complaint: any) => (
                <div
                  key={complaint.complaint_id}
                  className={`p-3 rounded-lg border ${getRiskColor(complaint.risk_level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{complaint.complaint_number}</div>
                      <div className="text-sm">{complaint.customer_name}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {complaint.reasons
                          .filter((r: string) => r !== null)
                          .map((reason: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-white px-2 py-1 rounded"
                            >
                              {reason}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-lg font-bold">
                        {(complaint.risk_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs uppercase font-semibold">
                        {complaint.risk_level}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Analyzing risks...' : 'No high-risk complaints identified'}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-purple-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Customer Churn Risk</h2>
          </div>

          {churnPredictions && churnPredictions.predictions ? (
            <div className="space-y-2">
              {churnPredictions.predictions
                .filter((p: any) => p.churn_probability > 0.5)
                .slice(0, 5)
                .map((customer: any) => (
                  <div
                    key={customer.customer_id}
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-red-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{customer.customer_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {customer.factors.complaint_count} complaints •{' '}
                          {customer.factors.unresolved_count} unresolved
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {(customer.churn_probability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          {customer.risk_level} risk
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Analyzing churn risk...' : 'No high churn risk customers'}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Agent Performance Forecast</h2>
          </div>

          {agentPerformance && agentPerformance.predictions ? (
            <div className="space-y-2">
              {agentPerformance.predictions.slice(0, 5).map((agent: any) => (
                <div key={agent.agent_id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{agent.agent_name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {agent.factors.tickets_handled} tickets •{' '}
                        {agent.factors.resolution_rate}% resolved
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(agent.trend)}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {agent.predicted_score.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">{agent.trend}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? 'Predicting performance...' : 'No predictions available'}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">AI Model Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {models.map((model) => (
            <div key={model.id} className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">{model.model_name}</div>
              <div className="text-xs text-gray-600 mb-2">{model.prediction_target}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="font-semibold text-green-600">
                    {(Number(model.accuracy_score) * 100).toFixed(1)}%
                  </span>
                </div>
                {model.precision_score && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Precision:</span>
                    <span className="font-semibold">
                      {(Number(model.precision_score) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
