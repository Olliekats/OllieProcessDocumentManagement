import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageCircle,
  Send,
  Sparkles,
  FileText,
  BookOpen,
  Settings,
  X,
  Maximize2,
  Minimize2,
  MapPin
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  results?: any;
  suggestions?: string[];
  timestamp: Date;
}

interface GlobalAIAssistantProps {
  currentModule?: string;
  currentModuleName?: string;
}

export default function GlobalAIAssistant({ currentModule, currentModuleName }: GlobalAIAssistantProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !conversationId) {
      startNewConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getContextualWelcome = () => {
    const moduleHelp: Record<string, string[]> = {
      'dashboard': [
        'Show me critical alerts',
        'What are the pending approvals?',
        'Show ticket trends',
        'Display CSAT scores'
      ],
      'integrated-contact-center': [
        'How do I create a new ticket?',
        'Show me my open tickets',
        'What are the ticket priorities?',
        'How do I assign tickets?'
      ],
      'integrated-complaints': [
        'How do I file a complaint?',
        'Show me critical complaints',
        'What is the escalation process?',
        'How do I resolve complaints?'
      ],
      'process-mapping': [
        'How do I create a new process?',
        'Show me all active processes',
        'Find processes related to onboarding',
        'Explain BPMN notation'
      ],
      'knowledge-base': [
        'How do I create an article?',
        'Search for training materials',
        'Show me SOPs',
        'Find troubleshooting guides'
      ],
      'workforce-management': [
        'How do I create a schedule?',
        'Show me team capacity',
        'Explain shift management',
        'How do I request time off?'
      ]
    };

    const suggestions = moduleHelp[currentModule || ''] || [
      'Show me all active processes',
      'How do I create a new process?',
      'Find SOPs for client onboarding',
      'What are my pending tasks?'
    ];

    const contextMessage = currentModuleName
      ? `Hi! I'm your AI Support Assistant. I can see you're on the ${currentModuleName} module. How can I help you?`
      : "Hi! I'm your AI Support Assistant. I can help you find processes, SOPs, knowledge articles, and guide you through any procedures. What can I help you with today?";

    return { contextMessage, suggestions };
  };

  const startNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          conversation_type: 'support',
          conversation_title: `${currentModuleName || 'General'} Support`,
          context_module: currentModule
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);

      const { contextMessage, suggestions } = getContextualWelcome();

      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: contextMessage,
        suggestions: suggestions,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        message_type: 'user_query',
        message_content: inputMessage,
        sender_type: 'user',
        context_module: currentModule
      });

      const { data: response } = await supabase.rpc('generate_ai_response', {
        p_user_message: inputMessage,
        p_conversation_id: conversationId,
        p_context_module: currentModule
      });

      let assistantContent = response?.message || "I'm here to help! Let me search for relevant information.";
      const results = response?.results;
      const suggestions = response?.suggestions;

      if (results) {
        const processCount = (results.processes || []).length;
        const sopCount = (results.sops || []).length;
        const knowledgeCount = (results.knowledge || []).length;

        if (processCount > 0 || sopCount > 0 || knowledgeCount > 0) {
          assistantContent = `I found ${processCount} process(es), ${sopCount} SOP(s), and ${knowledgeCount} knowledge article(s) related to your query. Check the results below!`;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantContent,
        results: results,
        suggestions: suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }

      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        message_type: 'ai_response',
        message_content: assistantContent,
        sender_type: 'assistant',
        referenced_items: results
      });

      await supabase
        .from('support_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request. Please try again or rephrase your question.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const renderResults = (results: any) => {
    if (!results) return null;

    const { processes = [], sops = [], knowledge = [], artifacts = [] } = results;
    const allResults = [...processes, ...sops, ...knowledge, ...artifacts];

    if (allResults.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {processes.map((item: any, idx: number) => (
          <div key={`process-${idx}`} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-blue-900 text-sm">{item.title}</h4>
                <p className="text-xs text-blue-700 line-clamp-2">{item.description}</p>
                <span className="text-xs text-blue-600">Process</span>
              </div>
            </div>
          </div>
        ))}

        {sops.map((item: any, idx: number) => (
          <div key={`sop-${idx}`} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-purple-900 text-sm">{item.title}</h4>
                <p className="text-xs text-purple-700 line-clamp-2">{item.content}</p>
                <span className="text-xs text-purple-600">SOP</span>
              </div>
            </div>
          </div>
        ))}

        {knowledge.map((item: any, idx: number) => (
          <div key={`knowledge-${idx}`} className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
              <div className="min-w-0">
                <h4 className="font-semibold text-green-900 text-sm">{item.title}</h4>
                <p className="text-xs text-green-700 line-clamp-2">{item.content}</p>
                <span className="text-xs text-green-600">Knowledge Article</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 z-50 group"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
        <span className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Assistant - Always here to help
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 ${
        isExpanded
          ? 'inset-4'
          : 'bottom-6 right-6 w-96 h-[600px]'
      }`}
      style={{ maxHeight: isExpanded ? '100vh' : '600px' }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold">AI Support Assistant</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1 truncate">
              {currentModuleName && (
                <>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{currentModuleName}</span>
                </>
              )}
              {!currentModuleName && 'Always here to help'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {message.results && renderResults(message.results)}

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs opacity-75">Suggested questions:</p>
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        message.type === 'user'
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-white hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs opacity-50 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-slate-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          AI-powered support • Context-aware help for {currentModuleName || 'all modules'}
        </p>
      </div>
    </div>
  );
}
