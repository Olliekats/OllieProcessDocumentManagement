import React, { useState, useEffect } from 'react';
import {
  getKnowledgeArticles,
  getKnowledgeCategories,
  createKnowledgeArticle,
  searchKnowledge,
  incrementArticleView,
  voteArticleHelpful
} from '../utils/knowledgeManagement';
import { BookOpen, Search, Plus, ThumbsUp, Eye, FileText } from 'lucide-react';

export default function KnowledgeManagement() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    categoryId: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        getKnowledgeArticles(selectedCategory || undefined),
        getKnowledgeCategories()
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      loadData();
      return;
    }

    try {
      const results = await searchKnowledge(searchTerm);
      setArticles(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleCreateArticle = async () => {
    if (!newArticle.title || !newArticle.content || !newArticle.categoryId) return;

    try {
      await createKnowledgeArticle(newArticle.title, newArticle.content, newArticle.categoryId);
      setShowCreate(false);
      setNewArticle({ title: '', content: '', categoryId: '' });
      loadData();
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Failed to create article');
    }
  };

  const handleViewArticle = async (article: any) => {
    setSelectedArticle(article);
    await incrementArticleView(article.id);
  };

  const handleVoteHelpful = async (articleId: string, isHelpful: boolean) => {
    try {
      await voteArticleHelpful(articleId, isHelpful);
      loadData();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Knowledge Base
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>

          <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {selectedArticle.view_count || 0} views
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              {selectedArticle.helpful_count || 0} helpful
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedArticle.content}
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 mb-3">Was this article helpful?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleVoteHelpful(selectedArticle.id, true)}
                className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => handleVoteHelpful(selectedArticle.id, false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Knowledge Management
          </h2>
          <p className="text-gray-600 mt-1">Centralized knowledge base and documentation</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Article
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search knowledge base..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => handleViewArticle(article)}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-blue-500"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                {article.knowledge_categories && (
                  <span className="text-xs text-blue-600 font-medium">
                    {article.knowledge_categories.name}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {article.content?.substring(0, 150)}...
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {article.helpful_count || 0}
                </span>
              </div>
              <span>
                {new Date(article.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No articles found</p>
          <p className="text-gray-400 text-sm">Start building your knowledge base</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Article</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newArticle.categoryId}
                  onChange={(e) => setNewArticle({ ...newArticle, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArticle}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
