import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Phone, Mail, Clock, Star, X, Paperclip, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  ChatSession,
  ChatMessage,
  createChatSession,
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  closeChatSession,
  assignChatToAgent,
  subscribeToChatMessages,
  subscribeToChatSessions,
  getCannedResponses,
  CannedResponse,
} from '../utils/chatService';

export default function LiveChat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'closed'>('active');
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    loadCannedResponses();

    const subscription = subscribeToChatSessions((session) => {
      setSessions(prev => {
        const exists = prev.find(s => s.id === session.id);
        if (exists) {
          return prev.map(s => s.id === session.id ? session : s);
        }
        return [session, ...prev];
      });
    });

    return () => {
      subscription.then(sub => sub.unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);

      const subscription = subscribeToChatMessages(selectedSession.id, (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        subscription.then(sub => sub.unsubscribe());
      };
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    setLoading(true);
    const filters = filter === 'all' ? {} : { status: filter };
    const { data, error } = await getChatSessions(filters);
    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await getChatMessages(sessionId);
    if (!error && data) {
      setMessages(data);
    }
  };

  const loadCannedResponses = async () => {
    const { data, error } = await getCannedResponses();
    if (!error && data) {
      setCannedResponses(data);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || !user) return;

    const { error } = await sendChatMessage({
      session_id: selectedSession.id,
      sender_type: 'agent',
      sender_id: user.id,
      sender_name: user.email?.split('@')[0] || 'Agent',
      content: newMessage,
    });

    if (!error) {
      setNewMessage('');
    }
  };

  const handleAcceptChat = async (session: ChatSession) => {
    if (!user) return;

    const { error } = await assignChatToAgent(session.id, user.id);
    if (!error) {
      setSelectedSession(session);
    }
  };

  const handleCloseChat = async (rating?: number) => {
    if (!selectedSession) return;

    const { error } = await closeChatSession(selectedSession.id, rating);
    if (!error) {
      setSelectedSession(null);
      loadSessions();
    }
  };

  const handleUseCannedResponse = (response: CannedResponse) => {
    setNewMessage(response.content);
    setShowCannedResponses(false);
  };

  const getSessionsByStatus = () => {
    return sessions.filter(s => filter === 'all' || s.status === filter);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-4">
      <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Chat Queue</h3>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'waiting'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'closed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : getSessionsByStatus().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <div className="text-sm">No chats</div>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {getSessionsByStatus().map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {session.customer_name}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(session.priority)}`}>
                      {session.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1 truncate">
                    {session.subject || 'General inquiry'}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{session.channel}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.wait_time_seconds)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        {selectedSession ? (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{selectedSession.customer_name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      {selectedSession.customer_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedSession.customer_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedSession.channel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status === 'waiting' && (
                    <button
                      onClick={() => handleAcceptChat(selectedSession)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Accept Chat
                    </button>
                  )}
                  {selectedSession.status === 'active' && (
                    <button
                      onClick={() => handleCloseChat()}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      Close Chat
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'agent'
                        ? 'bg-blue-600 text-white'
                        : message.sender_type === 'system'
                        ? 'bg-gray-200 text-gray-700 text-sm italic'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    {message.sender_type !== 'system' && (
                      <div className="text-xs opacity-75 mb-1">{message.sender_name}</div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedSession.status === 'active' && (
              <div className="p-4 border-t border-gray-200">
                {showCannedResponses && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">Quick Responses</div>
                      <button
                        onClick={() => setShowCannedResponses(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {cannedResponses.slice(0, 5).map((response) => (
                        <button
                          key={response.id}
                          onClick={() => handleUseCannedResponse(response)}
                          className="w-full text-left px-3 py-2 text-sm bg-white rounded hover:bg-gray-100 border border-gray-200"
                        >
                          <div className="font-medium text-gray-900">{response.title}</div>
                          <div className="text-xs text-gray-600 truncate">{response.content}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCannedResponses(!showCannedResponses)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Quick responses"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">No chat selected</div>
              <div className="text-sm">Select a chat from the queue to start</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
