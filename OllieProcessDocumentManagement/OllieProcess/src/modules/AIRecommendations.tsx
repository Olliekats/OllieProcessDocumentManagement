import React, { useState, useEffect } from 'react';
import { getProcessRecommendations, updateRecommendationStatus, ProcessRecommendation } from '../utils/aiIntelligence';
import { Sparkles, TrendingUp, Zap, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<ProcessRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'suggested' | 'approved' | 'rejected'>('suggested');

  useEffect(() => {
    loadRecommendations();
  }, [filter]);

  const loadRecommendations = async () => {
    try {
      const data = await getProcessRecommendations(filter);
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateRecommendationStatus(id, 'approved');
      loadRecommendations();
    } catch (error) {
      console.error('Error approving recommendation:', error);
      alert('Failed to approve recommendation');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateRecommendationStatus(id, 'rejected');
      loadRecommendations();
    } catch (error) {
      console.error('Error rejecting recommendation:', error);
      alert('Failed to reject recommendation');
    }
  };

  const handleImplement = async (id: string) => {
    try {
      await updateRecommendationStatus(id, 'implemented');
      loadRecommendations();
    } catch (error) {
      console.error('Error marking as implemented:', error);
      alert('Failed to mark as implemented');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-5 h-5" />;
      case 'bottleneck_resolution': return <Zap className="w-5 h-5" />;
      case 'cost_reduction': return <DollarSign className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const stats = {
    total: recommendations.length,
    highPriority: recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length,
    avgConfidence: recommendations.length > 0
      ? Math.round(recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length)
      : 0
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" />
            AI-Powered Recommendations
          </h2>
          <p className="text-gray-600 mt-1">Smart suggestions to optimize your processes</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Recommendations</option>
          <option value="suggested">New Suggestions</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="implemented">Implemented</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Recommendations</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Sparkles className="w-12 h-12 text-purple-200" />
          </div>
          <p className="text-purple-100 text-sm mt-4">AI-generated insights</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">High Priority</p>
              <p className="text-3xl font-bold mt-1">{stats.highPriority}</p>
            </div>
            <Zap className="w-12 h-12 text-orange-200" />
          </div>
          <p className="text-orange-100 text-sm mt-4">Requires attention</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Avg Confidence</p>
              <p className="text-3xl font-bold mt-1">{stats.avgConfidence}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
          <p className="text-green-100 text-sm mt-4">AI accuracy score</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  {getTypeIcon(rec.recommendation_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{rec.title}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {rec.confidence_score}% confidence
                    </span>
                  </div>
                  <p className="text-gray-700 mb-4">{rec.description}</p>

                  {rec.expected_impact && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">Expected Impact:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                        {Object.entries(rec.expected_impact).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.estimated_savings && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-2">Estimated Savings:</p>
                      <div className="text-sm text-green-800">
                        {Object.entries(rec.estimated_savings).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Generated {new Date(rec.generated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {rec.status === 'suggested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(rec.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(rec.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {rec.status === 'approved' && (
                <button
                  onClick={() => handleImplement(rec.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Mark Implemented
                </button>
              )}

              {rec.status === 'implemented' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  Implemented
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No recommendations available</p>
          <p className="text-gray-400 text-sm">
            AI will generate recommendations as processes are executed
          </p>
        </div>
      )}
    </div>
  );
}
