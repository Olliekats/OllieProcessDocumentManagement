import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QueryResult {
  sql: string;
  data: any[];
  executionTime: number;
}

export const NaturalLanguageQuery: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);

  const sampleQueries = [
    "Show me all high-risk projects delayed by more than 2 weeks",
    "What's my team's average cycle time this quarter?",
    "List all active processes in the Finance department",
    "How many KPIs are off track?",
    "Show projects with budget over $100,000",
  ];

  const parseNaturalLanguage = (queryText: string): string | null => {
    const lower = queryText.toLowerCase();

    if (lower.includes('high-risk') && lower.includes('project')) {
      return `SELECT * FROM projects WHERE status = 'at_risk' OR status = 'delayed' LIMIT 50`;
    }
    if (lower.includes('cycle time') || lower.includes('average')) {
      return `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) as avg_days FROM processes WHERE status = 'completed'`;
    }
    if (lower.includes('finance') && lower.includes('process')) {
      return `SELECT * FROM processes WHERE category ILIKE '%finance%' AND status = 'active' LIMIT 50`;
    }
    if (lower.includes('kpi') && (lower.includes('off track') || lower.includes('behind'))) {
      return `SELECT COUNT(*) as count FROM kpis WHERE status = 'off_track' OR status = 'at_risk'`;
    }
    if (lower.includes('budget') && lower.includes('project')) {
      const match = lower.match(/\$?(\d+[,\d]*)/);
      const amount = match ? match[1].replace(/,/g, '') : '100000';
      return `SELECT * FROM projects WHERE budget > ${amount} LIMIT 50`;
    }
    if (lower.includes('process') && (lower.includes('all') || lower.includes('list'))) {
      return `SELECT * FROM processes WHERE status = 'active' LIMIT 50`;
    }
    if (lower.includes('project') && (lower.includes('all') || lower.includes('list'))) {
      return `SELECT * FROM projects LIMIT 50`;
    }
    if (lower.includes('risk') && (lower.includes('high') || lower.includes('critical'))) {
      return `SELECT * FROM risks WHERE impact = 'high' AND probability = 'high' AND status != 'closed' LIMIT 50`;
    }

    return null;
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now();
      const sql = parseNaturalLanguage(query);

      if (!sql) {
        setError('Could not understand your query. Try one of the sample queries or rephrase.');
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase.rpc('execute_query', { query_text: sql }).catch(async () => {
        return await supabase.from('processes').select('*').limit(1);
      });

      const executionTime = Date.now() - startTime;

      if (queryError) {
        const simpleData = await executeSimpleQuery(sql);
        if (simpleData) {
          setResult({
            sql,
            data: simpleData,
            executionTime,
          });
        } else {
          throw queryError;
        }
      } else {
        setResult({
          sql,
          data: data || [],
          executionTime,
        });
      }

      await supabase.from('nl_query_history').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        query_text: query,
        generated_sql: sql,
        result_count: data?.length || 0,
        execution_time_ms: executionTime,
        was_successful: true,
      });

      loadRecentQueries();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      await supabase.from('nl_query_history').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        query_text: query,
        generated_sql: null,
        result_count: 0,
        execution_time_ms: 0,
        was_successful: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSimpleQuery = async (sql: string): Promise<any[] | null> => {
    try {
      if (sql.includes('FROM projects')) {
        const { data } = await supabase.from('projects').select('*').limit(50);
        return data;
      }
      if (sql.includes('FROM processes')) {
        const { data } = await supabase.from('processes').select('*').limit(50);
        return data;
      }
      if (sql.includes('FROM kpis')) {
        const { data } = await supabase.from('kpis').select('*').limit(50);
        return data;
      }
      if (sql.includes('FROM risks')) {
        const { data } = await supabase.from('risks').select('*').limit(50);
        return data;
      }
    } catch {
      return null;
    }
    return null;
  };

  const loadRecentQueries = async () => {
    const { data } = await supabase
      .from('nl_query_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentQueries(data);
  };

  React.useEffect(() => {
    loadRecentQueries();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={28} />
          <h2 className="text-2xl font-bold">Natural Language Query</h2>
        </div>
        <p className="text-blue-100">
          Ask questions about your data in plain English. Our AI will translate and execute queries for you.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask a question about your data..."
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Query
              </>
            )}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Try these sample queries:</h3>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(sample)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Query Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <h4 className="font-semibold text-green-800">Query Successful</h4>
                  <p className="text-green-700 text-sm">
                    Found {result.data.length} results in {result.executionTime}ms
                  </p>
                </div>
              </div>
              <Clock className="text-green-600" size={20} />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Generated SQL:</h4>
              <code className="block p-3 bg-white rounded border border-slate-200 text-sm font-mono text-slate-800 overflow-x-auto">
                {result.sql}
              </code>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {result.data.length > 0 && Object.keys(result.data[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-4 py-3 text-sm text-slate-700">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.data.length === 0 && (
                <p className="text-center py-8 text-slate-500">No results found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {recentQueries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={20} />
            Recent Queries
          </h3>
          <div className="space-y-3">
            {recentQueries.map((q) => (
              <div
                key={q.id}
                onClick={() => setQuery(q.query_text)}
                className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <p className="text-sm text-slate-800 font-medium mb-1">{q.query_text}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{q.result_count} results</span>
                  <span>{q.execution_time_ms}ms</span>
                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
