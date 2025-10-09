import React, { useState, useEffect } from 'react';
import { getResourceUtilization, updateResourceUtilization } from '../utils/processMining';
import { useAuth } from '../contexts/AuthContext';
import { Users, TrendingUp, Clock, Target, Award, Activity } from 'lucide-react';

interface ResourceData {
  id: string;
  user_id: string;
  time_period: string;
  period_start: string;
  total_tasks_assigned: number;
  total_tasks_completed: number;
  avg_task_completion_minutes: number;
  utilization_rate: number;
  quality_score: number;
  on_time_completion_rate: number;
  users_profile: {
    full_name: string;
  };
}

export default function ProcessPerformance() {
  const { user } = useAuth();
  const [resourceData, setResourceData] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    loadData();
  }, [viewMode]);

  const loadData = async () => {
    try {
      const data = await getResourceUtilization(viewMode === 'mine' ? user?.id : undefined);
      setResourceData(data);
    } catch (error) {
      console.error('Error loading resource utilization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    try {
      await updateResourceUtilization(user.id);
      loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data');
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const stats = resourceData.reduce(
    (acc, r) => ({
      totalTasks: acc.totalTasks + r.total_tasks_assigned,
      completedTasks: acc.completedTasks + r.total_tasks_completed,
      avgUtilization: acc.avgUtilization + (r.utilization_rate || 0),
      count: acc.count + 1
    }),
    { totalTasks: 0, completedTasks: 0, avgUtilization: 0, count: 0 }
  );

  if (stats.count > 0) {
    stats.avgUtilization /= stats.count;
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
          <h2 className="text-2xl font-bold text-gray-900">Process Performance & Resource Utilization</h2>
          <p className="text-gray-600 mt-1">Track team productivity and resource allocation</p>
        </div>
        <div className="flex gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'all' | 'mine')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Team Members</option>
            <option value="mine">My Performance</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold mt-1">{stats.totalTasks}</p>
            </div>
            <Target className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm mt-4">Assigned across team</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completedTasks}</p>
            </div>
            <Award className="w-12 h-12 text-green-200" />
          </div>
          <p className="text-green-100 text-sm mt-4">
            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Avg Utilization</p>
              <p className="text-3xl font-bold mt-1">{Math.round(stats.avgUtilization)}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
          <p className="text-purple-100 text-sm mt-4">Team capacity</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Team Members</p>
              <p className="text-3xl font-bold mt-1">{stats.count}</p>
            </div>
            <Users className="w-12 h-12 text-orange-200" />
          </div>
          <p className="text-orange-100 text-sm mt-4">Active contributors</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Resource Utilization Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resourceData.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {resource.users_profile.full_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {resource.users_profile.full_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(resource.period_start).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{resource.total_tasks_assigned}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{resource.total_tasks_completed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatMinutes(resource.avg_task_completion_minutes || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className={`h-2 rounded-full ${
                            resource.utilization_rate >= 80
                              ? 'bg-green-600'
                              : resource.utilization_rate >= 60
                              ? 'bg-blue-600'
                              : resource.utilization_rate >= 40
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(resource.utilization_rate || 0, 100)}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${getUtilizationColor(
                          resource.utilization_rate || 0
                        )}`}
                      >
                        {Math.round(resource.utilization_rate || 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {resource.on_time_completion_rate
                        ? `${Math.round(resource.on_time_completion_rate)}%`
                        : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resourceData.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No performance data available</p>
            <p className="text-gray-400 text-sm">
              Data will appear once tasks are completed
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-800 font-medium mb-1">High Performers:</p>
            <p className="text-blue-900">
              {resourceData.filter((r) => r.utilization_rate >= 80).length} team members with 80%+ utilization
            </p>
          </div>
          <div>
            <p className="text-blue-800 font-medium mb-1">Capacity Available:</p>
            <p className="text-blue-900">
              {resourceData.filter((r) => r.utilization_rate < 60).length} team members under 60% utilization
            </p>
          </div>
          <div>
            <p className="text-blue-800 font-medium mb-1">Workload Balance:</p>
            <p className="text-blue-900">
              {stats.avgUtilization >= 70 && stats.avgUtilization <= 85
                ? 'Well balanced'
                : stats.avgUtilization > 85
                ? 'Consider redistributing'
                : 'Capacity for more work'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
