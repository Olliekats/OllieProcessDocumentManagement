import React, { useState } from 'react';
import { Zap, Activity, Clock, Users, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

export const DynamicProcessOrchestrator: React.FC = () => {
  const [activeView, setActiveView] = useState<'live' | 'rules' | 'performance'>('live');

  const liveProcesses = [
    { id: '1', name: 'Customer Onboarding #1247', status: 'running', assignee: 'Sarah Chen', slaHealth: 85, adaptations: 2 },
    { id: '2', name: 'Complaint Resolution #892', status: 'waiting', assignee: 'Mike Johnson', slaHealth: 45, adaptations: 1 },
    { id: '3', name: 'Order Processing #3421', status: 'running', assignee: 'Anna Rodriguez', slaHealth: 92, adaptations: 0 },
    { id: '4', name: 'Approval Workflow #556', status: 'at-risk', assignee: 'James Lee', slaHealth: 35, adaptations: 3 },
  ];

  const orchestrationRules = [
    { id: '1', name: 'Skill-Based Routing', type: 'Assignment', trigger: 'Task Created', active: true, executions: 1247 },
    { id: '2', name: 'SLA Escalation', type: 'Escalation', trigger: '80% SLA Consumed', active: true, executions: 89 },
    { id: '3', name: 'Workload Balancing', type: 'Routing', trigger: 'Agent Capacity', active: true, executions: 2134 },
    { id: '4', name: 'Exception Handler', type: 'Exception', trigger: 'Process Error', active: true, executions: 45 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'at-risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlaColor = (health: number) => {
    if (health >= 70) return 'text-green-600';
    if (health >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dynamic Process Orchestrator</h1>
          <p className="text-gray-600 mt-1">Real-time process execution and intelligent routing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveView('live')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Live Processes
          </button>
          <button
            onClick={() => setActiveView('rules')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'rules' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveView('performance')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeView === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Performance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Processes</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">47</div>
          <div className="text-xs text-green-600 mt-1">+12 from yesterday</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avg Response Time</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">1.2s</div>
          <div className="text-xs text-green-600 mt-1">-15% faster</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Auto-Adaptations</span>
            <Zap className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">234</div>
          <div className="text-xs text-gray-600 mt-1">Today</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">SLA Compliance</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">94%</div>
          <div className="text-xs text-green-600 mt-1">+3% improvement</div>
        </div>
      </div>

      {activeView === 'live' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Live Process Instances</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time monitoring of active processes</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {liveProcesses.map((process) => (
                <div key={process.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{process.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(process.status)}`}>
                          {process.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Assigned to {process.assignee}</span>
                      </div>
                    </div>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">SLA Health</div>
                      <div className={`text-lg font-semibold ${getSlaColor(process.slaHealth)}`}>
                        {process.slaHealth}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Adaptations</div>
                      <div className="text-lg font-semibold text-gray-900">{process.adaptations}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        Monitor
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${process.slaHealth >= 70 ? 'bg-green-500' : process.slaHealth >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${process.slaHealth}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'rules' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Orchestration Rules</h2>
                <p className="text-sm text-gray-600 mt-1">Automated decision-making rules</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Rule
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {orchestrationRules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-12 rounded ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Type:</span> {rule.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Trigger:</span> {rule.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Executions:</span> {rule.executions}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Edit
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={rule.active} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Routing Efficiency</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Optimal Assignments</span>
                  <span className="font-semibold text-gray-900">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">First-Time Resolution</span>
                  <span className="font-semibold text-gray-900">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Exception Recovery</span>
                  <span className="font-semibold text-gray-900">96%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Response Times</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg Decision Time</span>
                <span className="font-semibold text-gray-900">1.2s</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg Routing Time</span>
                <span className="font-semibold text-gray-900">0.8s</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Avg Adaptation Time</span>
                <span className="font-semibold text-gray-900">2.1s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Intelligent Orchestration Active</h3>
            <p className="text-gray-700">
              Real-time orchestration is managing <span className="font-medium text-blue-700">47 active processes</span> with
              <span className="font-medium text-green-700"> 94% SLA compliance</span>. AI-powered routing has made
              <span className="font-medium text-blue-700"> 234 adaptive decisions</span> today to optimize performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
