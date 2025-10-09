import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, X, Save } from 'lucide-react';
import { createSOPVersion } from '../utils/documentManagement';

interface CreateSOPButtonProps {
  artifactData: any;
  artifactId: string;
  artifactType: 'sop' | 'raci' | 'risk' | 'process';
  processTitle?: string;
}

export function CreateSOPButton({
  artifactData,
  artifactId,
  artifactType,
  processTitle,
}: CreateSOPButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `${processTitle || 'Process'} - ${artifactType.toUpperCase()}`,
    content: '',
    version: '1.0',
  });

  const formatContent = () => {
    let content = '';

    if (typeof artifactData === 'string') {
      content = artifactData;
    } else if (artifactData.content) {
      content = artifactData.content;
    } else if (artifactData.sections && Array.isArray(artifactData.sections)) {
      content = artifactData.sections
        .map((section: any) => {
          return `${section.section || section.title}\n\n${section.content || section.description || ''}\n\n`;
        })
        .join('\n');
    } else {
      content = JSON.stringify(artifactData, null, 2);
    }

    setFormData({
      ...formData,
      content: content,
    });
  };

  const handleOpen = () => {
    formatContent();
    setShowModal(true);
  };

  const handleCreateSOP = async () => {
    if (!user || !formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: newSOP, error: sopError } = await supabase
        .from('sops')
        .insert({
          title: formData.title,
          content: formData.content,
          version: formData.version,
          status: 'draft',
          created_by: user.id,
          source_artifact_id: artifactId,
        })
        .select()
        .single();

      if (sopError) throw sopError;

      await createSOPVersion(
        newSOP.id,
        formData.content,
        `Created from ${artifactType} artifact`
      );

      alert('SOP created successfully! It is now in draft status.');
      setShowModal(false);
      setFormData({
        title: `${processTitle || 'Process'} - ${artifactType.toUpperCase()}`,
        content: '',
        version: '1.0',
      });
    } catch (error) {
      console.error('Error creating SOP:', error);
      alert('Failed to create SOP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        title="Create SOP from this artifact"
      >
        <FileText className="w-4 h-4" />
        Create SOP
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Create SOP from Artifact</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SOP Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter SOP title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="SOP content will be auto-populated from the artifact..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This SOP will be created as a draft. You can edit it further,
                    request approval, and then publish it from the SOP Builder module.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSOP}
                disabled={loading || !formData.title || !formData.content}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create SOP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
