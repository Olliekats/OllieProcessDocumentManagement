import React, { useState, useEffect } from 'react';
import {
  getIntegrationConnections,
  getWebhooks,
  getIntegrationLogs,
  createConnection,
  createWebhook,
  toggleWebhook,
  testConnection
} from '../utils/integrations';
import { Plug, Webhook, Activity, Plus, Power, CheckCircle, XCircle } from 'lucide-react';

export default function IntegrationHub() {
  const [connections, setConnections] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'webhooks' | 'logs'>('connections');
  const [showCreateConnection, setShowCreateConnection] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);

  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'rest_api',
    baseUrl: '',
    authType: 'api_key',
    authConfig: {}
  });

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    event: 'process.completed',
    method: 'POST'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [connsData, webhooksData, logsData] = await Promise.all([
        getIntegrationConnections(),
        getWebhooks(),
        getIntegrationLogs()
      ]);

      setConnections(connsData);
      setWebhooks(webhooksData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    if (!newConnection.name || !newConnection.baseUrl) return;

    try {
      await createConnection(
        newConnection.name,
        newConnection.type,
        newConnection.baseUrl,
        newConnection.authType,
        newConnection.authConfig
      );
      setShowCreateConnection(false);
      setNewConnection({
        name: '',
        type: 'rest_api',
        baseUrl: '',
        authType: 'api_key',
        authConfig: {}
      });
      loadData();
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Failed to create connection');
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) return;

    try {
      await createWebhook(
        newWebhook.name,
        newWebhook.url,
        newWebhook.event,
        newWebhook.method
      );
      setShowCreateWebhook(false);
      setNewWebhook({
        name: '',
        url: '',
        event: 'process.completed',
        method: 'POST'
      });
      loadData();
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      await toggleWebhook(id, !isActive);
      loadData();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      await testConnection(id);
      alert('Connection test successful!');
      loadData();
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Connection test failed');
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plug className="w-7 h-7 text-blue-600" />
            Enterprise Integration Hub
          </h2>
          <p className="text-gray-600 mt-1">Connect with external systems and APIs</p>
        </div>
        {activeTab === 'connections' && (
          <button
            onClick={() => setShowCreateConnection(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Connection
          </button>
        )}
        {activeTab === 'webhooks' && (
          <button
            onClick={() => setShowCreateWebhook(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Webhook
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'connections'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plug className="w-4 h-4" />
                Connections ({connections.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'webhooks'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Webhook className="w-4 h-4" />
                Webhooks ({webhooks.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'logs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" />
                Activity Log
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'connections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((conn) => (
                <div key={conn.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Plug className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{conn.connection_name}</h3>
                        <p className="text-sm text-gray-600">{conn.connection_type}</p>
                      </div>
                    </div>
                    {conn.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        <Power className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3 truncate">{conn.base_url}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(conn.id)}
                      className="flex-1 px-3 py-1 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
                    >
                      Test
                    </button>
                  </div>
                  {conn.last_test_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last tested: {new Date(conn.last_test_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{webhook.webhook_name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{webhook.webhook_url}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Event: {webhook.trigger_event}</span>
                        <span>Method: {webhook.webhook_method}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        webhook.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {webhook.success_count || 0}
                    </span>
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {webhook.failure_count || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    log.status === 'success'
                      ? 'bg-green-100'
                      : log.status === 'failed'
                      ? 'bg-red-100'
                      : 'bg-gray-100'
                  }`}>
                    <Activity className={`w-4 h-4 ${
                      log.status === 'success'
                        ? 'text-green-600'
                        : log.status === 'failed'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.integration_type}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-500">{log.direction}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      {log.duration_ms && (
                        <span className="ml-3">Duration: {log.duration_ms}ms</span>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">New Connection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Connection Name</label>
                <input
                  type="text"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newConnection.type}
                  onChange={(e) => setNewConnection({ ...newConnection, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="rest_api">REST API</option>
                  <option value="soap">SOAP</option>
                  <option value="graphql">GraphQL</option>
                  <option value="database">Database</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                <input
                  type="text"
                  value={newConnection.baseUrl}
                  onChange={(e) => setNewConnection({ ...newConnection, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateConnection(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">New Webhook</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Name</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="text"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Event</label>
                <select
                  value={newWebhook.event}
                  onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="process.started">Process Started</option>
                  <option value="process.completed">Process Completed</option>
                  <option value="task.assigned">Task Assigned</option>
                  <option value="task.completed">Task Completed</option>
                  <option value="sla.breach">SLA Breach</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateWebhook(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
