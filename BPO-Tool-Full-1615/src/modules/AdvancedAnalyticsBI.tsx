import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Target, PieChart, Activity } from 'lucide-react';

export const AdvancedAnalyticsBI: React.FC = () => {
  const dashboards = [
    { id: '1', name: 'Executive Overview', widgets: 12, lastViewed: '2h ago', owner: 'Sarah Chen' },
    { id: '2', name: 'Operations Dashboard', widgets: 8, lastViewed: '15m ago', owner: 'Mike Johnson' },
    { id: '3', name: 'Financial Metrics', widgets: 10, lastViewed: '1h ago', owner: 'Anna Rodriguez' },
  ];

  const metrics = [
    { name: 'Cost per Contact', value: '$12.45', change: -8, trend: 'down', target: '$13.50' },
    { name: 'Revenue per Agent', value: '$45.2K', change: 12, trend: 'up', target: '$42K' },
    { name: 'Client Profitability', value: '34%', change: 5, trend: 'up', target: '30%' },
    { name: 'Efficiency Score', value: '87%', change: 3, trend: 'up', target: '85%' },
  ];

  const benchmarks = [
    { metric: 'First Call Resolution', our: 87, industry: 78, best: 92 },
    { metric: 'Customer Satisfaction', our: 4.7, industry: 4.2, best: 4.9 },
    { metric: 'Agent Utilization', our: 82, industry: 75, best: 85 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics & BI</h1>
          <p className="text-gray-600 mt-1">Custom dashboards and predictive insights</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Build Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Custom Dashboards', value: '24', icon: BarChart3 },
          { label: 'Active Widgets', value: '186', icon: PieChart },
          { label: 'Data Sources', value: '12', icon: Activity },
          { label: 'Predictive Models', value: '8', icon: TrendingUp },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Key Business Metrics</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time performance indicators</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.map((metric, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    <span className={`flex items-center gap-1 text-sm font-medium ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.trend === 'up' ? '↑' : '↓'} {Math.abs(metric.change)}%
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                      <div className="text-xs text-gray-500 mt-1">Target: {metric.target}</div>
                    </div>
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Industry Benchmarks</h2>
            <p className="text-sm text-gray-600 mt-1">Compare against industry standards</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {benchmarks.map((benchmark, idx) => (
                <div key={idx}>
                  <div className="text-sm font-medium text-gray-900 mb-2">{benchmark.metric}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Our Score</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${typeof benchmark.our === 'number' ? (benchmark.our / (benchmark.best || 5)) * 100 : benchmark.our}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-blue-600 w-12">{benchmark.our}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Industry</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${typeof benchmark.industry === 'number' ? (benchmark.industry / (benchmark.best || 5)) * 100 : benchmark.industry}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12">{benchmark.industry}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Best</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-sm font-semibold text-green-600 w-12">{benchmark.best}</span>
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
          <h2 className="text-lg font-semibold text-gray-900">My Dashboards</h2>
          <p className="text-sm text-gray-600 mt-1">Custom analytics dashboards</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboards.map((dashboard) => (
              <div key={dashboard.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-gray-500">{dashboard.lastViewed}</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{dashboard.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{dashboard.widgets} widgets</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">By {dashboard.owner}</span>
                  <button className="text-blue-600 text-sm hover:text-blue-700">Open →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Predictive Analytics Active</h3>
            <p className="text-gray-700">
              <span className="font-medium text-blue-700">8 ML models</span> are running predictions across
              <span className="font-medium text-blue-700"> 24 custom dashboards</span>.
              Cost-per-contact down <span className="font-medium text-green-700">8%</span> with
              revenue per agent up <span className="font-medium text-green-700">12%</span> this quarter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
