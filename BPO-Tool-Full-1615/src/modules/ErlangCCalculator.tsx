import React, { useState } from 'react';
import { Calculator, TrendingUp, Users, Clock, Target, AlertCircle } from 'lucide-react';
import { calculateErlangC, generateStaffingScenarios, calculateShrinkage, adjustForShrinkage } from '../utils/erlangC';

export default function ErlangCCalculator() {
  const [inputs, setInputs] = useState({
    callsPerInterval: 100,
    averageHandleTime: 5,
    intervalMinutes: 30,
    targetServiceLevel: 80,
    targetAnswerTime: 20,
  });

  const [shrinkageFactors, setShrinkageFactors] = useState({
    breaks: 30,
    lunch: 30,
    training: 60,
    meetings: 30,
    other: 0,
  });

  const [showShrinkage, setShowShrinkage] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);

  const result = calculateErlangC(inputs);
  const scenarios = generateStaffingScenarios(inputs);
  const shrinkagePercent = calculateShrinkage(shrinkageFactors);
  const adjustedAgents = adjustForShrinkage(result.requiredAgents, shrinkagePercent);

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleShrinkageChange = (field: string, value: string) => {
    setShrinkageFactors(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Erlang C Calculator</h2>
          <p className="text-gray-600 mt-1">Calculate optimal staffing for contact center operations</p>
        </div>
        <Calculator className="w-8 h-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calls per Interval
                </label>
                <input
                  type="number"
                  value={inputs.callsPerInterval}
                  onChange={(e) => handleInputChange('callsPerInterval', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Handle Time (minutes)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.averageHandleTime}
                  onChange={(e) => handleInputChange('averageHandleTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval Length (minutes)
                </label>
                <input
                  type="number"
                  value={inputs.intervalMinutes}
                  onChange={(e) => handleInputChange('intervalMinutes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Service Level (%)
                </label>
                <input
                  type="number"
                  value={inputs.targetServiceLevel}
                  onChange={(e) => handleInputChange('targetServiceLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Answer Time (seconds)
                </label>
                <input
                  type="number"
                  value={inputs.targetAnswerTime}
                  onChange={(e) => handleInputChange('targetAnswerTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shrinkage Calculator</h3>
              <button
                onClick={() => setShowShrinkage(!showShrinkage)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showShrinkage ? 'Hide' : 'Show'}
              </button>
            </div>

            {showShrinkage && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breaks (minutes/day)
                  </label>
                  <input
                    type="number"
                    value={shrinkageFactors.breaks}
                    onChange={(e) => handleShrinkageChange('breaks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lunch (minutes/day)
                  </label>
                  <input
                    type="number"
                    value={shrinkageFactors.lunch}
                    onChange={(e) => handleShrinkageChange('lunch', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Training (minutes/day)
                  </label>
                  <input
                    type="number"
                    value={shrinkageFactors.training}
                    onChange={(e) => handleShrinkageChange('training', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meetings (minutes/day)
                  </label>
                  <input
                    type="number"
                    value={shrinkageFactors.meetings}
                    onChange={(e) => handleShrinkageChange('meetings', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other (minutes/day)
                  </label>
                  <input
                    type="number"
                    value={shrinkageFactors.other}
                    onChange={(e) => handleShrinkageChange('other', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Shrinkage:</span>
                    <span className="text-lg font-bold text-blue-600">{shrinkagePercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{result.requiredAgents}</div>
              <div className="text-sm opacity-90">Required Agents</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{result.serviceLevel.toFixed(1)}%</div>
              <div className="text-sm opacity-90">Service Level</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{result.averageSpeedOfAnswer.toFixed(0)}s</div>
              <div className="text-sm opacity-90">Avg Speed of Answer</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{result.occupancy.toFixed(1)}%</div>
              <div className="text-sm opacity-90">Occupancy</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{result.probabilityOfWaiting.toFixed(1)}%</div>
              <div className="text-sm opacity-90">Probability of Wait</div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{adjustedAgents}</div>
              <div className="text-sm opacity-90">With Shrinkage</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Traffic Intensity (Erlangs)</div>
                <div className="text-2xl font-bold text-gray-900">{result.trafficIntensity.toFixed(2)}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Average Wait Time</div>
                <div className="text-2xl font-bold text-gray-900">{result.averageWaitTime.toFixed(1)}s</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Shrinkage Impact</div>
                <div className="text-2xl font-bold text-gray-900">+{adjustedAgents - result.requiredAgents} agents</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Shrinkage</div>
                <div className="text-2xl font-bold text-gray-900">{shrinkagePercent.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staffing Scenarios</h3>
              <button
                onClick={() => setShowScenarios(!showScenarios)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showScenarios ? 'Hide Scenarios' : 'Show Scenarios'}
              </button>
            </div>

            {showScenarios && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Agents</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ASA (sec)</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Occupancy</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">P(Wait)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.slice(0, 15).map((scenario, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-100 ${
                          scenario.agents === result.requiredAgents ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-sm">
                          {scenario.agents === result.requiredAgents && (
                            <span className="font-semibold text-blue-600">{scenario.agents} ⭐</span>
                          )}
                          {scenario.agents !== result.requiredAgents && scenario.agents}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={
                              scenario.serviceLevel >= inputs.targetServiceLevel
                                ? 'text-green-600 font-medium'
                                : 'text-red-600'
                            }
                          >
                            {scenario.serviceLevel.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{scenario.asa.toFixed(1)}</td>
                        <td className="py-3 px-4 text-sm">{scenario.occupancy.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-sm">{scenario.probabilityOfWaiting.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
