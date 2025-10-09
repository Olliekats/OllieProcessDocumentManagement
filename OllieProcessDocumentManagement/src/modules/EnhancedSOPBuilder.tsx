import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Plus,
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Save,
  Clock,
  User,
  AlertCircle,
  FileDown,
  FilePlus,
} from 'lucide-react';
import { exportToDOCX, exportToPDF, ExportOptions } from '../utils/documentExport';
import { FileUpload } from '../components/FileUpload';
import { createSOPVersion, requestApproval } from '../utils/documentManagement';

interface SOP {
  id: string;
  title: string;
  content: string;
  version: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  source_artifact_id?: string;
}

interface SOPVersion {
  id: string;
  sop_id: string;
  version_number: string;
  content: string;
  change_description: string;
  created_by: string;
  created_at: string;
}

export default function EnhancedSOPBuilder() {
  const { user } = useAuth();
  const [sops, setSOPs] = useState<SOP[]>([]);
  const [versions, setVersions] = useState<SOPVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: '1.0',
    changeDescription: '',
  });

  useEffect(() => {
    loadSOPs();
  }, []);

  useEffect(() => {
    if (selectedSOP) {
      loadVersions(selectedSOP.id);
    }
  }, [selectedSOP]);

  const loadSOPs = async () => {
    try {
      const { data, error } = await supabase
        .from('sops')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSOPs(data || []);
    } catch (error) {
      console.error('Error loading SOPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (sopId: string) => {
    try {
      const { data, error } = await supabase
        .from('sop_versions')
        .select('*')
        .eq('sop_id', sopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleCreateSOP = async () => {
    if (!formData.title || !formData.content || !user) return;

    try {
      const { data: newSOP, error } = await supabase
        .from('sops')
        .insert({
          title: formData.title,
          content: formData.content,
          version: formData.version,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await createSOPVersion(newSOP.id, formData.content, formData.changeDescription || 'Initial version');

      setFormData({ title: '', content: '', version: '1.0', changeDescription: '' });
      setShowCreate(false);
      loadSOPs();
    } catch (error) {
      console.error('Error creating SOP:', error);
      alert('Failed to create SOP');
    }
  };

  const handleUpdateSOP = async () => {
    if (!selectedSOP || !user) return;

    try {
      const versionParts = selectedSOP.version.split('.');
      const newVersion = `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`;

      const { error: updateError } = await supabase
        .from('sops')
        .update({
          content: formData.content,
          version: newVersion,
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSOP.id);

      if (updateError) throw updateError;

      await createSOPVersion(
        selectedSOP.id,
        formData.content,
        formData.changeDescription || 'Updated content'
      );

      setEditMode(false);
      setSelectedSOP(null);
      loadSOPs();
    } catch (error) {
      console.error('Error updating SOP:', error);
      alert('Failed to update SOP');
    }
  };

  const handleRequestApproval = async (sopId: string) => {
    if (!user) return;

    try {
      await requestApproval('sop', sopId, user.id, 'sop_approval');
      alert('Approval request submitted successfully');
      loadSOPs();
    } catch (error) {
      console.error('Error requesting approval:', error);
      alert('Failed to request approval');
    }
  };

  const handlePublish = async (sopId: string) => {
    try {
      const { error } = await supabase
        .from('sops')
        .update({
          status: 'published',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', sopId);

      if (error) throw error;
      loadSOPs();
    } catch (error) {
      console.error('Error publishing SOP:', error);
      alert('Failed to publish SOP');
    }
  };

  const handleDelete = async (sopId: string) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;

    try {
      const { error } = await supabase.from('sops').delete().eq('id', sopId);

      if (error) throw error;
      loadSOPs();
    } catch (error) {
      console.error('Error deleting SOP:', error);
      alert('Failed to delete SOP');
    }
  };

  const handleExportPDF = async (sop: SOP) => {
    try {
      const options: ExportOptions = {
        title: sop.title,
        subtitle: `Version ${sop.version}`,
        author: 'OllieProcess',
        date: new Date(),
      };

      const blob = await exportToPDF(sop, 'sop', options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.version}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleExportDOCX = async (sop: SOP) => {
    try {
      const options: ExportOptions = {
        title: sop.title,
        subtitle: `Version ${sop.version}`,
        author: 'OllieProcess',
        date: new Date(),
      };

      const blob = await exportToDOCX(sop, 'sop', options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.version}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Failed to export DOCX');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setFormData({
        ...formData,
        title: file.name.replace(/\.(docx|pdf|txt)$/i, ''),
        content: text,
      });
      setShowUpload(false);
      setShowCreate(true);
    };

    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      alert('Please upload a text file. DOCX and PDF parsing will be available soon.');
    }
  };

  const handleEdit = (sop: SOP) => {
    setSelectedSOP(sop);
    setFormData({
      title: sop.title,
      content: sop.content,
      version: sop.version,
      changeDescription: '',
    });
    setEditMode(true);
  };

  const handleView = (sop: SOP) => {
    setSelectedSOP(sop);
    setEditMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedSOP && !editMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedSOP(null);
              setShowVersions(false);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to SOPs
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Version History
            </button>
            <button
              onClick={() => handleEdit(selectedSOP)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleExportDOCX(selectedSOP)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export DOCX
            </button>
            <button
              onClick={() => handleExportPDF(selectedSOP)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSOP.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  Version {selectedSOP.version}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSOP.status)}`}>
                  {selectedSOP.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedSOP.content}
            </div>
          </div>

          {selectedSOP.status === 'draft' && (
            <div className="mt-8 pt-6 border-t flex gap-3">
              <button
                onClick={() => handleRequestApproval(selectedSOP.id)}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Request Approval
              </button>
              <button
                onClick={() => handlePublish(selectedSOP.id)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Publish Now
              </button>
            </div>
          )}
        </div>

        {showVersions && versions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Version History</h2>
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Version {version.version_number}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {version.change_description && (
                    <p className="text-sm text-gray-600">{version.change_description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showCreate || editMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editMode ? 'Edit SOP' : 'Create New SOP'}
          </h2>
          <button
            onClick={() => {
              setShowCreate(false);
              setEditMode(false);
              setSelectedSOP(null);
              setFormData({ title: '', content: '', version: '1.0', changeDescription: '' });
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SOP Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SOP title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Enter SOP content..."
            />
          </div>

          {editMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Description
              </label>
              <input
                type="text"
                value={formData.changeDescription}
                onChange={(e) => setFormData({ ...formData, changeDescription: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what changed in this version..."
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreate(false);
                setEditMode(false);
                setSelectedSOP(null);
                setFormData({ title: '', content: '', version: '1.0', changeDescription: '' });
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={editMode ? handleUpdateSOP : handleCreateSOP}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editMode ? 'Save Changes' : 'Create SOP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            SOP Builder
          </h2>
          <p className="text-gray-600 mt-1">Create and manage Standard Operating Procedures</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New SOP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sops.map((sop) => (
          <div
            key={sop.id}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{sop.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">v{sop.version}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sop.status)}`}>
                    {sop.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {sop.content.substring(0, 150)}...
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleView(sop)}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => handleEdit(sop)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleExportPDF(sop)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                title="Export PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(sop.id)}
                className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sops.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No SOPs found</p>
          <p className="text-gray-400 text-sm">Create your first Standard Operating Procedure</p>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <FileUpload
              onUpload={handleFileUpload}
              accept=".txt,.docx,.pdf"
              maxSize={10 * 1024 * 1024}
            />
            <p className="text-sm text-gray-500 mt-4">
              Supported formats: TXT, DOCX, PDF (up to 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
