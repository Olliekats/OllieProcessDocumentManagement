import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Settings,
  Bell,
  User,
  Lock,
  Palette,
  Globe,
  Mail,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
  Monitor,
  Smartphone,
  Clock,
  Key,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface UserSettings {
  notification_preferences: {
    email: { enabled: boolean; approvals: boolean; mentions: boolean; assignments: boolean; digest: boolean };
    in_app: { enabled: boolean; approvals: boolean; mentions: boolean; assignments: boolean; updates: boolean };
    push: { enabled: boolean; approvals: boolean; mentions: boolean; assignments: boolean };
  };
  email_frequency: 'immediate' | 'daily_digest' | 'weekly_digest' | 'never';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  default_view: string;
  show_onboarding: boolean;
  api_keys?: {
    openai?: { api_key?: string };
  };
}

interface UserProfile {
  full_name: string;
  email: string;
  role: string;
  department: string;
}

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences' | 'security' | 'api'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    role: '',
    department: ''
  });

  const [settings, setSettings] = useState<UserSettings>({
    notification_preferences: {
      email: { enabled: true, approvals: true, mentions: true, assignments: true, digest: false },
      in_app: { enabled: true, approvals: true, mentions: true, assignments: true, updates: true },
      push: { enabled: false, approvals: false, mentions: false, assignments: false }
    },
    email_frequency: 'immediate',
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    default_view: 'dashboard',
    show_onboarding: true
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [apiKeys, setApiKeys] = useState({ openai: { api_key: '' } });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('user_settings').select('*').eq('user_id', user?.id).maybeSingle()
      ]);

      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name || '',
          email: profileRes.data.email || '',
          role: profileRes.data.role || '',
          department: profileRes.data.department || ''
        });
      }

      if (settingsRes.data) {
        const loadedSettings = settingsRes.data as UserSettings;
        setSettings(loadedSettings);
        if (loadedSettings.api_keys?.openai) {
          setApiKeys(prev => ({ ...prev, openai: loadedSettings.api_keys.openai || { api_key: '' } }));
        }
      } else {
        await supabase.from('user_settings').insert({ user_id: user?.id });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          department: profile.department
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user?.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
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
      setMessage({ type: 'error', text: 'Failed to save API keys' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API Keys', icon: Key }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Settings className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-600">Manage your account settings and preferences</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-2 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Operations, Finance, HR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Role is managed by administrators</p>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Notifications
                </h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  <label className="flex items-center justify-between">
                    <span className="text-slate-700">Enable email notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notification_preferences.email.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        notification_preferences: {
                          ...settings.notification_preferences,
                          email: { ...settings.notification_preferences.email, enabled: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  {settings.notification_preferences.email.enabled && (
                    <>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Approval requests</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.email.approvals}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              email: { ...settings.notification_preferences.email, approvals: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Mentions and comments</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.email.mentions}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              email: { ...settings.notification_preferences.email, mentions: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Task assignments</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.email.assignments}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              email: { ...settings.notification_preferences.email, assignments: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>

                      <div className="pt-4 border-t border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Frequency</label>
                        <select
                          value={settings.email_frequency}
                          onChange={(e) => setSettings({ ...settings, email_frequency: e.target.value as any })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily_digest">Daily Digest</option>
                          <option value="weekly_digest">Weekly Digest</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  In-App Notifications
                </h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  <label className="flex items-center justify-between">
                    <span className="text-slate-700">Enable in-app notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notification_preferences.in_app.enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        notification_preferences: {
                          ...settings.notification_preferences,
                          in_app: { ...settings.notification_preferences.in_app, enabled: e.target.checked }
                        }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  {settings.notification_preferences.in_app.enabled && (
                    <>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Approval requests</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.in_app.approvals}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              in_app: { ...settings.notification_preferences.in_app, approvals: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Mentions and comments</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.in_app.mentions}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              in_app: { ...settings.notification_preferences.in_app, mentions: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Task assignments</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.in_app.assignments}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              in_app: { ...settings.notification_preferences.in_app, assignments: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between pl-6">
                        <span className="text-slate-600">Process updates</span>
                        <input
                          type="checkbox"
                          checked={settings.notification_preferences.in_app.updates}
                          onChange={(e) => setSettings({
                            ...settings,
                            notification_preferences: {
                              ...settings.notification_preferences,
                              in_app: { ...settings.notification_preferences.in_app, updates: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Default View</label>
                <select
                  value={settings.default_view}
                  onChange={(e) => setSettings({ ...settings, default_view: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="processes">My Processes</option>
                  <option value="tasks">My Tasks</option>
                  <option value="approvals">Approvals</option>
                </select>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={saving || !passwordData.new || !passwordData.confirm}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">Password Requirements</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Minimum 6 characters</li>
                      <li>• Use a unique password</li>
                      <li>• Consider using a password manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  OpenAI API Configuration
                </h3>
                <p className="text-slate-600 mb-4">
                  Configure your OpenAI API key to enable AI-powered features including transcription, sentiment analysis, and intelligent routing.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeys.openai.api_key}
                        onChange={(e) => setApiKeys({ ...apiKeys, openai: { api_key: e.target.value } })}
                        className="w-full px-4 py-2 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="sk-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
                    </p>
                  </div>

                  <button
                    onClick={saveApiKeys}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save API Key'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Security Note</h4>
                    <p className="text-sm text-blue-800">
                      Your API key is stored securely and encrypted at rest. It is only accessible by you and used for authorized AI features within your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-2">AI-Powered Features</h4>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Speech-to-text transcription for calls and voice interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Sentiment analysis for customer interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Intelligent complaint routing and categorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>AI-powered process optimization suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Natural language query for analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
