import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  style?: React.CSSProperties;
  getKey?: (item: T, index: number) => string;
}

/**
 * Virtualized list component for rendering large lists efficiently
 * Only renders visible items + overscan buffer
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 60,
  overscan = 5,
  className,
  style,
  getKey,
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        overflow: 'auto',
        height: '100%',
        ...style,
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          const key = getKey ? getKey(item, virtualRow.index) : virtualRow.index.toString();
          
          return (
            <div
              key={key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook to get memoized player list with sorting
 */
export function useSortedPlayers(players: any[], sortOrder: 'creation' | 'name' | 'role' = 'creation') {
  return useMemo(() => {
    const sorted = [...players];
    switch (sortOrder) {
      case 'creation':
        return sorted.sort((a, b) => (a.creationOrder || 0) - (b.creationOrder || 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'role':
        return sorted.sort((a, b) => (a.roleId || '').localeCompare(b.roleId || ''));
      default:
        return sorted;
    }
  }, [players, sortOrder]);
}
