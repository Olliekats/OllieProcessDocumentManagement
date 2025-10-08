import React from 'react';
import { Lightbulb, TrendingUp, Zap, CheckCircle, Clock, DollarSign } from 'lucide-react';

export const ProcessOptimizationAI: React.FC = () => {
  const opportunities = [
    { id: '1', title: 'Automate Document Classification', type: 'Automation', impact: 'High', savings: 15000, effort: 'Medium', priority: 'critical' },
    { id: '2', title: 'Remove Redundant Approval', type: 'Elimination', impact: 'High', savings: 12000, effort: 'Low', priority: 'high' },
    { id: '3', title: 'Parallelize Reviews', type: 'Simplification', impact: 'Medium', savings: 8500, effort: 'Low', priority: 'high' },
    { id: '4', title: 'Implement Smart Routing', type: 'Optimization', impact: 'Medium', savings: 6200, effort: 'Medium', priority: 'medium' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Optimization AI</h1>
          <p className="text-gray-600 mt-1">AI-powered process improvement recommendations</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Generate New Insights
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Opportunities', value: '12', icon: Lightbulb, trend: '+3' },
          { label: 'Potential Savings', value: '$127K', icon: DollarSign, trend: '+$23K' },
          { label: 'Avg ROI', value: '340%', icon: TrendingUp, trend: '+45%' },
          { label: 'Quick Wins', value: '5', icon: CheckCircle, trend: '+2' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-green-600 mt-1">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Optimization Opportunities</h2>
          <p className="text-sm text-gray-600 mt-1">AI-identified improvements ranked by impact</p>
        </div>
        <div className="divide-y divide-gray-200">
          {opportunities.map((opp) => (
            <div key={opp.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-1 h-16 rounded ${getPriorityColor(opp.priority)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{opp.title}</h3>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{opp.type}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Impact:</span>
                        <span className="ml-1 font-medium text-gray-900">{opp.impact}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Annual Savings:</span>
                        <span className="ml-1 font-medium text-green-600">${(opp.savings / 1000).toFixed(1)}K</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Effort:</span>
                        <span className="ml-1 font-medium text-gray-900">{opp.effort}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ROI:</span>
                        <span className="ml-1 font-medium text-blue-600">8 months</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    Details
                  </button>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
