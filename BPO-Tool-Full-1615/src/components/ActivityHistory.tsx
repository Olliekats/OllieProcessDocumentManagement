import React, { useEffect, useState } from 'react';
import { Clock, User, CreditCard as Edit2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  changes: any;
  created_at: string;
}

interface ActivityHistoryProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  entityType,
  entityId,
  limit = 20,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [entityType, entityId]);

  const loadActivities = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return <Plus size={16} className="text-green-600" />;
      case 'update':
        return <Edit2 size={16} className="text-blue-600" />;
      case 'delete':
        return <Trash2 size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-slate-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No activity history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Activity History</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex gap-4 p-4 rounded-lg border ${getActionColor(activity.action)}`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {activity.action.toUpperCase()} {activity.entity_type}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    ID: {activity.entity_id.slice(0, 8)}...
                  </p>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleString()}
                </span>
              </div>
              {activity.changes && Object.keys(activity.changes).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                    View changes
                  </summary>
                  <div className="mt-2 p-2 bg-white rounded text-xs font-mono">
                    <pre className="whitespace-pre-wrap break-words">
                      {JSON.stringify(activity.changes, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
