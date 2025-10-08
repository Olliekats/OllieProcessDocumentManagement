import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentSort,
  onSort,
}) => {
  const isActive = currentSort?.field === field;
  const direction = currentSort?.direction;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wide font-medium hover:text-slate-700 transition-colors"
    >
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ChevronUp size={14} className="text-blue-600" />
        ) : (
          <ChevronDown size={14} className="text-blue-600" />
        )
      ) : (
        <ChevronsUpDown size={14} className="text-slate-400" />
      )}
    </button>
  );
};
