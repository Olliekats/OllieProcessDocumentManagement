import React from 'react';
import { AlertTriangle, TrendingUp, DollarSign, Users } from 'lucide-react';

export default function AttritionPrediction() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attrition Prediction & Prevention</h2>
        <p className="text-gray-600 mt-1">AI-powered agent retention intelligence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Critical Risk</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200" />
          </div>
          <p className="text-red-100 text-sm mt-4">Immediate action required</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">High Risk</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200" />
          </div>
          <p className="text-orange-100 text-sm mt-4">Monitor closely</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Interventions</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm mt-4">In progress</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Savings</p>
              <p className="text-3xl font-bold mt-1">$0K</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
          <p className="text-green-100 text-sm mt-4">Attrition prevented</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Attrition Prediction System</h3>
        <p className="text-gray-600">
          The Attrition Prediction Engine uses AI to analyze 8+ risk factors including attendance, 
          performance, engagement, and tenure to predict which agents are likely to leave 30-90 days 
          in advance. The system automatically suggests retention interventions and tracks ROI.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Database Ready:</strong> All tables (agent_risk_factors, attrition_predictions, 
            retention_interventions, attrition_cost_savings) are configured and waiting for data.
          </p>
        </div>
      </div>
    </div>
  );
}
