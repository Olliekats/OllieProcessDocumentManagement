import React, { useState } from 'react';
import { Play, Settings, TrendingUp, Clock, DollarSign, Users, BarChart3, Sparkles } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  type: string;
  improvement: number;
  confidence: number;
  cost: number;
}

export const ProcessSimulationEngine: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const scenarios: Scenario[] = [
    { id: '1', name: 'Add 2 Agents', type: 'Resource Increase', improvement: 25, confidence: 92, cost: 8500 },
    { id: '2', name: 'Automate Document Review', type: 'Automation', improvement: 40, confidence: 88, cost: 15000 },
    { id: '3', name: 'Parallel Approval Flow', type: 'Process Change', improvement: 35, confidence: 90, cost: 2000 },
    { id: '4', name: 'Extended Business Hours', type: 'Schedule Change', improvement: 18, confidence: 95, cost: 12000 },
  ];

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Simulation Engine</h1>
          <p className="text-gray-600 mt-1">Test process changes before implementation</p>
        </div>
        <button onClick={runSimulation} disabled={isRunning || !selectedScenario} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400">
          <Play className="w-4 h-4" />
          {isRunning ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Baseline Cycle Time', value: '3.2h', icon: Clock, color: 'blue' },
          { label: 'Current Cost/Contact', value: '$45', icon: DollarSign, color: 'green' },
          { label: 'Resource Utilization', value: '78%', icon: Users, color: 'purple' },
          { label: 'Quality Score', value: '92%', icon: BarChart3, color: 'indigo' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">What-If Scenarios</h2>
          <p className="text-sm text-gray-600 mt-1">Test different optimization strategies</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedScenario === scenario.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{scenario.type}</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <div className="text-xs text-gray-500">Improvement</div>
                    <div className="font-semibold text-green-600">+{scenario.improvement}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Confidence</div>
                    <div className="font-semibold text-gray-900">{scenario.confidence}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Cost</div>
                    <div className="font-semibold text-gray-900">${(scenario.cost / 1000).toFixed(1)}K</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedScenario && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Scenario Selected</h3>
              <p className="text-gray-700">
                Ready to simulate <span className="font-medium">{scenarios.find(s => s.id === selectedScenario)?.name}</span>.
                This will run 1000 Monte Carlo iterations to predict outcomes with 95% confidence intervals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
