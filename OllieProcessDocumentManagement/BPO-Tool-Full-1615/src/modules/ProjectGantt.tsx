import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GanttChart, GanttTask, GanttDependency, GanttMilestone } from '../components/GanttChart';
import { ArrowLeft, Plus, Save } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export const ProjectGantt: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [milestones, setMilestones] = useState<GanttMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'not_started' as const,
    progress: 0,
    color: '#3b82f6',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('transition_projects')
        .select('id, name, start_date, end_date')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProject) return;

    try {
      const [tasksRes, depsRes, milestonesRes] = await Promise.all([
        supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', selectedProject)
          .order('order_index', { ascending: true }),
        supabase
          .from('task_dependencies')
          .select(`
            id,
            predecessor_id,
            successor_id,
            dependency_type
          `)
          .in('predecessor_id', tasks.map(t => t.id)),
        supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', selectedProject)
          .order('date', { ascending: true }),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (depsRes.error) throw depsRes.error;
      if (milestonesRes.error) throw milestonesRes.error;

      setTasks(tasksRes.data || []);
      setDependencies(depsRes.data || []);
      setMilestones(milestonesRes.data || []);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<GanttTask>) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskCreate = async () => {
    if (!selectedProject || !taskForm.name || !taskForm.start_date || !taskForm.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const maxOrder = Math.max(...tasks.map(t => t.order_index), -1);
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: selectedProject,
          ...taskForm,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setShowTaskForm(false);
      setTaskForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'not_started',
        progress: 0,
        color: '#3b82f6',
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.filter(t => t.id !== taskId));
      setDependencies(dependencies.filter(d => d.predecessor_id !== taskId && d.successor_id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDependencyCreate = async (predecessorId: string, successorId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({
          predecessor_id: predecessorId,
          successor_id: successorId,
          dependency_type: 'finish_to_start',
        })
        .select()
        .single();

      if (error) throw error;

      setDependencies([...dependencies, data]);
    } catch (error) {
      console.error('Error creating dependency:', error);
    }
  };

  const handleDependencyDelete = async (dependencyId: string) => {
    try {
      const { error } = await supabase.from('task_dependencies').delete().eq('id', dependencyId);

      if (error) throw error;

      setDependencies(dependencies.filter(d => d.id !== dependencyId));
    } catch (error) {
      console.error('Error deleting dependency:', error);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Projects Found</h3>
        <p className="text-slate-500">Create a transition project first to view Gantt charts.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Project Timeline</h2>
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowTaskForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {currentProject && (
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <strong>{currentProject.name}</strong> | {currentProject.start_date} to {currentProject.end_date} | {tasks.length} tasks
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <GanttChart
          tasks={tasks}
          dependencies={dependencies}
          milestones={milestones}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskDelete={handleTaskDelete}
          onDependencyCreate={handleDependencyCreate}
          onDependencyDelete={handleDependencyDelete}
        />
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Name *</label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter task name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={taskForm.start_date}
                    onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={taskForm.end_date}
                    onChange={(e) => setTaskForm({ ...taskForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taskForm.progress}
                    onChange={(e) => setTaskForm({ ...taskForm, progress: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input
                  type="color"
                  value={taskForm.color}
                  onChange={(e) => setTaskForm({ ...taskForm, color: e.target.value })}
                  className="w-full h-10 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowTaskForm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTaskCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
