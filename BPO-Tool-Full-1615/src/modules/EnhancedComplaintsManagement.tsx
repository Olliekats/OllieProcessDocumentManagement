import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, AlertTriangle, TrendingUp, Clock, CheckCircle,
  Sparkles, Brain, Users, MessageSquare, X, Save, AlertCircle
} from 'lucide-react';
import { analyzeAndRouteComplaint, logRoutingDecision, type ComplaintRoutingSuggestion } from '../utils/aiComplaintRouting';

interface Complaint {
  id: string;
  complaint_number: string;
  customer_name: string;
  complaint_type: string;
  subject: string;
  description?: string;
  severity: string;
  status: string;
  reported_date: string;
  assigned_to?: string;
}

interface NewComplaint {
  customer_name: string;
  complaint_type: string;
  subject: string;
  description: string;
}

export const EnhancedComplaintsManagement = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ComplaintRoutingSuggestion | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [newComplaint, setNewComplaint] = useState<NewComplaint>({
    customer_name: '',
    complaint_type: 'service',
    subject: '',
    description: '',
  });
  const [manualOverride, setManualOverride] = useState({
    category: '',
    priority: '',
    assignee: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    critical: 0,
    avgResolutionTime: 0,
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('reported_date', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);

      const total = data?.length || 0;
      const open = data?.filter(c => c.status === 'open' || c.status === 'investigating').length || 0;
      const critical = data?.filter(c => c.severity === 'critical').length || 0;

      setStats({ total, open, critical, avgResolutionTime: 24 });
      setLoading(false);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!newComplaint.subject || !newComplaint.description) {
      alert('Please enter both subject and description');
      return;
    }

    setAnalyzingAI(true);
    try {
      const suggestion = await analyzeAndRouteComplaint(
        newComplaint.subject,
        newComplaint.description,
        newComplaint.complaint_type
      );
      setAiSuggestion(suggestion);
      setManualOverride({
        category: suggestion.suggestedCategory,
        priority: suggestion.suggestedPriority,
        assignee: suggestion.suggestedAssignee || '',
      });
    } catch (error) {
      console.error('Error analyzing complaint:', error);
      alert('AI analysis failed. Please fill in details manually.');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const submitComplaint = async () => {
    if (!newComplaint.customer_name || !newComplaint.subject || !newComplaint.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const complaintNumber = `CMP-${Date.now().toString().slice(-8)}`;

      const { data: insertedComplaint, error } = await supabase
        .from('complaints')
        .insert({
          complaint_number: complaintNumber,
          customer_name: newComplaint.customer_name,
          complaint_type: manualOverride.category || newComplaint.complaint_type,
          subject: newComplaint.subject,
          description: newComplaint.description,
          severity: manualOverride.priority || 'medium',
          status: 'open',
          assigned_to: manualOverride.assignee || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (aiSuggestion && insertedComplaint) {
        const wasOverridden =
          manualOverride.category !== aiSuggestion.suggestedCategory ||
          manualOverride.priority !== aiSuggestion.suggestedPriority ||
          manualOverride.assignee !== aiSuggestion.suggestedAssignee;

        await logRoutingDecision(
          insertedComplaint.id,
          aiSuggestion,
          manualOverride.assignee || null,
          wasOverridden,
          wasOverridden ? 'Manual adjustment during creation' : undefined
        );
      }

      setShowForm(false);
      setAiSuggestion(null);
      setNewComplaint({
        customer_name: '',
        complaint_type: 'service',
        subject: '',
        description: '',
      });
      setManualOverride({ category: '', priority: '', assignee: '' });
      loadComplaints();
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert('Failed to create complaint');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'very_negative': return 'text-red-600';
      case 'negative': return 'text-orange-600';
      case 'neutral': return 'text-slate-600';
      case 'positive': return 'text-green-600';
      case 'very_positive': return 'text-green-700';
      default: return 'text-slate-600';
    }
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
          <h2 className="text-2xl font-bold text-slate-800">Complaints Management</h2>
          <p className="text-slate-600 mt-1">AI-powered complaint routing and resolution</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Complaint</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Complaints</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
            </div>
            <AlertTriangle size={32} className="text-slate-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Open</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.open}</p>
            </div>
            <Clock size={32} className="text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Critical</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.critical}</p>
            </div>
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Resolution (hrs)</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.avgResolutionTime}</p>
            </div>
            <TrendingUp size={32} className="text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Complaint #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {complaint.complaint_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {complaint.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                    {complaint.complaint_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                    {complaint.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(complaint.severity)}`}>
                      {complaint.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {new Date(complaint.reported_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {complaints.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <CheckCircle size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No complaints recorded</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800">New Complaint</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setAiSuggestion(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 mb-4">Complaint Details</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={newComplaint.customer_name}
                      onChange={(e) => setNewComplaint({ ...newComplaint, customer_name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Complaint Type
                    </label>
                    <select
                      value={newComplaint.complaint_type}
                      onChange={(e) => setNewComplaint({ ...newComplaint, complaint_type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="service">Service Quality</option>
                      <option value="billing">Billing Issue</option>
                      <option value="technical">Technical Problem</option>
                      <option value="product">Product Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={newComplaint.subject}
                      onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newComplaint.description}
                      onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Provide detailed information about the complaint..."
                    />
                  </div>

                  <button
                    onClick={analyzeWithAI}
                    disabled={analyzingAI}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {analyzingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Analyze with AI</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  {aiSuggestion ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="text-blue-600" size={20} />
                          <h4 className="font-semibold text-blue-900">AI Analysis</h4>
                          <span className="ml-auto text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full font-medium">
                            {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Sentiment: </span>
                            <span className={`font-semibold ${getSentimentColor(aiSuggestion.sentiment.label)}`}>
                              {aiSuggestion.sentiment.label.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-600 ml-2">
                              ({(aiSuggestion.sentiment.score * 100).toFixed(0)})
                            </span>
                          </div>

                          {aiSuggestion.sentiment.urgencyScore > 0.5 && (
                            <div className="flex items-center gap-2 text-orange-700">
                              <AlertCircle size={16} />
                              <span className="font-medium">
                                High urgency detected ({(aiSuggestion.sentiment.urgencyScore * 100).toFixed(0)}%)
                              </span>
                            </div>
                          )}

                          <div className="text-slate-700">
                            <span className="font-medium">Reasoning: </span>
                            {aiSuggestion.reasoning}
                          </div>

                          {aiSuggestion.autoActions.length > 0 && (
                            <div>
                              <span className="font-medium text-slate-700">Auto Actions:</span>
                              <ul className="list-disc list-inside ml-2 mt-1 text-slate-600">
                                {aiSuggestion.autoActions.map((action, idx) => (
                                  <li key={idx}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Users size={18} />
                        Routing Configuration
                        <span className="text-xs font-normal text-slate-500">(Override if needed)</span>
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Category
                        </label>
                        <input
                          type="text"
                          value={manualOverride.category}
                          onChange={(e) => setManualOverride({ ...manualOverride, category: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Priority
                        </label>
                        <select
                          value={manualOverride.priority}
                          onChange={(e) => setManualOverride({ ...manualOverride, priority: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      {aiSuggestion.suggestedResponses.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="text-green-600" size={18} />
                            <h4 className="font-semibold text-green-900">Suggested Responses</h4>
                          </div>
                          <div className="space-y-2">
                            {aiSuggestion.suggestedResponses.slice(0, 2).map((response, idx) => (
                              <div key={idx} className="text-sm text-slate-700 bg-white p-3 rounded border border-green-200">
                                {response}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Brain size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Click "Analyze with AI" to get routing suggestions</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setAiSuggestion(null);
                  }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitComplaint}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save size={18} />
                  <span>Create Complaint</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
