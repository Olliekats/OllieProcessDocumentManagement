import React, { useState, useEffect } from 'react';
import {
  getActiveBottlenecks,
  getNodeMetrics,
  resolveBottleneck,
  Bottleneck,
  NodeMetrics
} from '../utils/processMining';
import { AlertTriangle, CheckCircle, TrendingDown, Clock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Process {
  id: string;
  name: string;
}

export default function BottleneckDetection() {
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProcess) {
      loadNodeMetrics(selectedProcess);
    }
  }, [selectedProcess]);

  const loadData = async () => {
    try {
      const [bottlenecksData, processesData] = await Promise.all([
        getActiveBottlenecks(),
        loadProcesses()
      ]);

      setBottlenecks(bottlenecksData);
      setProcesses(processesData);

      if (processesData.length > 0 && !selectedProcess) {
        setSelectedProcess(processesData[0].id);
      }
    } catch (error) {
      console.error('Error loading bottlenecks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    const { data } = await supabase
      .from('processes')
      .select('id, name')
      .eq('status', 'active')
      .order('name');

    return data || [];
  };

  const loadNodeMetrics = async (processId: string) => {
    try {
      const data = await getNodeMetrics(processId);
      setNodeMetrics(data);
    } catch (error) {
      console.error('Error loading node metrics:', error);
    }
  };

  const handleResolve = async (bottleneckId: string) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;

    setResolvingId(bottleneckId);
    try {
      await resolveBottleneck(bottleneckId, notes);
      loadData();
    } catch (error) {
      console.error('Error resolving bottleneck:', error);
      alert('Failed to resolve bottleneck');
    } finally {
      setResolvingId(null);
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

  const stats = {
    total: bottlenecks.length,
    critical: bottlenecks.filter(b => b.severity === 'critical').length,
    high: bottlenecks.filter(b => b.severity === 'high').length,
    avgImpact: bottlenecks.length > 0
      ? bottlenecks.reduce((sum, b) => sum + b.impactScore, 0) / bottlenecks.length
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
          <h2 className="text-2xl font-bold text-gray-900">Bottleneck Detection & Resolution</h2>
          <p className="text-gray-600 mt-1">Identify and resolve process bottlenecks automatically</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Refresh Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Bottlenecks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Critical</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.critical}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">High Priority</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.high}</p>
            </div>
            <TrendingDown className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Impact</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.avgImpact.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {bottlenecks.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Active Bottlenecks</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {bottlenecks.map((bottleneck) => (
              <div key={bottleneck.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-semibold text-gray-900">
                        {bottleneck.nodeLabel}
                      </h4>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                          bottleneck.severity
                        )}`}
                      >
                        {bottleneck.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(bottleneck.id)}
                    disabled={resolvingId === bottleneck.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600 font-medium">Average Delay</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatMinutes(bottleneck.avgDelayMinutes)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600 font-medium">Impact Score</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {bottleneck.impactScore.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600 font-medium">Affected</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {bottleneck.affectedInstancesCount}
                    </p>
                    <p className="text-xs text-gray-500">instances</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <p className="text-sm text-gray-600 font-medium">Detected</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(bottleneck.detectedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(bottleneck.detectedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {bottleneck.recommendedActions && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {Array.isArray(bottleneck.recommendedActions) ? (
                        bottleneck.recommendedActions.map((action: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))
                      ) : (
                        <li>{JSON.stringify(bottleneck.recommendedActions)}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {processes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Node Performance Analysis</h3>
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Node
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Executions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Throughput
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nodeMetrics.map((node) => (
                  <tr
                    key={node.nodeId}
                    className={node.isBottleneck ? 'bg-orange-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{node.nodeLabel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatMinutes(node.avgProcessingMinutes)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{node.totalExecutions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {node.throughputRate.toFixed(2)}/hr
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {node.isBottleneck ? (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(
                            node.bottleneckSeverity || 'medium'
                          )}`}
                        >
                          Bottleneck
                        </span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {nodeMetrics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No metrics available for this process</p>
              </div>
            )}
          </div>
        </div>
      )}

      {bottlenecks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-900 text-lg font-semibold mb-2">No Bottlenecks Detected</p>
          <p className="text-gray-500 text-sm">
            All processes are running smoothly. Great work!
          </p>
        </div>
      )}
    </div>
  );
}
