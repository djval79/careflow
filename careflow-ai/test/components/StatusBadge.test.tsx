/**
 * StatusBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  StatusBadge, 
  ActiveBadge, 
  PendingBadge, 
  ExpiredBadge,
  CareLevelBadge,
  ComplianceBadge 
} from '@/components/shared/ui/StatusBadge';

describe('StatusBadge', () => {
  describe('Basic Rendering', () => {
    it('should render with the provided status text', () => {
      render(<StatusBadge status="Active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<StatusBadge status="Test" className="custom-class" />);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Auto-detecting Variants', () => {
    it('should apply success variant for "Active" status', () => {
      render(<StatusBadge status="Active" />);
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
    });

    it('should apply success variant for "Paid" status', () => {
      render(<StatusBadge status="Paid" />);
      const badge = screen.getByText('Paid');
      expect(badge).toHaveClass('bg-green-100');
    });

    it('should apply warning variant for "Pending" status', () => {
      render(<StatusBadge status="Pending" />);
      const badge = screen.getByText('Pending');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-800');
    });

    it('should apply danger variant for "Expired" status', () => {
      render(<StatusBadge status="Expired" />);
      const badge = screen.getByText('Expired');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-800');
    });

    it('should apply danger variant for "Overdue" status', () => {
      render(<StatusBadge status="Overdue" />);
      const badge = screen.getByText('Overdue');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('should apply info variant for "New" status', () => {
      render(<StatusBadge status="New" />);
      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-800');
    });

    it('should apply default variant for unknown status', () => {
      render(<StatusBadge status="Unknown" />);
      const badge = screen.getByText('Unknown');
      expect(badge).toHaveClass('bg-slate-100');
      expect(badge).toHaveClass('text-slate-800');
    });
  });

  describe('Explicit Variants', () => {
    it('should use explicit variant over auto-detected', () => {
      render(<StatusBadge status="Active" variant="danger" />);
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).not.toHaveClass('bg-green-100');
    });

    it('should apply primary variant correctly', () => {
      render(<StatusBadge status="Custom" variant="primary" />);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('bg-primary-100');
    });

    it('should apply secondary variant correctly', () => {
      render(<StatusBadge status="Custom" variant="secondary" />);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('bg-purple-100');
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(<StatusBadge status="Test" size="sm" />);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-0.5');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size correctly (default)', () => {
      render(<StatusBadge status="Test" />);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('px-2.5');
    });

    it('should render large size correctly', () => {
      render(<StatusBadge status="Test" size="lg" />);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('text-sm');
    });
  });

  describe('Convenience Components', () => {
    it('should render ActiveBadge correctly', () => {
      render(<ActiveBadge />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Active')).toHaveClass('bg-green-100');
    });

    it('should render PendingBadge correctly', () => {
      render(<PendingBadge />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toHaveClass('bg-amber-100');
    });

    it('should render ExpiredBadge correctly', () => {
      render(<ExpiredBadge />);
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toHaveClass('bg-red-100');
    });
  });

  describe('CareLevelBadge', () => {
    it('should render low care level with info variant', () => {
      render(<CareLevelBadge level="low" />);
      const badge = screen.getByText('low Risk');
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('should render medium care level with warning variant', () => {
      render(<CareLevelBadge level="medium" />);
      const badge = screen.getByText('medium Risk');
      expect(badge).toHaveClass('bg-amber-100');
    });

    it('should render high care level with danger variant', () => {
      render(<CareLevelBadge level="high" />);
      const badge = screen.getByText('high Risk');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('should render critical care level with danger variant', () => {
      render(<CareLevelBadge level="critical" />);
      const badge = screen.getByText('critical Risk');
      expect(badge).toHaveClass('bg-red-100');
    });
  });

  describe('ComplianceBadge', () => {
    it('should render compliance status correctly', () => {
      render(<ComplianceBadge status="Valid" />);
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as inline element', () => {
      render(<StatusBadge status="Active" />);
      const badge = screen.getByText('Active');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should have proper styling classes for visibility', () => {
      render(<StatusBadge status="Test" />);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('font-bold');
      expect(badge).toHaveClass('rounded-full');
    });
  });
});
