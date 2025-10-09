import React, { useState, useEffect, useRef } from 'react';
import { Plus, ZoomIn, ZoomOut, Calendar, ChevronLeft, ChevronRight, Save, CreditCard as Edit2, Trash2, Link as LinkIcon } from 'lucide-react';

export interface GanttTask {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assigned_to?: string;
  color?: string;
  order_index: number;
}

export interface GanttDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface GanttMilestone {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'achieved' | 'missed';
}

interface GanttChartProps {
  tasks: GanttTask[];
  dependencies?: GanttDependency[];
  milestones?: GanttMilestone[];
  onTaskUpdate: (taskId: string, updates: Partial<GanttTask>) => void;
  onTaskCreate: (task: Omit<GanttTask, 'id'>) => void;
  onTaskDelete: (taskId: string) => void;
  onDependencyCreate?: (predecessor: string, successor: string) => void;
  onDependencyDelete?: (dependencyId: string) => void;
  readOnly?: boolean;
}

type TimeScale = 'day' | 'week' | 'month';

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies = [],
  milestones = [],
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onDependencyCreate,
  onDependencyDelete,
  readOnly = false,
}) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('week');
  const [viewStart, setViewStart] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<{ id: string; type: 'move' | 'resize-left' | 'resize-right' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; date: Date }>({ x: 0, date: new Date() });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const rowHeight = 40;
  const taskHeight = 28;
  const dayWidth = timeScale === 'day' ? 40 : timeScale === 'week' ? 80 : 120;
  const headerHeight = 60;

  useEffect(() => {
    if (tasks.length > 0) {
      const dates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.end_date)]);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      minDate.setDate(minDate.getDate() - 7);
      setViewStart(minDate);
    }
  }, [tasks]);

  const getDateRange = () => {
    const start = new Date(viewStart);
    const end = new Date(start);
    end.setDate(end.getDate() + (timeScale === 'day' ? 90 : timeScale === 'week' ? 180 : 365));
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  const getDaysInRange = () => {
    const days = [];
    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getDatePosition = (date: Date) => {
    const diff = date.getTime() - rangeStart.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days * (dayWidth / (timeScale === 'day' ? 1 : timeScale === 'week' ? 7 : 30));
  };

  const getDateFromPosition = (x: number) => {
    const days = x / (dayWidth / (timeScale === 'day' ? 1 : timeScale === 'week' ? 7 : 30));
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + Math.round(days));
    return date;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string, type: 'move' | 'resize-left' | 'resize-right') => {
    if (readOnly) return;
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setDraggingTask({ id: taskId, type });
    setDragStart({
      x: e.clientX,
      date: new Date(type === 'resize-right' ? task.end_date : task.start_date),
    });
    setSelectedTask(taskId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newDate = getDateFromPosition(x);
    const task = tasks.find(t => t.id === draggingTask.id);
    if (!task) return;

    const start = new Date(task.start_date);
    const end = new Date(task.end_date);

    if (draggingTask.type === 'move') {
      const daysDiff = Math.round((newDate.getTime() - dragStart.date.getTime()) / (1000 * 60 * 60 * 24));
      const newStart = new Date(start);
      const newEnd = new Date(end);
      newStart.setDate(newStart.getDate() + daysDiff);
      newEnd.setDate(newEnd.getDate() + daysDiff);

      onTaskUpdate(task.id, {
        start_date: formatDate(newStart),
        end_date: formatDate(newEnd),
      });
      setDragStart({ x: e.clientX, date: newStart });
    } else if (draggingTask.type === 'resize-left') {
      if (newDate < end) {
        onTaskUpdate(task.id, { start_date: formatDate(newDate) });
      }
    } else if (draggingTask.type === 'resize-right') {
      if (newDate > start) {
        onTaskUpdate(task.id, { end_date: formatDate(newDate) });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingTask(null);
  };

  const handleTaskClick = (taskId: string) => {
    if (linkingFrom) {
      if (linkingFrom !== taskId && onDependencyCreate) {
        onDependencyCreate(linkingFrom, taskId);
      }
      setLinkingFrom(null);
    } else {
      setSelectedTask(selectedTask === taskId ? null : taskId);
    }
  };

  const startLinking = (taskId: string) => {
    setLinkingFrom(taskId);
  };

  const renderTimelineHeader = () => {
    const days = getDaysInRange();
    const headers: JSX.Element[] = [];

    if (timeScale === 'day') {
      days.forEach((day, idx) => {
        if (idx % 1 === 0) {
          headers.push(
            <div
              key={idx}
              className="border-r border-slate-200 text-xs text-slate-600 px-1"
              style={{ width: dayWidth, minWidth: dayWidth }}
            >
              <div className="font-semibold">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              <div className="text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            </div>
          );
        }
      });
    } else if (timeScale === 'week') {
      for (let i = 0; i < days.length; i += 7) {
        const week = days[i];
        headers.push(
          <div
            key={i}
            className="border-r border-slate-200 text-xs text-slate-600 px-2"
            style={{ width: dayWidth, minWidth: dayWidth }}
          >
            <div className="font-semibold">{week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div className="text-slate-400">Week {Math.ceil((week.getDate()) / 7)}</div>
          </div>
        );
      }
    } else {
      const months = new Set<string>();
      days.forEach(day => {
        const monthKey = `${day.getFullYear()}-${day.getMonth()}`;
        if (!months.has(monthKey)) {
          months.add(monthKey);
          headers.push(
            <div
              key={monthKey}
              className="border-r border-slate-200 text-xs text-slate-600 px-2"
              style={{ width: dayWidth, minWidth: dayWidth }}
            >
              <div className="font-semibold">{day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
          );
        }
      });
    }

    return headers;
  };

  const renderGridLines = () => {
    const days = getDaysInRange();
    const lines: JSX.Element[] = [];

    days.forEach((day, idx) => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isMonthStart = day.getDate() === 1;
      const x = getDatePosition(day);

      lines.push(
        <div
          key={idx}
          className={`absolute top-0 bottom-0 ${isWeekend ? 'bg-slate-50' : ''} ${isMonthStart ? 'border-l-2 border-slate-300' : 'border-l border-slate-200'}`}
          style={{ left: x, width: dayWidth / (timeScale === 'day' ? 1 : timeScale === 'week' ? 7 : 30) }}
        />
      );
    });

    return lines;
  };

  const renderTaskBar = (task: GanttTask, index: number) => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const x = getDatePosition(start);
    const width = getDatePosition(end) - x + (dayWidth / (timeScale === 'day' ? 1 : timeScale === 'week' ? 7 : 30));
    const y = index * rowHeight + (rowHeight - taskHeight) / 2;

    const isSelected = selectedTask === task.id;
    const isDragging = draggingTask?.id === task.id;
    const isLinking = linkingFrom === task.id;

    const statusColors = {
      not_started: 'bg-slate-400',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      blocked: 'bg-red-500',
    };

    return (
      <div key={task.id} className="relative">
        <div
          className={`absolute rounded cursor-move transition-all ${statusColors[task.status]} ${
            isSelected ? 'ring-2 ring-blue-600 shadow-lg' : 'shadow'
          } ${isDragging ? 'opacity-50' : ''} ${isLinking ? 'ring-2 ring-green-500' : ''}`}
          style={{
            left: x,
            top: y,
            width: width,
            height: taskHeight,
          }}
          onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
          onClick={() => handleTaskClick(task.id)}
        >
          <div className="absolute inset-0 bg-white/20" style={{ width: `${task.progress}%` }} />

          {!readOnly && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-left')}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-right')}
              />
            </>
          )}

          <div className="px-2 text-xs font-medium text-white truncate leading-7">
            {task.name}
          </div>
        </div>
      </div>
    );
  };

  const renderDependencies = () => {
    return dependencies.map(dep => {
      const from = tasks.find(t => t.id === dep.predecessor_id);
      const to = tasks.find(t => t.id === dep.successor_id);
      if (!from || !to) return null;

      const fromIndex = tasks.indexOf(from);
      const toIndex = tasks.indexOf(to);

      const fromX = getDatePosition(new Date(from.end_date)) + (dayWidth / (timeScale === 'day' ? 1 : timeScale === 'week' ? 7 : 30));
      const fromY = fromIndex * rowHeight + rowHeight / 2;
      const toX = getDatePosition(new Date(to.start_date));
      const toY = toIndex * rowHeight + rowHeight / 2;

      const path = `M ${fromX} ${fromY} L ${(fromX + toX) / 2} ${fromY} L ${(fromX + toX) / 2} ${toY} L ${toX} ${toY}`;

      return (
        <svg key={dep.id} className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: tasks.length * rowHeight }}>
          <defs>
            <marker id={`arrow-${dep.id}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
            </marker>
          </defs>
          <path
            d={path}
            stroke="#64748b"
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#arrow-${dep.id})`}
            className="pointer-events-auto cursor-pointer hover:stroke-red-500"
            onClick={() => onDependencyDelete && onDependencyDelete(dep.id)}
          />
        </svg>
      );
    });
  };

  const renderMilestones = () => {
    return milestones.map(milestone => {
      const x = getDatePosition(new Date(milestone.date));
      const statusColors = {
        pending: 'text-blue-500',
        achieved: 'text-green-500',
        missed: 'text-red-500',
      };

      return (
        <div key={milestone.id} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: x }}>
          <div className="w-0.5 bg-orange-400 h-full" />
          <div className={`absolute -top-6 -left-12 text-xs font-semibold ${statusColors[milestone.status]}`}>
            <div className="text-center">◆</div>
            <div className="whitespace-nowrap">{milestone.name}</div>
          </div>
        </div>
      );
    });
  };

  const sortedTasks = [...tasks].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Gantt Chart</h3>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                <Plus size={16} />
                Task
              </button>
              {selectedTask && (
                <>
                  <button
                    onClick={() => startLinking(selectedTask)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    <LinkIcon size={16} />
                    Link
                  </button>
                  <button
                    onClick={() => onTaskDelete(selectedTask)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-1 border border-slate-200 rounded">
            <button
              onClick={() => setTimeScale('day')}
              className={`px-2 py-1 text-xs ${timeScale === 'day' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeScale('week')}
              className={`px-2 py-1 text-xs ${timeScale === 'week' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeScale('month')}
              className={`px-2 py-1 text-xs ${timeScale === 'month' ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const newStart = new Date(viewStart);
                newStart.setDate(newStart.getDate() - (timeScale === 'day' ? 7 : timeScale === 'week' ? 30 : 90));
                setViewStart(newStart);
              }}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setViewStart(new Date())}
              className="px-2 py-1 text-xs hover:bg-slate-100 rounded"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newStart = new Date(viewStart);
                newStart.setDate(newStart.getDate() + (timeScale === 'day' ? 7 : timeScale === 'week' ? 30 : 90));
                setViewStart(newStart);
              }}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-slate-200 bg-slate-50">
          <div className="h-16 border-b border-slate-200 flex items-center px-4 font-semibold text-slate-700">
            Task Name
          </div>
          <div className="overflow-y-auto" style={{ height: `calc(100% - ${headerHeight}px)` }}>
            {sortedTasks.map((task, index) => (
              <div
                key={task.id}
                className={`px-4 border-b border-slate-200 flex items-center cursor-pointer hover:bg-slate-100 ${
                  selectedTask === task.id ? 'bg-blue-50' : ''
                }`}
                style={{ height: rowHeight }}
                onClick={() => setSelectedTask(task.id)}
              >
                <div className="text-sm font-medium text-slate-700 truncate">{task.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="h-16 border-b border-slate-200 flex bg-slate-50 sticky top-0 z-10">
            {renderTimelineHeader()}
          </div>
          <div
            ref={canvasRef}
            className="relative"
            style={{ height: sortedTasks.length * rowHeight }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {renderGridLines()}
            {renderMilestones()}
            {renderDependencies()}
            {sortedTasks.map((task, index) => renderTaskBar(task, index))}
          </div>
        </div>
      </div>

      {linkingFrom && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Click another task to create dependency
          <button onClick={() => setLinkingFrom(null)} className="ml-3 underline">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
