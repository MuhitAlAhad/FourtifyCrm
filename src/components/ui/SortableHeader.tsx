import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
  /** Use 'tailwind' for Tailwind-styled pages, 'inline' for inline-styled pages */
  variant?: 'tailwind' | 'inline';
}

export function SortableHeader({ label, sortKey, currentSort, onSort, align = 'left', className, style, variant = 'inline' }: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;
  const iconSize = 14;

  if (variant === 'tailwind') {
    return (
      <th
        className={`px-6 py-4 text-${align} text-sm text-gray-400 cursor-pointer select-none hover:text-gray-200 transition-colors ${className || ''}`}
        onClick={() => onSort(sortKey)}
      >
        <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
          {label}
          <span className="inline-flex">
            {isActive ? (
              currentSort.direction === 'asc' ? (
                <ArrowUp size={iconSize} className="text-[#00ff88]" />
              ) : (
                <ArrowDown size={iconSize} className="text-[#00ff88]" />
              )
            ) : (
              <ArrowUpDown size={iconSize} className="opacity-30" />
            )}
          </span>
        </div>
      </th>
    );
  }

  // Inline style variant
  return (
    <th
      style={{
        padding: '14px 20px',
        textAlign: align,
        color: isActive ? '#d1d5db' : '#9ca3af',
        fontSize: '14px',
        fontWeight: '600',
        borderBottom: '2px solid #2a3442',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'color 0.2s',
        ...style,
      }}
      onClick={() => onSort(sortKey)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
        {label}
        <span style={{ display: 'inline-flex' }}>
          {isActive ? (
            currentSort.direction === 'asc' ? (
              <ArrowUp size={iconSize} color="#00ff88" />
            ) : (
              <ArrowDown size={iconSize} color="#00ff88" />
            )
          ) : (
            <ArrowUpDown size={iconSize} style={{ opacity: 0.3 }} />
          )}
        </span>
      </div>
    </th>
  );
}

/** Toggle sort direction: null -> asc -> desc -> asc ... */
export function toggleSort(currentSort: SortConfig, key: string): SortConfig {
  if (currentSort.key !== key) return { key, direction: 'asc' };
  return { key, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' };
}

/** Generic sort comparator */
export function sortData<T>(data: T[], sortConfig: SortConfig, getValue: (item: T, key: string) => any): T[] {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    const aVal = getValue(a, sortConfig.key);
    const bVal = getValue(b, sortConfig.key);

    // Handle nulls/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let comparison = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
    } else {
      comparison = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
    }

    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
}
