/**
 * Status Badge Component
 * 
 * Reusable badge component for displaying status indicators.
 */

import React from 'react';

type BadgeVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'default'
  | 'primary'
  | 'secondary';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Auto-detect variant from common status strings
function getVariantFromStatus(status: string): BadgeVariant {
  const lowerStatus = status.toLowerCase();
  
  // Success variants
  if (['active', 'valid', 'approved', 'completed', 'paid', 'good', 'hired', 'resolved', 'closed'].includes(lowerStatus)) {
    return 'success';
  }
  
  // Warning variants
  if (['pending', 'due soon', 'expiring', 'warning', 'on leave', 'draft', 'investigating', 'screening'].includes(lowerStatus)) {
    return 'warning';
  }
  
  // Danger variants
  if (['expired', 'terminated', 'overdue', 'high', 'critical', 'rejected', 'cancelled', 'open'].includes(lowerStatus)) {
    return 'danger';
  }
  
  // Info variants
  if (['new', 'scheduled', 'sent', 'interview', 'medium'].includes(lowerStatus)) {
    return 'info';
  }
  
  // Primary variants
  if (['offer'].includes(lowerStatus)) {
    return 'primary';
  }
  
  return 'default';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  secondary: 'bg-purple-100 text-purple-800 border-purple-200',
  default: 'bg-slate-100 text-slate-800 border-slate-200',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function StatusBadge({ 
  status, 
  variant, 
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const resolvedVariant = variant || getVariantFromStatus(status);
  
  // Map variant to semantic meaning for screen readers
  const semanticRole = ['danger', 'warning'].includes(resolvedVariant) ? 'alert' : 'status';
  
  return (
    <span 
      className={`
        inline-flex items-center font-bold rounded-full border
        ${variantStyles[resolvedVariant]}
        ${sizeStyles[size]}
        ${className}
      `}
      role={semanticRole}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

// Convenience components for common status types
export function ActiveBadge({ className }: { className?: string }) {
  return <StatusBadge status="Active" variant="success" className={className} />;
}

export function PendingBadge({ className }: { className?: string }) {
  return <StatusBadge status="Pending" variant="warning" className={className} />;
}

export function ExpiredBadge({ className }: { className?: string }) {
  return <StatusBadge status="Expired" variant="danger" className={className} />;
}

// Care level badge with specific styling
export function CareLevelBadge({ level, className }: { level: string; className?: string }) {
  const levelVariants: Record<string, BadgeVariant> = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'danger',
  };
  
  return (
    <StatusBadge 
      status={`${level} Risk`} 
      variant={levelVariants[level.toLowerCase()] || 'default'}
      className={className}
    />
  );
}

// Compliance status badge
export function ComplianceBadge({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} className={className} />;
}

export default StatusBadge;
