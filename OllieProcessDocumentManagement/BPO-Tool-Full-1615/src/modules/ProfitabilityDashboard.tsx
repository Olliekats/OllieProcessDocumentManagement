import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

export default function ProfitabilityDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Profitability Intelligence</h2>
        <p className="text-gray-600 mt-1">Cost optimization and profit maximization dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-1">$0K</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
          <p className="text-green-100 text-sm mt-4">30-day period</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Costs</p>
              <p className="text-3xl font-bold mt-1">$0K</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-200" />
          </div>
          <p className="text-red-100 text-sm mt-4">All operations</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Gross Profit</p>
              <p className="text-3xl font-bold mt-1">$0K</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
          <p className="text-blue-100 text-sm mt-4">Net margin</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Profit Margin</p>
              <p className="text-3xl font-bold mt-1">0%</p>
            </div>
            <PieChart className="w-12 h-12 text-purple-200" />
          </div>
          <p className="text-purple-100 text-sm mt-4">Overall performance</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost-Per-Contact Tracking</h3>
        <p className="text-gray-600">
          Real-time profitability intelligence tracks costs and revenue at the contact, agent, campaign, 
          and client level. The system provides live P&L dashboards, campaign performance tracking, 
          client profitability analysis, and AI-driven staffing recommendations.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Database Ready:</strong> All tables (contact_costs, agent_costs, campaign_budgets, 
            client_profitability, staffing_recommendations) are configured for real-time tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
