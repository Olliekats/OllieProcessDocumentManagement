import React, { useState } from 'react';
import { Activity, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign, Target, Zap } from 'lucide-react';

interface ProcessVariant {
  id: string;
  name: string;
  frequency: number;
  avgDuration: number;
  efficiency: number;
  isStandard: boolean;
}

interface Bottleneck {
  id: string;
  activity: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  waitTime: number;
  impact: number;
  recommendation: string;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  impact: string;
  savings: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export const ProcessDiscoveryMining: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  const variants: ProcessVariant[] = [
    { id: '1', name: 'Standard Path', frequency: 450, avgDuration: 180, efficiency: 95, isStandard: true },
    { id: '2', name: 'Express Path', frequency: 320, avgDuration: 120, efficiency: 98, isStandard: false },
    { id: '3', name: 'Rework Path', frequency: 85, avgDuration: 340, efficiency: 62, isStandard: false },
    { id: '4', name: 'Escalation Path', frequency: 45, avgDuration: 480, efficiency: 55, isStandard: false },
  ];

  const bottlenecks: Bottleneck[] = [
    { id: '1', activity: 'Document Review', type: 'time', severity: 'high', waitTime: 240, impact: 35, recommendation: 'Add parallel reviewers' },
    { id: '2', activity: 'Approval Queue', type: 'resource', severity: 'critical', waitTime: 480, impact: 45, recommendation: 'Implement auto-approval rules' },
    { id: '3', activity: 'Data Entry', type: 'quality', severity: 'medium', waitTime: 120, impact: 15, recommendation: 'Use OCR automation' },
  ];

  const insights: Insight[] = [
    { id: '1', type: 'automation', title: 'Automate Document Classification', impact: 'time', savings: 12500, priority: 'high' },
    { id: '2', type: 'elimination', title: 'Remove Redundant Approval Step', impact: 'cost', savings: 8300, priority: 'critical' },
    { id: '3', type: 'simplification', title: 'Streamline Data Entry Forms', impact: 'quality', savings: 5200, priority: 'medium' },
    { id: '4', type: 'parallelization', title: 'Enable Parallel Document Review', impact: 'time', savings: 15800, priority: 'high' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Process Discovery & Mining</h1>
          <p className="text-gray-600 mt-1">AI-powered process analysis and optimization insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Processes</option>
            <option value="complaint">Complaint Handling</option>
            <option value="order">Order Processing</option>
            <option value="onboarding">Customer Onboarding</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analyze Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Process Instances</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">900</div>
          <div className="text-xs text-green-600 mt-1">+15% vs last period</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Variants Found</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">4</div>
          <div className="text-xs text-gray-600 mt-1">Deviation rate: 32%</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Cycle Time</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">3.2h</div>
          <div className="text-xs text-red-600 mt-1">+8% slower</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Est. Savings</span>
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">$41.8K</div>
          <div className="text-xs text-green-600 mt-1">From AI insights</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Process Variants</h2>
            <p className="text-sm text-gray-600 mt-1">Different execution paths discovered</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{variant.name}</h3>
                      {variant.isStandard && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Standard</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{variant.frequency} instances</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">Avg Duration</div>
                      <div className="font-medium text-gray-900">{variant.avgDuration}m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Efficiency</div>
                      <div className="font-medium text-gray-900">{variant.efficiency}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Frequency</div>
                      <div className="font-medium text-gray-900">{Math.round((variant.frequency / 900) * 100)}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${variant.efficiency > 90 ? 'bg-green-500' : variant.efficiency > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${variant.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bottlenecks Detected</h2>
            <p className="text-sm text-gray-600 mt-1">AI-identified performance issues</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bottlenecks.map((bottleneck) => (
                <div key={bottleneck.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{bottleneck.activity}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(bottleneck.severity)}`}>
                          {bottleneck.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{bottleneck.type} bottleneck</div>
                    </div>
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">Avg Wait Time</div>
                      <div className="font-medium text-gray-900">{bottleneck.waitTime}m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Impact</div>
                      <div className="font-medium text-gray-900">{bottleneck.impact}%</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">{bottleneck.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Optimization Insights</h2>
          <p className="text-sm text-gray-600 mt-1">AI-powered improvement recommendations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1 h-8 rounded ${getPriorityColor(insight.priority)}`} />
                      <div>
                        <h3 className="font-medium text-gray-900">{insight.title}</h3>
                        <div className="text-xs text-gray-500 capitalize mt-0.5">{insight.type} opportunity</div>
                      </div>
                    </div>
                  </div>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">Est. Annual Savings</div>
                    <div className="font-semibold text-green-600">${(insight.savings / 1000).toFixed(1)}K</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 text-right">Impact Area</div>
                    <div className="font-medium text-gray-900 capitalize text-right">{insight.impact}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Process Mining Active</h3>
            <p className="text-gray-700 mb-3">
              AI is continuously analyzing your process executions to discover patterns, identify inefficiencies, and recommend optimizations.
              <span className="font-medium text-blue-700"> 900 instances analyzed</span> in the last 30 days with
              <span className="font-medium text-green-700"> $41.8K in potential savings</span> identified.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                View Full Report
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                Export Insights
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
