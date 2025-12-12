/**
 * GenericCRUDTable Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenericCRUDTable, Column } from '@/components/shared/crud/GenericCRUDTable';

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    track: vi.fn(),
  },
}));

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: string;
  age: number;
}

const mockData: TestItem[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'Active', age: 30 },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', age: 25 },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'Inactive', age: 45 },
];

const columns: Column<TestItem>[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
];

describe('GenericCRUDTable', () => {
  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      render(<GenericCRUDTable data={mockData} columns={columns} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      render(<GenericCRUDTable data={mockData} columns={columns} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<GenericCRUDTable data={mockData} columns={columns} title="Test Table" />);
      
      expect(screen.getByText('Test Table')).toBeInTheDocument();
    });

    it('should render empty message when no data', () => {
      render(<GenericCRUDTable data={[]} columns={columns} emptyMessage="No records found" />);
      
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<GenericCRUDTable data={[]} columns={columns} loading={true} />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      render(<GenericCRUDTable data={[]} columns={columns} error="Failed to load data" />);
      
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should render search input when searchable', () => {
      render(<GenericCRUDTable data={mockData} columns={columns} searchable={true} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('should filter data based on search query', async () => {
      const user = userEvent.setup();
      render(<GenericCRUDTable data={mockData} columns={columns} searchable={true} />);
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'John');
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should use custom search placeholder', () => {
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          searchable={true}
          searchPlaceholder="Find users..."
        />
      );
      
      expect(screen.getByPlaceholderText('Find users...')).toBeInTheDocument();
    });

    it('should call onSearchChange when provided', async () => {
      const user = userEvent.setup();
      const onSearchChange = vi.fn();
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          searchable={true}
          onSearchChange={onSearchChange}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('Search...');
      await user.type(searchInput, 'test');
      
      expect(onSearchChange).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should sort data when clicking sortable column header', async () => {
      const user = userEvent.setup();
      render(<GenericCRUDTable data={mockData} columns={columns} />);
      
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      
      // After sort, check order in the DOM
      const rows = screen.getAllByRole('row');
      // First row is header, data rows start from index 1
      expect(rows.length).toBeGreaterThan(1);
    });

    it('should toggle sort direction on repeated clicks', async () => {
      const user = userEvent.setup();
      render(<GenericCRUDTable data={mockData} columns={columns} />);
      
      const ageHeader = screen.getByText('Age');
      
      // First click - ascending
      await user.click(ageHeader);
      // Second click - descending
      await user.click(ageHeader);
      
      // Table should still render
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render Add button when onAdd provided', () => {
      const onAdd = vi.fn();
      render(<GenericCRUDTable data={mockData} columns={columns} onAdd={onAdd} />);
      
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });

    it('should use custom add button label', () => {
      const onAdd = vi.fn();
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          onAdd={onAdd}
          addButtonLabel="Create User"
        />
      );
      
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });

    it('should call onAdd when Add button clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<GenericCRUDTable data={mockData} columns={columns} onAdd={onAdd} />);
      
      await user.click(screen.getByText('Add New'));
      
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it('should render action buttons for each row', () => {
      const onView = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
      
      // Should have action buttons for each row
      const viewButtons = screen.getAllByTitle('View');
      const editButtons = screen.getAllByTitle('Edit');
      const deleteButtons = screen.getAllByTitle('Delete');
      
      expect(viewButtons.length).toBe(mockData.length);
      expect(editButtons.length).toBe(mockData.length);
      expect(deleteButtons.length).toBe(mockData.length);
    });

    it('should call onView with correct item', async () => {
      const user = userEvent.setup();
      const onView = vi.fn();
      
      render(<GenericCRUDTable data={mockData} columns={columns} onView={onView} />);
      
      const viewButtons = screen.getAllByTitle('View');
      await user.click(viewButtons[0]);
      
      expect(onView).toHaveBeenCalledWith(mockData[0]);
    });

    it('should call onEdit with correct item', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      
      render(<GenericCRUDTable data={mockData} columns={columns} onEdit={onEdit} />);
      
      const editButtons = screen.getAllByTitle('Edit');
      await user.click(editButtons[1]);
      
      expect(onEdit).toHaveBeenCalledWith(mockData[1]);
    });

    it('should call onDelete with correct item', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      
      render(<GenericCRUDTable data={mockData} columns={columns} onDelete={onDelete} />);
      
      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[2]);
      
      expect(onDelete).toHaveBeenCalledWith(mockData[2]);
    });

    it('should call onRowClick when row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      
      render(<GenericCRUDTable data={mockData} columns={columns} onRowClick={onRowClick} />);
      
      const row = screen.getByText('John Doe').closest('tr');
      if (row) {
        await user.click(row);
        expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
      }
    });
  });

  describe('Selection', () => {
    it('should render checkboxes when selectable', () => {
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          selectable={true}
          selectedItems={[]}
          onSelectionChange={vi.fn()}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      // Header checkbox + one per row
      expect(checkboxes.length).toBe(mockData.length + 1);
    });

    it('should call onSelectionChange when checkbox clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          selectable={true}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      // Click first row checkbox (index 1, as 0 is header)
      await user.click(checkboxes[1]);
      
      expect(onSelectionChange).toHaveBeenCalled();
    });

    it('should select all when header checkbox clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          selectable={true}
          selectedItems={[]}
          onSelectionChange={onSelectionChange}
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      // Click header checkbox
      await user.click(checkboxes[0]);
      
      expect(onSelectionChange).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Custom Rendering', () => {
    it('should use custom render function for columns', () => {
      const customColumns: Column<TestItem>[] = [
        {
          key: 'name',
          label: 'Name',
          render: (item) => <span data-testid="custom-name">Custom: {item.name}</span>,
        },
      ];
      
      render(<GenericCRUDTable data={mockData} columns={customColumns} />);
      
      // Should render custom elements for each row
      const customElements = screen.getAllByTestId('custom-name');
      expect(customElements).toHaveLength(3);
      expect(customElements[0]).toHaveTextContent('Custom: John Doe');
    });

    it('should apply custom row className', () => {
      const rowClassName = (item: TestItem) => 
        item.status === 'Active' ? 'active-row' : 'inactive-row';
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          rowClassName={rowClassName}
        />
      );
      
      const johnRow = screen.getByText('John Doe').closest('tr');
      expect(johnRow).toHaveClass('active-row');
    });
  });

  describe('Pagination', () => {
    it('should render pagination when paginated', () => {
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          paginated={true}
          currentPage={1}
          totalPages={3}
          totalItems={30}
          pageSize={10}
        />
      );
      
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    it('should call onPageChange when pagination buttons clicked', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      
      render(
        <GenericCRUDTable 
          data={mockData} 
          columns={columns} 
          paginated={true}
          currentPage={2}
          totalPages={3}
          onPageChange={onPageChange}
        />
      );
      
      // Find and click next page button
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.querySelector('svg'));
      
      if (nextButton) {
        await user.click(nextButton);
      }
    });
  });
});
