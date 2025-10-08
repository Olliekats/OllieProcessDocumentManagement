import React from 'react';
import { BookOpen, Lightbulb, TrendingUp, Zap, FileText, CheckCircle } from 'lucide-react';

export const SmartKnowledgeManagement: React.FC = () => {
  const articles = [
    { id: '1', title: 'Password Reset Procedure', views: 1247, helpful: 96, lastUpdated: '2025-10-01', status: 'published', effectiveness: 94 },
    { id: '2', title: 'Payment Processing Guide', views: 892, helpful: 94, lastUpdated: '2025-09-28', status: 'published', effectiveness: 91 },
    { id: '3', title: 'Refund Policy Explained', views: 734, helpful: 88, lastUpdated: '2025-09-25', status: 'published', effectiveness: 85 },
    { id: '4', title: 'Account Setup Tutorial', views: 2103, helpful: 98, lastUpdated: '2025-10-03', status: 'published', effectiveness: 97 },
  ];

  const suggestions = [
    { id: '1', article: 'Password Reset Procedure', ticket: '#1234', relevance: 96, used: true },
    { id: '2', article: 'Payment Processing Guide', ticket: '#1235', relevance: 92, used: true },
    { id: '3', article: 'Refund Policy Explained', ticket: '#1236', relevance: 88, used: false },
  ];

  const gaps = [
    { id: '1', topic: 'Multi-factor Authentication Setup', frequency: 45, priority: 'high', searches: 67 },
    { id: '2', topic: 'Billing Cycle Changes', frequency: 32, priority: 'medium', searches: 48 },
    { id: '3', topic: 'API Integration Guide', frequency: 28, priority: 'high', searches: 52 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Knowledge Management</h1>
          <p className="text-gray-600 mt-1">AI-powered knowledge base with auto-generation</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Create Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Articles', value: '247', icon: BookOpen, trend: '+23 this month' },
          { label: 'Avg Effectiveness', value: '92%', icon: TrendingUp, trend: '+5%' },
          { label: 'AI Suggestions', value: '1,834', icon: Zap, trend: 'Today' },
          { label: 'Auto-Generated', value: '45', icon: Lightbulb, trend: 'This month' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-green-600 mt-1">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Articles</h2>
            <p className="text-sm text-gray-600 mt-1">Most helpful content</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Views:</span>
                      <span className="ml-1 font-medium">{article.views}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Helpful:</span>
                      <span className="ml-1 font-medium text-green-600">{article.helpful}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Score:</span>
                      <span className="ml-1 font-medium">{article.effectiveness}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">AI Suggestions Today</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time article recommendations</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{suggestion.article}</h4>
                      <p className="text-xs text-gray-500 mt-1">Suggested for {suggestion.ticket}</p>
                    </div>
                    <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Relevance:</span>
                      <span className="ml-1 font-medium text-blue-600">{suggestion.relevance}%</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${suggestion.used ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {suggestion.used ? 'Used' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Knowledge Gaps Detected</h2>
          <p className="text-sm text-gray-600 mt-1">Missing content identified by AI</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div key={gap.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{gap.topic}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>{gap.frequency} tickets without solution</span>
                    <span>•</span>
                    <span>{gap.searches} failed searches</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${gap.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {gap.priority} priority
                  </span>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI Learning Active</h3>
            <p className="text-gray-700">
              The knowledge base is continuously learning from <span className="font-medium text-yellow-700">1,834 ticket resolutions</span> today.
              <span className="font-medium text-green-700"> 45 articles auto-generated</span> this month with
              <span className="font-medium text-blue-700"> 92% average effectiveness</span> score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
