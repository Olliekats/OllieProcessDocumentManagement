import React from 'react';
import { Globe, Users, BarChart3, FileText, Star, TrendingUp } from 'lucide-react';

export const ClientSuccessPlatform: React.FC = () => {
  const portals = [
    { id: '1', client: 'Acme Corp', subdomain: 'acme', users: 45, satisfaction: 4.8, tickets: 234, sla: 96 },
    { id: '2', client: 'TechStart Inc', subdomain: 'techstart', users: 28, satisfaction: 4.6, tickets: 156, sla: 94 },
    { id: '3', client: 'Global Retail', subdomain: 'globalretail', users: 82, satisfaction: 4.9, tickets: 421, sla: 98 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Success Platform</h1>
          <p className="text-gray-600 mt-1">White-labeled portals and client self-service</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Create Portal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Portals', value: '12', icon: Globe, trend: '+2 this month' },
          { label: 'Total Portal Users', value: '842', icon: Users, trend: '+15%' },
          { label: 'Avg Satisfaction', value: '4.7', icon: Star, trend: '⭐⭐⭐⭐⭐' },
          { label: 'SLA Compliance', value: '96%', icon: TrendingUp, trend: '+2%' },
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

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Client Portals</h2>
          <p className="text-sm text-gray-600 mt-1">Manage white-labeled client access</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {portals.map((portal) => (
              <div key={portal.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900 text-lg">{portal.client}</h3>
                    <p className="text-sm text-gray-500">{portal.subdomain}.yourplatform.com</p>
                  </div>
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Users</div>
                    <div className="text-lg font-semibold text-gray-900">{portal.users}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Satisfaction</div>
                    <div className="text-lg font-semibold text-green-600">{portal.satisfaction}/5.0</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Active Tickets</div>
                    <div className="text-lg font-semibold text-gray-900">{portal.tickets}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">SLA</div>
                    <div className="text-lg font-semibold text-green-600">{portal.sla}%</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    Customize
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    View Portal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Portal Analytics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Avg Session Duration</span>
              <span className="font-semibold text-gray-900">8m 32s</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Self-Service Rate</span>
              <span className="font-semibold text-green-600">73%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Ticket Deflection</span>
              <span className="font-semibold text-green-600">42%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Automated Reports
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Weekly SLA Report</span>
              <span className="text-xs text-purple-600 font-medium">Auto-send Mon</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Monthly Performance</span>
              <span className="text-xs text-purple-600 font-medium">Auto-send 1st</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Satisfaction Survey</span>
              <span className="text-xs text-purple-600 font-medium">After tickets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
