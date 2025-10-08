import React from 'react';
import { Trash2, CheckSquare, Square, CreditCard as Edit2 } from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkStatusChange?: (status: string) => void;
  statusOptions?: { value: string; label: string }[];
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkStatusChange,
  statusOptions,
}) => {
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-800 transition-colors"
        >
          {allSelected ? <CheckSquare size={20} /> : <Square size={20} />}
          <span className="font-medium">
            {selectedCount} selected
          </span>
        </button>

        {!allSelected && totalCount > selectedCount && (
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Select all {totalCount}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onBulkStatusChange && statusOptions && (
          <div className="flex items-center gap-2">
            <Edit2 size={16} className="text-slate-600" />
            <select
              onChange={(e) => onBulkStatusChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue=""
            >
              <option value="" disabled>
                Change status...
              </option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onBulkDelete}
          className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};
