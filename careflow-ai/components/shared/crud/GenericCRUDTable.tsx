/**
 * Generic CRUD Table Component
 * 
 * Reusable table component for any entity with standard CRUD operations.
 * Reduces code duplication across the application.
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Edit, Trash2, Eye, MoreVertical, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, AlertCircle
} from 'lucide-react';
import { log } from '@/lib/logger';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface Action<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  onClick: (item: T) => void;
  variant?: 'default' | 'primary' | 'danger';
  show?: (item: T) => boolean;
}

interface GenericCRUDTableProps<T> {
  // Data
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  
  // Actions
  actions?: Action<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onRowClick?: (item: T) => void;
  
  // Search & Filter
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  filters?: React.ReactNode;
  
  // Pagination
  paginated?: boolean;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  
  // Selection
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  getItemId?: (item: T) => string;
  
  // Customization
  title?: string;
  addButtonLabel?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  headerActions?: React.ReactNode;
}

export function GenericCRUDTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  error = null,
  actions = [],
  onAdd,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  paginated = false,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  totalItems,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item) => item.id as string,
  title,
  addButtonLabel = 'Add New',
  emptyMessage = 'No data available',
  emptyIcon,
  className = '',
  rowClassName,
  headerActions,
}: GenericCRUDTableProps<T>) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use external or internal search
  const searchQuery = searchValue ?? internalSearchQuery;
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchQuery(value);
    }
  };

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
    log.debug('Table sorted', { column: columnKey, direction: sortDirection });
  };

  // Sort and filter data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply internal search filter if no external handler
    if (!onSearchChange && searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        columns.some(col => {
          const value = item[col.key as keyof T];
          return value && String(value).toLowerCase().includes(lowerQuery);
        })
      );
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn as keyof T];
        const bVal = b[sortColumn as keyof T];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection, columns, onSearchChange]);

  // Handle selection
  const handleSelectAll = () => {
    if (selectedItems.length === processedData.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.([...processedData]);
    }
  };

  const handleSelectItem = (item: T) => {
    const itemId = getItemId(item);
    const isSelected = selectedItems.some(i => getItemId(i) === itemId);
    
    if (isSelected) {
      onSelectionChange?.(selectedItems.filter(i => getItemId(i) !== itemId));
    } else {
      onSelectionChange?.([...selectedItems, item]);
    }
  };

  // Get row class
  const getRowClass = (item: T) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(item);
    }
    return rowClassName || '';
  };

  // Render action button
  const renderActionButton = (action: Action<T>, item: T) => {
    if (action.show && !action.show(item)) return null;

    const Icon = action.icon;
    const variantClasses = {
      default: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
      primary: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50',
      danger: 'text-red-600 hover:text-red-700 hover:bg-red-50',
    };

    return (
      <button
        key={action.label}
        onClick={(e) => {
          e.stopPropagation();
          action.onClick(item);
        }}
        className={`p-1.5 rounded-lg transition-colors ${variantClasses[action.variant || 'default']}`}
        title={action.label}
      >
        {Icon && <Icon size={16} />}
      </button>
    );
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {(title || searchable || onAdd || filters || headerActions) && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {title && (
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              )}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm w-64"
                    aria-label={searchPlaceholder}
                    role="searchbox"
                  />
                </div>
              )}
              {filters}
            </div>
            
            <div className="flex items-center gap-2">
              {headerActions}
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors"
                  aria-label={addButtonLabel}
                >
                  <Plus size={16} aria-hidden="true" />
                  {addButtonLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div 
          className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle size={16} aria-hidden="true" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto" role="region" aria-label={title || 'Data table'}>
        <table className="w-full text-left text-sm" role="table">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-10" scope="col">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === processedData.length && processedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 ${col.sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''} ${col.className || ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                  scope="col"
                  aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={col.sortable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(String(col.key));
                    }
                  } : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortColumn === col.key && (
                      sortDirection === 'asc' 
                        ? <ChevronUp size={14} aria-hidden="true" /> 
                        : <ChevronDown size={14} aria-hidden="true" />
                    )}
                  </div>
                </th>
              ))}
              {(actions.length > 0 || onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-right w-24" scope="col">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 || onView || onEdit || onDelete ? 1 : 0)} 
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    <span className="text-slate-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 || onView || onEdit || onDelete ? 1 : 0)} 
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    {emptyIcon || <Search size={32} className="opacity-50" />}
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((item, index) => {
                const itemId = getItemId(item);
                const isSelected = selectedItems.some(i => getItemId(i) === itemId);
                
                return (
                  <tr
                    key={itemId || index}
                    className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${getRowClass(item)} ${isSelected ? 'bg-primary-50' : ''}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectItem(item);
                          }}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className={`px-4 py-3 ${col.className || ''}`}>
                        {col.render 
                          ? col.render(item)
                          : String(item[col.key as keyof T] ?? '-')
                        }
                      </td>
                    ))}
                    {(actions.length > 0 || onView || onEdit || onDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View"
                              aria-label="View details"
                            >
                              <Eye size={16} aria-hidden="true" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit"
                              aria-label="Edit item"
                            >
                              <Edit size={16} aria-hidden="true" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete"
                              aria-label="Delete item"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          )}
                          {actions.map((action) => renderActionButton(action, item))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <nav 
          className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between"
          aria-label="Table pagination"
        >
          <div className="text-sm text-slate-500" aria-live="polite">
            {totalItems !== undefined && (
              <>
                Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
              </>
            )}
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Pagination controls">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to previous page"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="text-sm text-slate-600 px-2" aria-current="page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to next page"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default GenericCRUDTable;
