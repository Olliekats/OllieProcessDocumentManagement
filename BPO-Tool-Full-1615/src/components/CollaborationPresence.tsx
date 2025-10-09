import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users } from 'lucide-react';

interface ActiveUser {
  id: string;
  user_id: string;
  user_name: string;
  module: string;
  last_seen: string;
}

interface CollaborationPresenceProps {
  module: string;
}

export const CollaborationPresence: React.FC<CollaborationPresenceProps> = ({ module }) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [presenceId, setPresenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let presenceChannel: any;
    let heartbeatInterval: any;

    const setupPresence = async () => {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || user.email || 'Anonymous';

      const { data, error } = await supabase
        .from('active_users')
        .insert({
          user_id: user.id,
          user_name: userName,
          module,
          last_seen: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating presence:', error);
        return;
      }

      if (data) {
        setPresenceId(data.id);
      }

      loadActiveUsers();

      heartbeatInterval = setInterval(async () => {
        if (data?.id) {
          await supabase
            .from('active_users')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', data.id);
        }
        cleanupStaleUsers();
      }, 10000);

      presenceChannel = supabase
        .channel(`presence:${module}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'active_users',
            filter: `module=eq.${module}`,
          },
          () => {
            loadActiveUsers();
          }
        )
        .subscribe();
    };

    const loadActiveUsers = async () => {
      const { data } = await supabase
        .from('active_users')
        .select('*')
        .eq('module', module)
        .neq('user_id', user.id)
        .gte('last_seen', new Date(Date.now() - 30000).toISOString());

      if (data) {
        setActiveUsers(data);
      }
    };

    const cleanupStaleUsers = async () => {
      await supabase
        .from('active_users')
        .delete()
        .lt('last_seen', new Date(Date.now() - 30000).toISOString());
      loadActiveUsers();
    };

    setupPresence();

    return () => {
      if (presenceId) {
        supabase.from('active_users').delete().eq('id', presenceId);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [user, module]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
      <Users className="w-4 h-4 text-green-600" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-800 font-medium">
          {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} active
        </span>
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 3).map((activeUser) => (
            <div
              key={activeUser.id}
              className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
              title={activeUser.user_name}
            >
              {activeUser.user_name.charAt(0).toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white">
              +{activeUsers.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
