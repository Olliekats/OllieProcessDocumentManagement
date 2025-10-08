import React, { useState, useEffect } from 'react';
import {
  getProcessMetrics,
  getCycleTimeAnalysis,
  getActiveBottlenecks,
  ProcessMetrics,
  Bottleneck
} from '../utils/processMining';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target
} from 'lucide-react';

export default function ProcessAnalytics() {
  const [metrics, setMetrics] = useState<ProcessMetrics[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [cycleTimeData, setCycleTimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    loadData();
  }, [period]);

  useEffect(() => {
    if (selectedProcess) {
      loadCycleTimeAnalysis(selectedProcess);
    }
  }, [selectedProcess]);

  const loadData = async () => {
    try {
      const [metricsData, bottlenecksData] = await Promise.all([
        getProcessMetrics(period, 20),
        getActiveBottlenecks()
      ]);

      setMetrics(metricsData);
      setBottlenecks(bottlenecksData);

      if (metricsData.length > 0 && !selectedProcess) {
        setSelectedProcess(metricsData[0].processId);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCycleTimeAnalysis = async (processId: string) => {
    try {
      const data = await getCycleTimeAnalysis(processId);
      setCycleTimeData(data);
    } catch (error) {
      console.error('Error loading cycle time:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const overallStats = metrics.reduce(
    (acc, m) => ({
      totalInstances: acc.totalInstances + m.totalInstances,
      completedInstances: acc.completedInstances + m.completedInstances,
      avgSuccessRate: acc.avgSuccessRate + m.successRate,
      processCount: acc.processCount + 1
    }),
    { totalInstances: 0, completedInstances: 0, avgSuccessRate: 0, processCount: 0 }
  );

  if (overallStats.processCount > 0) {
    overallStats.avgSuccessRate /= overallStats.processCount;
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Process Analytics & Mining</h2>
          <p className="text-gray-600 mt-1">Real-time insights and performance analysis</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Instances</p>
              <p className="text-3xl font-bold mt-1">{overallStats.totalInstances}</p>
            </div>
            <Activity className="w-12 h-12 text-blue-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm text-blue-100">Across all processes</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold mt-1">{overallStats.completedInstances}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-green-100">
              {Math.round(overallStats.avgSuccessRate)}% success rate
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Bottlenecks</p>
              <p className="text-3xl font-bold mt-1">{bottlenecks.length}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-orange-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-orange-100">Requiring attention</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Processes</p>
              <p className="text-3xl font-bold mt-1">{metrics.length}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-purple-100">With recent activity</span>
          </div>
        </div>
      </div>

      {cycleTimeData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Cycle Time Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMinutes(cycleTimeData.average)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Median</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMinutes(cycleTimeData.median)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">95th %ile</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMinutes(cycleTimeData.p95)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fastest</p>
              <p className="text-2xl font-bold text-green-600">
                {formatMinutes(cycleTimeData.min)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Slowest</p>
              <p className="text-2xl font-bold text-red-600">
                {formatMinutes(cycleTimeData.max)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Based on {cycleTimeData.sampleSize} completed instances
          </p>
        </div>
      )}

      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Active Bottlenecks
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {bottlenecks.map((bottleneck) => (
              <div key={bottleneck.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {bottleneck.nodeLabel}
                      </h4>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                          bottleneck.severity
                        )}`}
                      >
                        {bottleneck.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Avg Delay</p>
                        <p className="font-semibold text-gray-900">
                          {formatMinutes(bottleneck.avgDelayMinutes)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impact Score</p>
                        <p className="font-semibold text-gray-900">
                          {bottleneck.impactScore.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Affected Instances</p>
                        <p className="font-semibold text-gray-900">
                          {bottleneck.affectedInstancesCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Detected {new Date(bottleneck.detectedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Process Performance Metrics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bottlenecks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr
                  key={metric.processId}
                  onClick={() => setSelectedProcess(metric.processId)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedProcess === metric.processId ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {metric.processName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{metric.totalInstances}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{metric.completedInstances}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatMinutes(metric.avgCompletionMinutes || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metric.successRate || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {Math.round(metric.successRate || 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {metric.bottleneckCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3" />
                        {metric.bottleneckCount}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {metrics.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No process data available</p>
            <p className="text-gray-400 text-sm">
              Metrics will appear once processes have been executed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
