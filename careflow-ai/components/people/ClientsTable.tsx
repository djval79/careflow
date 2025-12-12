/**
 * Clients Table Component
 * 
 * Displays clients using GenericCRUDTable with React Query hooks.
 */

import React from 'react';
import { MapPin, Phone, Calendar, BadgePoundSterling } from 'lucide-react';
import { GenericCRUDTable, Column } from '@/components/shared/crud/GenericCRUDTable';
import { StatusBadge, CareLevelBadge } from '@/components/shared/ui/StatusBadge';
import { useClients, useDeleteClient, useDeactivateClient } from '@/hooks';
import type { Client } from '@/types';
import { log } from '@/lib/logger';

interface ClientsTableProps {
  onView?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onAdd?: () => void;
  selectedId?: string | null;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filters?: { status?: string; careLevel?: string };
}

export function ClientsTable({
  onView,
  onEdit,
  onAdd,
  selectedId,
  searchTerm,
  onSearchChange,
  filters,
}: ClientsTableProps) {
  const { data: clients = [], isLoading, error } = useClients(filters);
  const deleteClient = useDeleteClient();
  const deactivateClient = useDeactivateClient();

  // Filter by search term if provided
  const filteredClients = searchTerm
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients;

  // Define table columns
  const columns: Column<Client>[] = [
    {
      key: 'name',
      label: 'Client',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{item.name}</p>
            <p className="text-xs text-slate-500">Age: {item.age}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Location',
      render: (item) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
          <span className="truncate max-w-[200px]">{item.address}</span>
        </div>
      ),
    },
    {
      key: 'careLevel',
      label: 'Care Level',
      sortable: true,
      render: (item) => <CareLevelBadge level={item.careLevel} />,
    },
    {
      key: 'fundingDetails',
      label: 'Funding',
      render: (item) => (
        <div className="flex items-center gap-2">
          <BadgePoundSterling size={14} className="text-blue-600" />
          <div>
            <p className="text-sm font-medium text-slate-700">{item.fundingDetails.source}</p>
            {item.fundingDetails.budgetLimit && (
              <p className="text-xs text-slate-500">
                £{item.fundingDetails.budgetLimit.toLocaleString()}/mo
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'lastVisit',
      label: 'Last Visit',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <Calendar size={12} />
          <span>{item.lastVisit}</span>
        </div>
      ),
    },
    {
      key: 'emergencyContact',
      label: 'Emergency',
      render: (item) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-slate-700">{item.emergencyContact.name}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Phone size={10} />
            <span>{item.emergencyContact.phone}</span>
          </div>
        </div>
      ),
    },
  ];

  // Handle delete with soft-delete option
  const handleDelete = async (item: Client) => {
    const action = window.confirm(
      `Would you like to deactivate ${item.name}?\n\nClick OK to deactivate (soft delete) or Cancel to permanently delete.`
    );
    
    try {
      if (action) {
        await deactivateClient.mutateAsync(item.id);
        log.info('Client deactivated', { id: item.id, name: item.name });
      } else if (window.confirm(`Are you absolutely sure you want to PERMANENTLY delete ${item.name}? This cannot be undone.`)) {
        await deleteClient.mutateAsync(item.id);
        log.info('Client permanently deleted', { id: item.id, name: item.name });
      }
    } catch (err) {
      log.error('Failed to delete/deactivate client', { error: err, clientId: item.id });
    }
  };

  // Row highlight for selected item
  const getRowClassName = (item: Client) => {
    let className = selectedId === item.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : '';
    if (item.status === 'Inactive') {
      className += ' opacity-60';
    }
    return className;
  };

  return (
    <GenericCRUDTable<Client>
      data={filteredClients}
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
      searchPlaceholder="Search clients..."
      addButtonLabel="Add Client"
      emptyMessage="No clients found"
      rowClassName={getRowClassName}
      getItemId={(item) => item.id}
    />
  );
}

// Compact version for list views
export function ClientListItem({ 
  client, 
  selected, 
  onClick 
}: { 
  client: Client; 
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
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
          {client.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
          <p className="text-xs text-slate-500 truncate max-w-[150px]">{client.address}</p>
        </div>
      </div>
      <CareLevelBadge level={client.careLevel} />
    </div>
  );
}

export default ClientsTable;
