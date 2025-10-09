import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ApprovalCardProps {
  approval: {
    id: string;
    entity_type: string;
    entity_id: string;
    approval_type: string;
    status: string;
    requested_by: string;
    requested_at: string;
    comments?: string;
    priority: string;
  };
  onUpdate: () => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, onUpdate }) => {
  const { user } = useAuth();
  const [reviewing, setReviewing] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState('');

  const handleApprove = async () => {
    setReviewing(true);
    try {
      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          comments: comment || null,
        })
        .eq('id', approval.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setReviewing(false);
      setShowCommentForm(false);
      setComment('');
    }
  };

  const handleReject = async () => {
    if (!comment) {
      alert('Please provide a reason for rejection');
      return;
    }
    setReviewing(true);
    try {
      const { error } = await supabase
        .from('approvals')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          comments: comment,
        })
        .eq('id', approval.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setReviewing(false);
      setShowCommentForm(false);
      setComment('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = () => {
    switch (approval.status) {
      case 'approved':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={20} />;
      default:
        return <AlertCircle className="text-slate-600" size={20} />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-slate-800 capitalize">
              {approval.approval_type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-slate-600">
              {approval.entity_type} - {approval.entity_id.slice(0, 8)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(approval.priority)}`}>
          {approval.priority}
        </span>
      </div>

      <div className="text-sm text-slate-600">
        <p>Requested: {new Date(approval.requested_at).toLocaleString()}</p>
        {approval.comments && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Comments:</p>
            <p>{approval.comments}</p>
          </div>
        )}
      </div>

      {approval.status === 'pending' && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          {showCommentForm ? (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add comments (optional for approval, required for rejection)..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={reviewing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={reviewing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setShowCommentForm(false);
                    setComment('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCommentForm(true)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              Review Request
            </button>
          )}
        </div>
      )}
    </div>
  );
};
