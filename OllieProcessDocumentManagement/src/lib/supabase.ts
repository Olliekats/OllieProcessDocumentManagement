import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values if env vars aren't loaded
// This is a workaround for when the dev server hasn't restarted
const FALLBACK_URL = 'https://herzmxhksfkphpwjnakf.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcnpteGhrc2ZrcGhwd2puYWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDMzOTMsImV4cCI6MjA3NTQ3OTM5M30.SRucW3so06OKQtw39CSlH8rckTmgn0m7WEOo7gMwCKk';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

const usingFallback = !import.meta.env.VITE_SUPABASE_URL;

if (usingFallback) {
  console.warn('⚠️ Using hardcoded Supabase credentials (env vars not loaded)');
  console.warn('🔧 This is a temporary workaround. Restart dev server to use .env file');
} else {
  console.log('✅ Supabase initialized successfully from environment variables');
}

console.log('🔗 Connected to:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string;
          full_name: string;
          role: string;
          department: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users_profile']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users_profile']['Insert']>;
      };
    };
  };
};
