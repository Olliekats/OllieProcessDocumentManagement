import React, { useState, useEffect } from 'react';
import {
  getComplianceRequirements,
  getRisks,
  getAuditLog,
  getComplianceStats,
  updateComplianceStatus,
  updateRiskStatus
} from '../utils/compliance';
import { Shield, AlertTriangle, FileCheck, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function ComplianceDashboard() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requirements' | 'risks' | 'audit'>('requirements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reqsData, risksData, auditData, statsData] = await Promise.all([
        getComplianceRequirements(),
        getRisks(),
        getAuditLog(),
        getComplianceStats()
      ]);

      setRequirements(reqsData);
      setRisks(risksData);
      setAuditLog(auditData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequirement = async (id: string, status: string) => {
    try {
      await updateComplianceStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating requirement:', error);
      alert('Failed to update requirement');
    }
  };

  const handleUpdateRisk = async (id: string, status: string) => {
    try {
      await updateRiskStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating risk:', error);
      alert('Failed to update risk');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 16) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 9) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" />
          Compliance & Governance Dashboard
        </h2>
        <p className="text-gray-600 mt-1">Monitor compliance status and manage risks</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Requirements</p>
                <p className="text-3xl font-bold mt-1">{stats.totalRequirements}</p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Compliant</p>
                <p className="text-3xl font-bold mt-1">{stats.compliantCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">High Risks</p>
                <p className="text-3xl font-bold mt-1">{stats.highRisks}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Audit Events</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAuditEvents}</p>
              </div>
              <Activity className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'requirements'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Compliance Requirements
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'risks'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Risk Register
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'audit'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Log
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              {requirements.map((req) => (
                <div key={req.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{req.requirement_name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{req.regulation}</p>
                      <p className="text-sm text-gray-700">{req.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateRequirement(req.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="compliant">Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                    </select>
                    {req.due_date && (
                      <span className="text-sm text-gray-500">
                        Due: {new Date(req.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-4">
              {risks.map((risk) => (
                <div key={risk.id} className={`border rounded-lg p-4 ${getRiskColor(risk.risk_score)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{risk.risk_title}</h3>
                        <span className="px-2 py-1 text-xs font-bold bg-white rounded">
                          Score: {risk.risk_score}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{risk.risk_description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Probability: <strong>{risk.probability}</strong></span>
                        <span>Impact: <strong>{risk.impact}</strong></span>
                        <span>Category: <strong>{risk.risk_category}</strong></span>
                      </div>
                    </div>
                  </div>
                  <select
                    value={risk.status}
                    onChange={(e) => handleUpdateRisk(risk.id, e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="identified">Identified</option>
                    <option value="mitigating">Mitigating</option>
                    <option value="monitored">Monitored</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-2">
              {auditLog.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-sm text-gray-500">{log.entity_type}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {log.actor_email && <span>By: {log.actor_email} • </span>}
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
