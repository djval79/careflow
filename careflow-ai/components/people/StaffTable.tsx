/**
 * Staff Table Component
 * 
 * Displays staff members using GenericCRUDTable with React Query hooks.
 */

import React from 'react';
import { Phone, Mail, Shield, Calendar } from 'lucide-react';
import { GenericCRUDTable, Column, Action } from '@/components/shared/crud/GenericCRUDTable';
import { StatusBadge, ComplianceBadge } from '@/components/shared/ui/StatusBadge';
import { useStaff, useDeleteStaff } from '@/hooks';
import type { StaffMember } from '@/types';
import { log } from '@/lib/logger';

interface StaffTableProps {
  onView?: (staff: StaffMember) => void;
  onEdit?: (staff: StaffMember) => void;
  onAdd?: () => void;
  selectedId?: string | null;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filters?: { status?: string; role?: string };
}

export function StaffTable({
  onView,
  onEdit,
  onAdd,
  selectedId,
  searchTerm,
  onSearchChange,
  filters,
}: StaffTableProps) {
  const { data: staff = [], isLoading, error } = useStaff(filters);
  const deleteStaff = useDeleteStaff();

  // Filter by search term if provided
  const filteredStaff = searchTerm
    ? staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : staff;

  // Define table columns
  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      label: 'Staff Member',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
            {item.avatar}
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">{item.role}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Mail size={12} />
            <span className="truncate max-w-[150px]">{item.email}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Phone size={12} />
            <span>{item.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'compliance',
      label: 'Compliance',
      render: (item) => {
        const validCount = item.compliance.filter(c => c.status === 'Valid').length;
        const total = item.compliance.length;
        const compliancePercent = total > 0 ? Math.round((validCount / total) * 100) : 0;
        
        return (
          <div className="flex items-center gap-2">
            <Shield 
              size={16} 
              className={compliancePercent >= 80 ? 'text-green-600' : compliancePercent >= 50 ? 'text-amber-600' : 'text-red-600'} 
            />
            <span className="text-sm font-medium">
              {validCount}/{total}
            </span>
            <span className="text-xs text-slate-400">
              ({compliancePercent}%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Calendar size={12} />
          <span>{item.joinedDate}</span>
        </div>
      ),
    },
  ];

  // Handle delete with confirmation
  const handleDelete = async (item: StaffMember) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }
    
    try {
      await deleteStaff.mutateAsync(item.id);
      log.info('Staff member deleted', { id: item.id, name: item.name });
    } catch (err) {
      log.error('Failed to delete staff member', { error: err, staffId: item.id });
    }
  };

  // Row highlight for selected item
  const getRowClassName = (item: StaffMember) => {
    return selectedId === item.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : '';
  };

  return (
    <GenericCRUDTable<StaffMember>
      data={filteredStaff}
      columns={columns}
      loading={isLoading}
      error={error?.message}
      onAdd={onAdd}
      onView={onView}
      onEdit={onEdit}
      onDelete={handleDelete}
      searchable={!!onSearchChange}
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search staff..."
      addButtonLabel="Add Staff"
      emptyMessage="No staff members found"
      rowClassName={getRowClassName}
      getItemId={(item) => item.id}
    />
  );
}

// Compact version for list views
export function StaffListItem({ 
  staff, 
  selected, 
  onClick 
}: { 
  staff: StaffMember; 
  selected?: boolean; 
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between
        ${selected ? 'bg-blue-50/50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold">
          {staff.avatar}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
          <p className="text-xs text-slate-500">{staff.role}</p>
        </div>
      </div>
      <StatusBadge status={staff.status} size="sm" />
    </div>
  );
}

export default StaffTable;
