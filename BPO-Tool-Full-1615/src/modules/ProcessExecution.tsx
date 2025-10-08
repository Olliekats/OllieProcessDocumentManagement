import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getActiveProcessInstances, pauseProcessInstance, resumeProcessInstance, cancelProcessInstance } from '../utils/processExecution';
import { Play, Pause, Square, Clock, TrendingUp, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface ProcessInstance {
  id: string;
  instance_name: string;
  status: string;
  progress_percentage: number;
  priority: string;
  started_at: string;
  estimated_completion: string | null;
  processes: {
    name: string;
    category: string;
  };
  users_profile: {
    full_name: string;
  };
}

export default function ProcessExecution() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<ProcessInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused'>('all');

  useEffect(() => {
    loadInstances();
    const interval = setInterval(loadInstances, 10000);
    return () => clearInterval(interval);
  }, [filter, statusFilter]);

  const loadInstances = async () => {
    try {
      const data = await getActiveProcessInstances(filter === 'mine' ? user?.id : undefined);
      const filtered = statusFilter === 'all'
        ? data
        : data.filter((i: ProcessInstance) => i.status === statusFilter);
      setInstances(filtered || []);
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (instanceId: string) => {
    try {
      await pauseProcessInstance(instanceId);
      loadInstances();
    } catch (error) {
      console.error('Error pausing process:', error);
      alert('Failed to pause process');
    }
  };

  const handleResume = async (instanceId: string) => {
    try {
      await resumeProcessInstance(instanceId);
      loadInstances();
    } catch (error) {
      console.error('Error resuming process:', error);
      alert('Failed to resume process');
    }
  };

  const handleCancel = async (instanceId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await cancelProcessInstance(instanceId, reason);
      loadInstances();
    } catch (error) {
      console.error('Error cancelling process:', error);
      alert('Failed to cancel process');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-5 h-5 text-green-600" />;
      case 'paused': return <Pause className="w-5 h-5 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const stats = {
    total: instances.length,
    running: instances.filter(i => i.status === 'running').length,
    paused: instances.filter(i => i.status === 'paused').length,
    avgProgress: instances.length > 0
      ? Math.round(instances.reduce((sum, i) => sum + i.progress_percentage, 0) / instances.length)
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
          <h2 className="text-2xl font-bold text-gray-900">Process Execution Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor and manage live process instances</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'mine')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Processes</option>
            <option value="mine">My Processes</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Processes</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Activity className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm mt-4">Total running and paused</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Running Now</p>
              <p className="text-3xl font-bold mt-1">{stats.running}</p>
            </div>
            <Play className="w-12 h-12 text-green-200" />
          </div>
          <p className="text-green-100 text-sm mt-4">Currently executing</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Paused</p>
              <p className="text-3xl font-bold mt-1">{stats.paused}</p>
            </div>
            <Pause className="w-12 h-12 text-yellow-200" />
          </div>
          <p className="text-yellow-100 text-sm mt-4">Temporarily stopped</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Progress</p>
              <p className="text-3xl font-bold mt-1">{stats.avgProgress}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
          <p className="text-purple-100 text-sm mt-4">Overall completion</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Process
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instance Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.map((instance) => (
                <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {instance.processes.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {instance.processes.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{instance.instance_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instance.status)}
                      <span className="text-sm capitalize">{instance.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${instance.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {instance.progress_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(instance.priority)}`}>
                      {instance.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {new Date(instance.started_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {instance.users_profile.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {instance.status === 'running' && (
                        <button
                          onClick={() => handlePause(instance.id)}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {instance.status === 'paused' && (
                        <button
                          onClick={() => handleResume(instance.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Resume"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(instance.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {instances.length === 0 && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No active processes</p>
            <p className="text-gray-400 text-sm">
              Start a new process instance from the BPMN Builder
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
