import React, { useState, useEffect } from 'react';
import { Inbox, MessageSquare, Ticket, AlertCircle, Search, Filter, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UnifiedConversation {
  channel_type: string;
  id: string;
  reference_number: string;
  subject: string;
  content_preview: string;
  status: string;
  priority: string;
  assigned_agent_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface ChannelMetrics {
  channel_type: string;
  total_conversations: number;
  active_conversations: number;
  closed_conversations: number;
  last_24h: number;
  last_7d: number;
  unique_customers: number;
}

export default function UnifiedInbox() {
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [metrics, setMetrics] = useState<ChannelMetrics[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [filter, setFilter] = useState<'all' | 'ticket' | 'chat' | 'complaint'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    loadMetrics();
  }, [filter, statusFilter]);

  const loadConversations = async () => {
    setLoading(true);
    let query = supabase.from('unified_conversations').select('*').order('created_at', { ascending: false }).limit(100);

    if (filter !== 'all') {
      query = query.eq('channel_type', filter);
    }

    if (statusFilter === 'active') {
      query = query.in('status', ['open', 'waiting', 'active', 'in_progress']);
    } else if (statusFilter === 'closed') {
      query = query.in('status', ['closed', 'resolved']);
    }

    const { data, error } = await query;

    if (!error && data) {
      setConversations(data);
    }
    setLoading(false);
  };

  const loadMetrics = async () => {
    const { data, error } = await supabase.from('omnichannel_metrics').select('*');

    if (!error && data) {
      setMetrics(data);
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'ticket': return <Ticket className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'complaint': return <AlertCircle className="w-4 h-4" />;
      default: return <Inbox className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case 'ticket': return 'bg-blue-100 text-blue-700';
      case 'chat': return 'bg-green-100 text-green-700';
      case 'complaint': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'waiting':
      case 'active':
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'closed':
      case 'resolved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(searchLower) ||
      conv.customer_name?.toLowerCase().includes(searchLower) ||
      conv.customer_email?.toLowerCase().includes(searchLower) ||
      conv.reference_number?.toLowerCase().includes(searchLower)
    );
  });

  const totalMetrics = metrics.reduce((acc, metric) => ({
    total: acc.total + metric.total_conversations,
    active: acc.active + metric.active_conversations,
    closed: acc.closed + metric.closed_conversations,
    last_24h: acc.last_24h + metric.last_24h,
  }), { total: 0, active: 0, closed: 0, last_24h: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unified Inbox</h2>
          <p className="text-gray-600 mt-1">All customer interactions in one place</p>
        </div>
        <Inbox className="w-8 h-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Conversations</div>
          <div className="text-2xl font-bold text-gray-900">{totalMetrics.total}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-2xl font-bold text-orange-600">{totalMetrics.active}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Closed</div>
          <div className="text-2xl font-bold text-green-600">{totalMetrics.closed}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Last 24 Hours</div>
          <div className="text-2xl font-bold text-blue-600">{totalMetrics.last_24h}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div key={metric.channel_type} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getChannelIcon(metric.channel_type)}
                <span className="font-semibold text-gray-900 capitalize">{metric.channel_type}s</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Total</div>
                <div className="font-semibold text-gray-900">{metric.total_conversations}</div>
              </div>
              <div>
                <div className="text-gray-600">Active</div>
                <div className="font-semibold text-orange-600">{metric.active_conversations}</div>
              </div>
              <div>
                <div className="text-gray-600">24h</div>
                <div className="font-semibold text-blue-600">{metric.last_24h}</div>
              </div>
              <div>
                <div className="text-gray-600">Customers</div>
                <div className="font-semibold text-gray-900">{metric.unique_customers}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Channels</option>
                <option value="ticket">Tickets</option>
                <option value="chat">Chats</option>
                <option value="complaint">Complaints</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No conversations found</div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={`${conversation.channel_type}-${conversation.id}`}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getChannelColor(conversation.channel_type)}`}>
                    {getChannelIcon(conversation.channel_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {conversation.subject}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2 truncate">
                      {conversation.content_preview}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {conversation.customer_name || conversation.customer_email || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conversation.created_at).toLocaleString()}
                      </span>
                      <span className="font-mono">#{conversation.reference_number}</span>
                    </div>

                    {conversation.tags && conversation.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {conversation.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Conversation Details</h3>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getChannelColor(selectedConversation.channel_type)}`}>
                    {getChannelIcon(selectedConversation.channel_type)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedConversation.subject}</div>
                    <div className="text-sm text-gray-600">#{selectedConversation.reference_number}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Customer</div>
                    <div className="font-medium text-gray-900">
                      {selectedConversation.customer_name || 'Unknown'}
                    </div>
                    {selectedConversation.customer_email && (
                      <div className="text-gray-600">{selectedConversation.customer_email}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(selectedConversation.status)}`}>
                      {selectedConversation.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-600">Priority</div>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getPriorityColor(selectedConversation.priority)}`}>
                      {selectedConversation.priority}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-600">Created</div>
                    <div className="font-medium text-gray-900">
                      {new Date(selectedConversation.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-600 text-sm mb-1">Description</div>
                  <div className="p-3 bg-gray-50 rounded text-sm text-gray-900">
                    {selectedConversation.content_preview}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <button
                onClick={() => {
                  const route = selectedConversation.channel_type === 'ticket'
                    ? '/tickets'
                    : selectedConversation.channel_type === 'chat'
                    ? '/live-chat'
                    : '/complaints';
                  window.location.hash = route;
                  setSelectedConversation(null);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Open in {selectedConversation.channel_type} Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
