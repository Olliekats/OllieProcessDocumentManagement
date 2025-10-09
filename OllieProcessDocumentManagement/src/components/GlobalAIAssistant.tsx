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

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const getOpenAIKey = () => {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  const keyPreview = key ? `${key.substring(0, 10)}...${key.substring(key.length - 4)}` : 'NOT FOUND';
  console.log('🔑 OpenAI Key:', keyPreview, '| Present:', !!key, '| Length:', key?.length);
  if (!key) {
    console.error('❌ VITE_OPENAI_API_KEY is not set in environment variables!');
  }
  return key;
};

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
      ? `Hi! I'm Ollie, your AI Support Assistant. I can see you're on the ${currentModuleName} module. How can I help you?`
      : "Hi! I'm Ollie, your AI Support Assistant. I can help you find processes, SOPs, knowledge articles, and guide you through any procedures. What can I help you with today?";

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
          conversation_title: `${currentModuleName || 'General'} Support`
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
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

  const callOpenAI = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    const OPENAI_API_KEY = getOpenAIKey();

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting OpenAI call...');

    const systemPrompt = `You are Ollie, a helpful AI assistant for OllieProcess, a Business Process Management platform.

Current Module: ${currentModuleName || 'Dashboard'}

You help users with:
- Understanding platform features and navigation
- Answering questions about process management, SOPs, BPMN, workflows
- Providing guidance on using different modules
- Explaining how to accomplish tasks in the platform

Key Platform Features:
- Process Management: Upload documents, AI generates BPMN, SOPs, RACI, Risk matrices
- SOP Builder: Create, edit SOPs with version control and approvals
- Visual BPMN: Create and edit process diagrams
- Knowledge Management: Create and search knowledge articles
- Process Analytics: Track performance and bottlenecks
- Workflow Execution: Run and monitor process instances

Be concise, helpful, and specific to the user's question. Provide step-by-step guidance when appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI call failed:', error);
      throw error;
    }
  };

  const generateContextualResponse = (message: string, module?: string): { content: string; suggestions: string[] } => {
    const lowerMessage = message.toLowerCase();

    const moduleResponses: Record<string, any> = {
      'process-management': {
        keywords: ['upload', 'document', 'manage', 'do', 'can', 'what'],
        response: `On the Process Management screen, you can:

• **Upload Documents**: Upload process documents (PDF, DOCX, PPTX, VSDX) for AI analysis
• **AI Processing**: The system automatically generates BPMN diagrams, SOPs, RACI matrices, and risk controls
• **View Artifacts**: Access all generated artifacts from uploaded documents
• **Version Control**: Track versions of your processes
• **Approvals**: Request and manage approval workflows
• **Create SOPs**: Click "Create SOP" on any artifact to add it to the SOP Builder with full version control`,
        suggestions: [
          'How do I upload a process document?',
          'What artifacts are generated?',
          'How do I create an SOP from an artifact?',
          'Tell me about the approval workflow'
        ]
      },
      'dashboard': {
        keywords: ['show', 'view', 'display', 'what'],
        response: `The Dashboard provides:

• **Process Overview**: View all active processes and their status
• **Key Metrics**: See completion rates, average cycle times, and performance indicators
• **Pending Tasks**: Quick access to items requiring your attention
• **Recent Activity**: Latest updates across all modules
• **Analytics**: Visual charts showing trends and insights`,
        suggestions: [
          'Show me pending tasks',
          'What are the key metrics?',
          'Show recent activity',
          'Display process analytics'
        ]
      },
      'sop-builder': {
        keywords: ['create', 'upload', 'export', 'version'],
        response: `In the SOP Builder, you can:

• **Create SOPs**: Build new Standard Operating Procedures from scratch
• **Upload Documents**: Import existing SOPs from TXT, DOCX, or PDF files
• **Version Control**: Track all changes with automatic versioning
• **Approval Workflow**: Request approval and publish SOPs
• **Export**: Download SOPs as PDF or DOCX with professional formatting
• **Link to Processes**: SOPs can be created from process artifacts`,
        suggestions: [
          'How do I create a new SOP?',
          'How do I upload an existing document?',
          'How does version control work?',
          'How do I export an SOP?'
        ]
      },
      'knowledge-management': {
        keywords: ['article', 'search', 'create', 'find'],
        response: `In Knowledge Management, you can:

• **Create Articles**: Write and publish knowledge base articles
• **Organize Content**: Use categories and tags for easy navigation
• **Search**: Find articles quickly with full-text search
• **Vote & Rate**: Mark articles as helpful to improve quality
• **Track Usage**: See view counts and effectiveness metrics
• **Link to Processes**: Connect articles to relevant processes`,
        suggestions: [
          'How do I create a knowledge article?',
          'How do I search for information?',
          'How do I organize articles?',
          'What are article categories?'
        ]
      }
    };

    const moduleInfo = moduleResponses[module || ''] || moduleResponses['dashboard'];

    const matchesKeyword = moduleInfo.keywords.some((kw: string) => lowerMessage.includes(kw));

    if (matchesKeyword || lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return {
        content: moduleInfo.response,
        suggestions: moduleInfo.suggestions
      };
    }

    return {
      content: `I'm Ollie, your AI assistant for OllieProcess. I can help you navigate the platform, understand features, and find information. What would you like to know?`,
      suggestions: moduleInfo.suggestions
    };
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
    const currentInput = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const { error: msgError } = await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        message_type: 'user_query',
        message_content: currentInput,
        sender_type: 'user',
        context_module: currentModule
      });

      if (msgError) {
        console.error('Error inserting user message:', msgError);
      }

      let content: string;
      let suggestions: string[] = [];

      const apiKey = getOpenAIKey();

      if (apiKey) {
        try {
          console.log('Calling OpenAI with message:', currentInput);
          content = await callOpenAI(currentInput, messages);
          console.log('OpenAI response received:', content);

          const { suggestions: contextSuggestions } = generateContextualResponse(currentInput, currentModule);
          suggestions = contextSuggestions;
        } catch (openaiError) {
          console.error('OpenAI call failed, using fallback. Error:', openaiError);
          const fallback = generateContextualResponse(currentInput, currentModule);
          content = fallback.content;
          suggestions = fallback.suggestions;
        }
      } else {
        console.warn('No OpenAI key found in environment, using fallback response');
        const fallback = generateContextualResponse(currentInput, currentModule);
        content = fallback.content;
        suggestions = fallback.suggestions;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: content,
        suggestions: suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }

      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        message_type: 'ai_response',
        message_content: content,
        sender_type: 'assistant',
        referenced_items: null
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
        aria-label="Open Ollie AI Assistant"
      >
        <span className="text-3xl">😺</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
        <span className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ollie - Always here to help
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
            <span className="text-2xl">😺</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold">Ollie - AI Support Assistant</h3>
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
          Ollie • AI-powered support • Context-aware help for {currentModuleName || 'all modules'}
        </p>
      </div>
    </div>
  );
}
