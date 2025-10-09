import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Database,
  Filter,
  BarChart3,
  Download,
  Save,
  Play,
  Trash2,
  Share2,
  Clock,
  Settings,
} from 'lucide-react';

interface ReportField {
  id: string;
  table_name: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_groupable: boolean;
  is_filterable: boolean;
  aggregation_functions: string[];
  category: string;
}

export const CustomReportBuilder: React.FC = () => {
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableTables();
    loadSavedReports();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadFieldsForTable(selectedTable);
    }
  }, [selectedTable]);

  const loadAvailableTables = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_tables');
      if (error) throw error;
      if (data) setAvailableTables(data);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadFieldsForTable = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from('report_fields')
        .select('*')
        .eq('table_name', tableName)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) setAvailableFields(data);
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  const loadSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) setSavedReports(data);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const toggleField = (fieldName: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    );
  };

  const handleSaveReport = async () => {
    if (!reportName || !selectedTable || selectedFields.length === 0) {
      alert('Please provide report name, select a table, and choose at least one field');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('save_report_configuration', {
        p_report_name: reportName,
        p_description: reportDescription,
        p_source_table: selectedTable,
        p_selected_fields: JSON.stringify(selectedFields),
      });

      if (error) throw error;

      alert('Report saved successfully!');
      setShowSaveDialog(false);
      setReportName('');
      setReportDescription('');
      await loadSavedReports();
    } catch (error: any) {
      console.error('Error saving report:', error);
      alert('Failed to save report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReport = () => {
    if (!selectedTable || selectedFields.length === 0) {
      alert('Please select a table and at least one field');
      return;
    }

    alert('Report execution would query the database and display results here');
  };

  const handleLoadReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedTable(data.source_table);
        setSelectedFields(data.selected_fields);
        setReportName(data.report_name);
        setReportDescription(data.description || '');
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const { error } = await supabase.from('custom_reports').delete().eq('id', reportId);

      if (error) throw error;
      await loadSavedReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    const category = field.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Report Builder</h1>
          <p className="text-gray-600 mt-1">Create custom reports without writing SQL</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedFields.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Save size={20} />
            Save Report
          </button>
          <button
            onClick={handleRunReport}
            disabled={selectedFields.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            <Play size={20} />
            Run Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database size={20} />
              Select Data Source
            </h2>

            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setSelectedFields([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a table...</option>
              {availableTables.map((table) => (
                <option key={table.table_name} value={table.table_name}>
                  {table.table_name} ({table.field_count} fields)
                </option>
              ))}
            </select>
          </div>

          {selectedTable && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={20} />
                Select Fields
              </h2>

              <div className="space-y-4">
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((field) => (
                        <label
                          key={field.id}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedFields.includes(field.field_name)
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.field_name)}
                            onChange={() => toggleField(field.field_name)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{field.field_label}</div>
                            <div className="text-xs text-gray-500">{field.field_type}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFields.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    Selected: {selectedFields.length} fields
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFields.map((fieldName) => {
                      const field = availableFields.find((f) => f.field_name === fieldName);
                      return (
                        <span
                          key={fieldName}
                          className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-blue-200"
                        >
                          {field?.field_label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Reports</h2>
          {savedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto mb-2 text-gray-400" size={48} />
              <p>No saved reports yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{report.report_name}</h3>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Database size={12} />
                        {report.source_table}
                        <span>•</span>
                        {Array.isArray(report.selected_fields)
                          ? report.selected_fields.length
                          : 0}{' '}
                        fields
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleLoadReport(report.id)}
                      className="flex-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="My Custom Report"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={loading || !reportName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
