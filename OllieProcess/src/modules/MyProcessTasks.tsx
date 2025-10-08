import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyTasks, startTask, completeTask } from '../utils/processExecution';
import { CheckCircle, Clock, Play, AlertCircle, FileText } from 'lucide-react';

interface Task {
  id: string;
  node_label: string;
  node_type: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  started_at: string | null;
  process_instances: {
    instance_name: string;
    priority: string;
    processes: {
      name: string;
    };
  };
}

export default function MyProcessTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'in_progress'>('all');

  useEffect(() => {
    if (user) {
      loadTasks();
      const interval = setInterval(loadTasks, 15000);
      return () => clearInterval(interval);
    }
  }, [user, statusFilter]);

  const loadTasks = async () => {
    if (!user) return;

    try {
      const data = await getMyTasks(
        user.id,
        statusFilter === 'all' ? undefined : statusFilter
      );
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Error starting task:', error);
      alert('Failed to start task');
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    try {
      await completeTask(selectedTask.id, completionData);
      setShowCompletionModal(false);
      setSelectedTask(null);
      setCompletionData({});
      loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const openCompletionModal = (task: Task) => {
    setSelectedTask(task);
    setCompletionData({});
    setShowCompletionModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length
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
          <h2 className="text-2xl font-bold text-gray-900">My Process Tasks</h2>
          <p className="text-gray-600 mt-1">Tasks assigned to you from active workflows</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
            </div>
            <Play className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Urgent</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.urgent}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.node_label}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Process:</span>{' '}
                    {task.process_instances.processes.name}
                  </p>
                  <p>
                    <span className="font-medium">Instance:</span>{' '}
                    {task.process_instances.instance_name}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created {getTimeAgo(task.created_at)}
                    {task.started_at && (
                      <span className="ml-2">
                        • Started {getTimeAgo(task.started_at)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {task.status === 'pending' || task.status === 'assigned' ? (
                  <button
                    onClick={() => handleStartTask(task.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                ) : null}

                {task.status === 'in_progress' && (
                  <button
                    onClick={() => openCompletionModal(task)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No tasks assigned</p>
          <p className="text-gray-400 text-sm">
            You're all caught up! New tasks will appear here when assigned.
          </p>
        </div>
      )}

      {showCompletionModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Complete Task: {selectedTask.node_label}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={completionData.notes || ''}
                  onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Add any notes about task completion..."
                />
              </div>

              {selectedTask.node_type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Outcome
                  </label>
                  <select
                    value={completionData.decision || ''}
                    onChange={(e) => setCompletionData({ ...completionData, decision: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select outcome...</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="escalate">Escalate</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setSelectedTask(null);
                  setCompletionData({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
