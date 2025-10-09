import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, CreditCard as Edit2, Trash2, Save, X, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SearchFilter, FilterConfig } from '../components/SearchFilter';
import { BulkActions } from '../components/BulkActions';
import { ExportButton } from '../components/ExportButton';
import { SortableHeader } from '../components/SortableHeader';
import { notifyUser } from './notifications';
import { CollaborationPresence } from '../components/CollaborationPresence';
import { CollaborationComments } from '../components/CollaborationComments';

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'email';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  searchable?: boolean;
}

export interface ModuleConfig {
  title: string;
  description: string;
  tableName: string;
  fields: Field[];
  displayFields: string[];
  statusField?: string;
  ownerField?: string;
  filters?: FilterConfig[];
}

export const createEnhancedModule = (config: ModuleConfig) => {
  return () => {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
    const [formData, setFormData] = useState<any>(() => {
      const initial: any = {};
      config.fields.forEach((field) => {
        initial[field.name] = field.defaultValue || '';
      });
      return initial;
    });

    useEffect(() => {
      loadData();
    }, []);

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from(config.tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const filteredAndSortedItems = useMemo(() => {
      let result = [...items];

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(item =>
          config.fields
            .filter(f => f.searchable !== false)
            .some(field => {
              const value = item[field.name];
              return value && String(value).toLowerCase().includes(searchLower);
            })
        );
      }

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
          result = result.filter(item => item[key] === value);
        }
      });

      if (sortConfig) {
        result.sort((a, b) => {
          const aVal = a[sortConfig.field];
          const bVal = b[sortConfig.field];
          if (aVal === bVal) return 0;
          const comparison = aVal < bVal ? -1 : 1;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
      }

      return result;
    }, [items, searchTerm, activeFilters, sortConfig]);

    const handleSort = (field: string) => {
      setSortConfig(current => {
        if (current?.field === field) {
          return current.direction === 'asc'
            ? { field, direction: 'desc' }
            : null;
        }
        return { field, direction: 'asc' };
      });
    };

    const handleFilterChange = (filterName: string, value: any) => {
      setActiveFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
      setActiveFilters({});
      setSearchTerm('');
    };

    const toggleSelectItem = (id: string) => {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };

    const selectAll = () => {
      setSelectedIds(filteredAndSortedItems.map(item => item.id));
    };

    const deselectAll = () => {
      setSelectedIds([]);
    };

    const handleBulkDelete = async () => {
      if (!confirm(`Delete ${selectedIds.length} items?`)) return;
      try {
        await supabase
          .from(config.tableName)
          .delete()
          .in('id', selectedIds);

        if (user?.id) {
          await notifyUser.info(
            user.id,
            `Bulk Delete Completed`,
            `Successfully deleted ${selectedIds.length} ${config.title.toLowerCase()} item(s)`
          );
        }

        setSelectedIds([]);
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);

        if (user?.id) {
          await notifyUser.error(
            user.id,
            `Bulk Delete Failed`,
            `Failed to delete items`
          );
        }
      }
    };

    const handleBulkStatusChange = async (status: string) => {
      if (!config.statusField) return;
      try {
        await supabase
          .from(config.tableName)
          .update({ [config.statusField]: status })
          .in('id', selectedIds);
        setSelectedIds([]);
        loadData();
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const dataToSubmit = { ...formData };
        if (config.ownerField && !editingId) {
          dataToSubmit[config.ownerField] = user?.id;
        }

        if (editingId) {
          const { error } = await supabase
            .from(config.tableName)
            .update(dataToSubmit)
            .eq('id', editingId);
          if (error) throw error;

          if (user?.id) {
            await notifyUser.success(
              user.id,
              `${config.title} Updated`,
              `Successfully updated ${config.title.toLowerCase()}`
            );
          }
        } else {
          const { error } = await supabase.from(config.tableName).insert(dataToSubmit);
          if (error) throw error;

          if (user?.id) {
            await notifyUser.success(
              user.id,
              `${config.title} Created`,
              `Successfully created new ${config.title.toLowerCase()}`
            );
          }
        }

        resetForm();
        loadData();
      } catch (error: any) {
        console.error('Error saving:', error);
        alert(error.message);

        if (user?.id) {
          await notifyUser.error(
            user.id,
            `Error Saving ${config.title}`,
            error.message
          );
        }
      }
    };

    const handleEdit = (item: any) => {
      setEditingId(item.id);
      const editData: any = {};
      config.fields.forEach((field) => {
        editData[field.name] = item[field.name] || field.defaultValue || '';
      });
      setFormData(editData);
      setShowForm(true);
    };

    const handleDelete = async (id: string) => {
      if (!confirm('Delete this item?')) return;
      try {
        await supabase.from(config.tableName).delete().eq('id', id);
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    };

    const resetForm = () => {
      const initial: any = {};
      config.fields.forEach((field) => {
        initial[field.name] = field.defaultValue || '';
      });
      setFormData(initial);
      setShowForm(false);
      setEditingId(null);
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const exportColumns = config.displayFields.map(fieldName => ({
      key: fieldName,
      label: config.fields.find(f => f.name === fieldName)?.label || fieldName,
    }));

    const statusOptions = config.statusField
      ? config.fields.find(f => f.name === config.statusField)?.options
      : undefined;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{config.title}</h1>
            <p className="text-slate-600 mt-1">{config.description}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <ExportButton
                data={filteredAndSortedItems}
                filename={config.tableName}
                columns={exportColumns}
              />
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                New
              </button>
            </div>
            <CollaborationPresence module={config.tableName} />
          </div>
        </div>

        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={config.filters || []}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />

        {selectedIds.length > 0 && (
          <BulkActions
            selectedIds={selectedIds}
            totalCount={filteredAndSortedItems.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={config.statusField ? handleBulkStatusChange : undefined}
            statusOptions={statusOptions}
          />
        )}

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? 'Edit' : 'Create'} {config.title}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.map((field) => (
                  <div
                    key={field.name}
                    className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        required={field.required}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={20} />
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-4">
                <button
                  onClick={() => toggleSelectItem(item.id)}
                  className="mt-1 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {selectedIds.includes(item.id) ? (
                    <CheckSquare size={20} className="text-blue-600" />
                  ) : (
                    <Square size={20} />
                  )}
                </button>
                <div className="flex-1 space-y-3">
                  {config.displayFields.map((fieldName) => {
                    const field = config.fields.find((f) => f.name === fieldName);
                    return (
                      <div key={fieldName}>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                          {field?.label || fieldName}
                        </p>
                        <p className="text-slate-800 font-medium">
                          {item[fieldName] || 'N/A'}
                        </p>
                      </div>
                    );
                  })}
                  {config.statusField && item[config.statusField] && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</p>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {item[config.statusField]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedItems.length === 0 && !showForm && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <p className="text-slate-600">
              {items.length === 0
                ? 'No items yet. Create your first one!'
                : 'No items match your search criteria.'}
            </p>
          </div>
        )}
      </div>
    );
  };
};
