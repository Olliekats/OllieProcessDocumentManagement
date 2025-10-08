import React, { useState } from 'react';
import { Brain, TrendingUp, Users, AlertTriangle, Calendar, Award, Target } from 'lucide-react';

export const PredictiveWorkforceIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'health' | 'skills' | 'attrition'>('forecast');

  const forecasts = [
    { day: 'Mon', predicted: 450, actual: 445, confidence: 96 },
    { day: 'Tue', predicted: 520, actual: 510, confidence: 95 },
    { day: 'Wed', predicted: 480, actual: null, confidence: 94 },
    { day: 'Thu', predicted: 510, actual: null, confidence: 93 },
    { day: 'Fri', predicted: 540, actual: null, confidence: 95 },
  ];

  const agentHealth = [
    { id: '1', name: 'Sarah Chen', score: 92, trend: 'stable', burnoutRisk: 'low', workload: 'optimal' },
    { id: '2', name: 'Mike Johnson', score: 68, trend: 'declining', burnoutRisk: 'high', workload: 'excessive' },
    { id: '3', name: 'Anna Rodriguez', score: 88, trend: 'improving', burnoutRisk: 'low', workload: 'optimal' },
    { id: '4', name: 'James Lee', score: 75, trend: 'stable', burnoutRisk: 'medium', workload: 'high' },
  ];

  const skillsGaps = [
    { skill: 'Advanced CRM', currentLevel: 65, targetLevel: 85, priority: 'high', agents: 12 },
    { skill: 'Complaint Handling', currentLevel: 78, targetLevel: 90, priority: 'medium', agents: 8 },
    { skill: 'Technical Support', currentLevel: 72, targetLevel: 95, priority: 'high', agents: 15 },
    { skill: 'Sales Techniques', currentLevel: 82, targetLevel: 88, priority: 'low', agents: 6 },
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predictive Workforce Intelligence</h1>
          <p className="text-gray-600 mt-1">ML-powered forecasting and agent optimization</p>
        </div>
        <div className="flex gap-2">
          {['forecast', 'health', 'skills', 'attrition'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Forecast Accuracy</span>
            <Brain className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">95%</div>
          <div className="text-xs text-green-600 mt-1">Last 30 days</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Agents At Risk</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-xs text-orange-600 mt-1">High burnout risk</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Skills Gaps</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <div className="text-xs text-gray-600 mt-1">Identified areas</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Attrition Risk</span>
            <Users className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">8%</div>
          <div className="text-xs text-green-600 mt-1">-3% vs industry</div>
        </div>
      </div>

      {activeTab === 'forecast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">7-Day Volume Forecast</h2>
              <p className="text-sm text-gray-600 mt-1">ML-powered demand predictions</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {forecasts.map((forecast, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-16 font-medium text-gray-700">{forecast.day}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-gray-600">Predicted: {forecast.predicted}</span>
                        {forecast.actual && <span className="text-green-600">Actual: {forecast.actual}</span>}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(forecast.predicted / 600) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600">{forecast.confidence}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Optimal Schedule</h2>
              <p className="text-sm text-gray-600 mt-1">AI-generated staffing recommendations</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Monday</span>
                  <span className="text-sm font-semibold text-blue-600">18 agents</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Tuesday</span>
                  <span className="text-sm font-semibold text-blue-600">21 agents</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Wednesday</span>
                  <span className="text-sm font-semibold text-blue-600">19 agents</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Thursday</span>
                  <span className="text-sm font-semibold text-blue-600">20 agents</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Friday</span>
                  <span className="text-sm font-semibold text-blue-600">22 agents</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-900">
                  <span className="font-medium">Cost Savings:</span> $4,200/week vs manual scheduling
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agent Health Scores</h2>
            <p className="text-sm text-gray-600 mt-1">Burnout prediction and prevention</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {agentHealth.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{agent.name}</h3>
                        <span className={`text-sm ${getTrendColor(agent.trend)}`}>{agent.trend}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{agent.score}</div>
                      <div className="text-xs text-gray-500">Health Score</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm text-gray-500">Burnout Risk:</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getRiskColor(agent.burnoutRisk)}`}>
                        {agent.burnoutRisk}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Workload:</span>
                      <span className="ml-2 text-sm font-medium text-gray-900">{agent.workload}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${agent.score >= 85 ? 'bg-green-500' : agent.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Skills Gap Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Training needs and development opportunities</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {skillsGaps.map((gap, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{gap.skill}</h3>
                      <p className="text-sm text-gray-500 mt-1">{gap.agents} agents need training</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      gap.priority === 'high' ? 'bg-red-100 text-red-800' :
                      gap.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {gap.priority} priority
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Level</span>
                      <span className="font-medium">{gap.currentLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${gap.currentLevel}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target Level</span>
                      <span className="font-medium">{gap.targetLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${gap.targetLevel}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attrition' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Attrition Risk Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Predictive retention insights</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">High Risk</div>
                <div className="text-2xl font-bold text-red-600">2 agents</div>
                <div className="text-xs text-gray-500 mt-1">0-3 months</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Medium Risk</div>
                <div className="text-2xl font-bold text-yellow-600">5 agents</div>
                <div className="text-xs text-gray-500 mt-1">3-6 months</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Low Risk</div>
                <div className="text-2xl font-bold text-green-600">38 agents</div>
                <div className="text-xs text-gray-500 mt-1">6+ months</div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Retention Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Schedule career development conversations with high-risk agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Offer skill development training to medium-risk group</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Review compensation packages for at-risk team members</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Workforce Optimization</h3>
            <p className="text-gray-700">
              Machine learning models are continuously analyzing workforce data with
              <span className="font-medium text-purple-700"> 95% forecasting accuracy</span>. Currently monitoring
              <span className="font-medium text-purple-700"> 45 agents</span> with
              <span className="font-medium text-green-700"> 3 high-priority interventions</span> recommended to prevent attrition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
