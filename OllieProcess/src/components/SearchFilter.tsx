import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterConfig[];
  activeFilters: Record<string, any>;
  onFilterChange: (filterName: string, value: any) => void;
  onClearFilters: () => void;
}

export interface FilterConfig {
  name: string;
  label: string;
  type: 'select' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== '' && v !== null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filters.length > 0 && (
          <div className="flex gap-2 items-center">
            <Filter size={20} className="text-slate-400" />
            <span className="text-sm text-slate-600">Filters</span>
          </div>
        )}
      </div>

      {filters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.name}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  value={activeFilters[filter.name] || ''}
                  onChange={(e) => onFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  {filter.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'date' ? (
                <input
                  type="date"
                  value={activeFilters[filter.name] || ''}
                  onChange={(e) => onFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : null}
            </div>
          ))}

          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={onClearFilters}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
