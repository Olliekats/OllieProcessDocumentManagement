import React, { useState, useEffect } from 'react';
import {
  uploadProcessDocument,
  getProcessDocuments,
  parseDocument,
  convertToBPMN,
  createProcessVersion,
  getProcessVersions,
  requestApproval,
  generateSOPFromProcess,
  generateRACIMatrix,
  generateRiskControls,
  getGeneratedArtifacts,
  getPendingApprovals,
  approveDocument,
  rejectDocument
} from '../utils/documentManagement';
import { Upload, FileText, GitBranch, CheckCircle, XCircle, Sparkles, Shield, Users, AlertTriangle } from 'lucide-react';

export default function EnhancedProcessManagement() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'versions' | 'artifacts' | 'approvals'>('upload');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, approvalsData] = await Promise.all([
        getProcessDocuments(),
        getPendingApprovals()
      ]);
      setDocuments(docsData);
      setApprovals(approvalsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress('Uploading document...');

    try {
      const documentId = await uploadProcessDocument(file);
      setUploadProgress('Parsing document...');

      await parseDocument(documentId);
      setUploadProgress('Converting to BPMN...');

      const bpmnXml = await convertToBPMN(documentId);
      setUploadProgress('Generating artifacts...');

      await generateSOPFromProcess(documentId, file.name, bpmnXml);
      await generateRACIMatrix(documentId, file.name);
      await generateRiskControls(documentId, file.name);

      setUploadProgress('Complete!');
      loadData();

      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert(error.message || 'Failed to upload document');
      setUploadProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadVersions = async (processId: string) => {
    try {
      const versionsData = await getProcessVersions(processId);
      setVersions(versionsData);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const handleLoadArtifacts = async (sourceId: string) => {
    try {
      const artifactsData = await getGeneratedArtifacts(sourceId);
      setArtifacts(artifactsData);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  const handleRequestApproval = async (docType: string, docId: string) => {
    try {
      await requestApproval(docType, docId);
      alert('Approval request submitted');
      loadData();
    } catch (error) {
      console.error('Error requesting approval:', error);
      alert('Failed to request approval');
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      await approveDocument(approvalId);
      alert('Document approved');
      loadData();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve');
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await rejectDocument(approvalId, reason);
      alert('Document rejected');
      loadData();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-blue-600" />
          Enhanced Process Management
        </h2>
        <p className="text-gray-600 mt-1">Upload, parse, and auto-generate process artifacts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Documents</p>
              <p className="text-2xl font-bold mt-1">{documents.length}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Versions</p>
              <p className="text-2xl font-bold mt-1">{versions.length}</p>
            </div>
            <GitBranch className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Artifacts</p>
              <p className="text-2xl font-bold mt-1">{artifacts.length}</p>
            </div>
            <Sparkles className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold mt-1">{approvals.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Upload & Parse
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'versions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Version Control
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'artifacts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Generated Artifacts
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'approvals'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Approvals
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Process Documents
                </h3>
                <p className="text-gray-600 mb-4">
                  PDF, PPTX, DOCX, VSDX (Max 25MB)
                </p>
                <label className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                  Choose File
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.pptx,.docx,.vsdx"
                    disabled={loading}
                    className="hidden"
                  />
                </label>
                {uploadProgress && (
                  <p className="mt-4 text-blue-600 font-medium">{uploadProgress}</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Recent Uploads</h3>
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{doc.document_name}</h4>
                        <p className="text-sm text-gray-600">
                          {doc.document_type} • {doc.file_size_mb.toFixed(2)} MB
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        doc.bpmn_generated
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.bpmn_generated ? 'BPMN Generated' : doc.parsing_status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadArtifacts(doc.id)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        View Artifacts
                      </button>
                      <button
                        onClick={() => handleRequestApproval('process_document', doc.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Request Approval
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Version control tracks all changes to process maps with full audit trail
              </p>
              {versions.map((version) => (
                <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Version {version.version_number}
                      </h4>
                      {version.version_name && (
                        <p className="text-sm text-gray-600">{version.version_name}</p>
                      )}
                      {version.change_summary && (
                        <p className="text-sm text-gray-700 mt-1">{version.change_summary}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        version.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {version.approval_status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {artifacts.map((artifact) => (
                <div key={artifact.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      artifact.artifact_type === 'sop'
                        ? 'bg-blue-100'
                        : artifact.artifact_type === 'raci'
                        ? 'bg-purple-100'
                        : 'bg-orange-100'
                    }`}>
                      {artifact.artifact_type === 'sop' && <FileText className="w-5 h-5 text-blue-600" />}
                      {artifact.artifact_type === 'raci' && <Users className="w-5 h-5 text-purple-600" />}
                      {artifact.artifact_type === 'risk_control' && <Shield className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{artifact.artifact_name}</h4>
                      <p className="text-xs text-gray-600">
                        Confidence: {artifact.confidence_score}%
                      </p>
                    </div>
                  </div>
                  <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {approval.document_type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(approval.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
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
