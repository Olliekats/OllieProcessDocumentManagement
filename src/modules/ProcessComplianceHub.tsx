import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, FileText, TrendingUp, Lock, AlertCircle } from 'lucide-react';

export const ProcessComplianceHub: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('all');

  const frameworks = [
    { id: 'sox', name: 'SOX', status: 'compliant', score: 98, requirements: 45, met: 44 },
    { id: 'gdpr', name: 'GDPR', status: 'compliant', score: 96, requirements: 38, met: 37 },
    { id: 'hipaa', name: 'HIPAA', status: 'at-risk', score: 82, requirements: 52, met: 43 },
    { id: 'iso9001', name: 'ISO 9001', status: 'compliant', score: 94, requirements: 28, met: 27 },
    { id: 'pci', name: 'PCI DSS', status: 'non-compliant', score: 68, requirements: 35, met: 24 },
  ];

  const controls = [
    { id: '1', name: 'Access Control', type: 'Preventive', effectiveness: 'Effective', lastTested: '2025-10-01', nextTest: '2025-11-01' },
    { id: '2', name: 'Data Encryption', type: 'Preventive', effectiveness: 'Effective', lastTested: '2025-09-28', nextTest: '2025-10-28' },
    { id: '3', name: 'Audit Logging', type: 'Detective', effectiveness: 'Needs Improvement', lastTested: '2025-09-25', nextTest: '2025-10-25' },
    { id: '4', name: 'Segregation of Duties', type: 'Directive', effectiveness: 'Effective', lastTested: '2025-10-03', nextTest: '2025-11-03' },
  ];

  const risks = [
    { id: '1', name: 'Unauthorized Data Access', level: 'High', likelihood: 'Possible', impact: 'Major', mitigation: 'Enhanced MFA' },
    { id: '2', name: 'Data Breach', level: 'Critical', likelihood: 'Unlikely', impact: 'Catastrophic', mitigation: 'Encryption at rest' },
    { id: '3', name: 'Process Deviation', level: 'Medium', likelihood: 'Likely', impact: 'Moderate', mitigation: 'Automated checks' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Compliance Hub</h1>
          <p className="text-gray-600 mt-1">Manage compliance across multiple regulatory frameworks</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Frameworks</option>
            {frameworks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall Compliance</span>
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">88%</div>
          <div className="text-xs text-green-600 mt-1">+3% vs last quarter</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Controls</span>
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">127</div>
          <div className="text-xs text-gray-600 mt-1">98% effective</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Open Issues</span>
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
          <div className="text-xs text-orange-600 mt-1">2 critical</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Audits This Month</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">3</div>
          <div className="text-xs text-green-600 mt-1">All passed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Frameworks</h2>
            <p className="text-sm text-gray-600 mt-1">Regulatory framework compliance status</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {frameworks.map((framework) => (
                <div key={framework.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{framework.name}</h3>
                        <p className="text-sm text-gray-500">{framework.met}/{framework.requirements} requirements met</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(framework.status)}`}>
                      {framework.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Compliance Score</span>
                      <span className="font-semibold text-gray-900">{framework.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${framework.score >= 90 ? 'bg-green-500' : framework.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${framework.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">Identified compliance risks</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {risks.map((risk) => (
                <div key={risk.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-1 h-16 rounded ${getRiskColor(risk.level)}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{risk.name}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <span className="text-gray-500">Likelihood:</span>
                          <span className="ml-1 font-medium">{risk.likelihood}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Impact:</span>
                          <span className="ml-1 font-medium">{risk.impact}</span>
                        </div>
                      </div>
                    </div>
                    <AlertTriangle className={`w-5 h-5 ${risk.level === 'Critical' ? 'text-red-500' : risk.level === 'High' ? 'text-orange-500' : 'text-yellow-500'}`} />
                  </div>
                  <div className="mt-3 p-2 bg-blue-50 rounded">
                    <div className="text-sm text-blue-900">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Control Effectiveness</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor and test process controls</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Tested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Test</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {controls.map((control) => (
                <tr key={control.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{control.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{control.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${control.effectiveness === 'Effective' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {control.effectiveness}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{control.lastTested}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{control.nextTest}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-blue-600 hover:text-blue-800">Test Now</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Compliance Monitoring Active</h3>
            <p className="text-gray-700">
              Automated compliance checks are running 24/7 across all frameworks.
              <span className="font-medium text-green-700"> 98% of controls</span> are operating effectively with
              <span className="font-medium text-green-700"> 88% overall compliance</span> across all regulatory requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
