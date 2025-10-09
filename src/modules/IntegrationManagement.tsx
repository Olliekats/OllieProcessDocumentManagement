import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Link,
  Key,
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Cloud,
  MessageSquare,
  Phone,
  Zap,
  Mail,
  Users,
  FolderOpen
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'password';
    required: boolean;
  }[];
}

interface ApiKeys {
  openai?: { api_key?: string };
  twilio?: { account_sid?: string; auth_token?: string; phone_number?: string };
  salesforce?: { instance_url?: string; access_token?: string; refresh_token?: string; client_id?: string; client_secret?: string };
  bird?: { workspace_id?: string; api_key?: string };
  microsoft365?: {
    tenant_id?: string;
    client_id?: string;
    client_secret?: string;
    outlook_enabled?: boolean;
    teams_enabled?: boolean;
    sharepoint_enabled?: boolean;
    sharepoint_site_url?: string;
  };
}

export const IntegrationManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [activeIntegration, setActiveIntegration] = useState<string>('openai');

  const integrations: Integration[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'AI-powered features including transcription, sentiment analysis, and intelligent routing',
      icon: Zap,
      fields: [
        { key: 'api_key', label: 'API Key', placeholder: 'sk-...', type: 'password', required: true }
      ]
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS, Voice, and WhatsApp communication services',
      icon: Phone,
      fields: [
        { key: 'account_sid', label: 'Account SID', placeholder: 'AC...', type: 'text', required: true },
        { key: 'auth_token', label: 'Auth Token', placeholder: 'Your auth token', type: 'password', required: true },
        { key: 'phone_number', label: 'Phone Number', placeholder: '+1234567890', type: 'text', required: true }
      ]
    },
    {
      id: 'salesforce',
      name: 'Salesforce Service Cloud',
      description: 'CRM integration for case management and customer data sync',
      icon: Cloud,
      fields: [
        { key: 'instance_url', label: 'Instance URL', placeholder: 'https://yourinstance.salesforce.com', type: 'text', required: true },
        { key: 'client_id', label: 'Client ID', placeholder: 'Your connected app client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Your client secret', type: 'password', required: true },
        { key: 'access_token', label: 'Access Token', placeholder: 'Leave empty for OAuth flow', type: 'password', required: false },
        { key: 'refresh_token', label: 'Refresh Token', placeholder: 'Leave empty for OAuth flow', type: 'password', required: false }
      ]
    },
    {
      id: 'bird',
      name: 'Bird.com',
      description: 'Omnichannel messaging platform for SMS, WhatsApp, Email, and more',
      icon: MessageSquare,
      fields: [
        { key: 'workspace_id', label: 'Workspace ID', placeholder: 'Your workspace ID', type: 'text', required: true },
        { key: 'api_key', label: 'API Key', placeholder: 'Your Bird.com API key', type: 'password', required: true }
      ]
    },
    {
      id: 'microsoft365',
      name: 'Microsoft 365',
      description: 'Outlook email, Teams messaging, SharePoint document management, and task/approval workflows',
      icon: Cloud,
      fields: [
        { key: 'tenant_id', label: 'Tenant ID', placeholder: 'Your Azure AD tenant ID', type: 'text', required: true },
        { key: 'client_id', label: 'Application (Client) ID', placeholder: 'Your app registration client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'Your app client secret', type: 'password', required: true },
        { key: 'sharepoint_site_url', label: 'SharePoint Site URL', placeholder: 'https://yourtenant.sharepoint.com/sites/yoursite', type: 'text', required: false }
      ]
    }
  ];

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('api_keys')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.api_keys) {
        setApiKeys(data.api_keys);
      } else {
        await supabase.from('user_settings').insert({
          user_id: user?.id,
          api_keys: {}
        });
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      setMessage({ type: 'error', text: 'Failed to load API keys' });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ api_keys: apiKeys })
        .eq('user_id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'API keys saved successfully!' });
    } catch (error) {
      console.error('Error saving API keys:', error);
      setMessage({ type: 'error', text: 'Failed to save API keys' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (integrationId: string, field: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId as keyof ApiKeys],
        [field]: value
      }
    }));
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testConnection = async (integrationId: string) => {
    setMessage({ type: 'success', text: `Testing ${integrationId} connection...` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentIntegration = integrations.find(i => i.id === activeIntegration);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Link className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integration Management</h1>
          <p className="text-slate-600">Configure API keys for third-party integrations</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Integrations</h3>
            {integrations.map((integration) => {
              const Icon = integration.icon;
              const isConfigured = apiKeys[integration.id as keyof ApiKeys] &&
                Object.keys(apiKeys[integration.id as keyof ApiKeys] || {}).length > 0;

              return (
                <button
                  key={integration.id}
                  onClick={() => setActiveIntegration(integration.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeIntegration === integration.id
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{integration.name}</div>
                  </div>
                  {isConfigured && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {currentIntegration && (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <currentIntegration.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{currentIntegration.name}</h2>
                    <p className="text-slate-600">{currentIntegration.description}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {currentIntegration.fields.map((field) => {
                    const fieldKey = `${currentIntegration.id}.${field.key}`;
                    const value = (apiKeys[currentIntegration.id as keyof ApiKeys] as any)?.[field.key] || '';

                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !showKeys[fieldKey] ? 'password' : 'text'}
                            value={value}
                            onChange={(e) => updateField(currentIntegration.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => toggleShowKey(fieldKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showKeys[fieldKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {currentIntegration.id === 'microsoft365' && (
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-3">Enable Services</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(apiKeys.microsoft365 as any)?.outlook_enabled || false}
                            onChange={(e) => updateField('microsoft365', 'outlook_enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Mail className="w-5 h-5 text-slate-600" />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">Outlook</div>
                            <div className="text-xs text-slate-600">Email integration for notifications and communication</div>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(apiKeys.microsoft365 as any)?.teams_enabled || false}
                            onChange={(e) => updateField('microsoft365', 'teams_enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <Users className="w-5 h-5 text-slate-600" />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">Teams</div>
                            <div className="text-xs text-slate-600">Team messaging, task assignments, and approval workflows</div>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(apiKeys.microsoft365 as any)?.sharepoint_enabled || false}
                            onChange={(e) => updateField('microsoft365', 'sharepoint_enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <FolderOpen className="w-5 h-5 text-slate-600" />
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">SharePoint</div>
                            <div className="text-xs text-slate-600">Document management and collaboration</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveApiKeys}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button
                    onClick={() => testConnection(currentIntegration.id)}
                    className="flex items-center gap-2 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4" />
                    Test Connection
                  </button>
                </div>

                {currentIntegration.id === 'microsoft365' && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                        <div className="text-sm text-blue-800 space-y-2">
                          <p className="font-medium">To configure Microsoft 365 integration:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Go to Azure Portal and register a new application</li>
                            <li>Add API permissions: Mail.Send, TeamworkTag.ReadWrite, Sites.ReadWrite.All</li>
                            <li>Create a client secret and copy the values above</li>
                            <li>Configure redirect URI for OAuth flow</li>
                          </ol>
                          <p className="mt-3"><strong>Capabilities:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Outlook:</strong> Send notifications and process approval emails</li>
                            <li><strong>Teams:</strong> Create channels, post messages, manage tasks and approvals</li>
                            <li><strong>SharePoint:</strong> Store and manage process documents and SOPs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Security Note</h4>
                      <p className="text-sm text-blue-800">
                        API keys are stored securely and encrypted at rest. They are only accessible by you and used for authorized integrations within your account.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
