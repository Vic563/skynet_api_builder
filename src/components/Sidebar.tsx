import { useRef, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Endpoint } from '../types';

interface SidebarProps {
    query: string;
    setQuery: (q: string) => void;
    grouped: Record<string, Endpoint[]>;
    selectedId: string;
    onSelect: (id: string) => void;
}

type VirtualItem =
    | { type: 'section'; name: string }
    | { type: 'endpoint'; endpoint: Endpoint };

// Memoized endpoint button to prevent unnecessary re-renders
const EndpointButton = memo(function EndpointButton({
    endpoint,
    isSelected,
    onSelect,
}: {
    endpoint: Endpoint;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            className={`nav-item ${isSelected ? 'active' : ''}`}
            onClick={() => onSelect(endpoint.id)}
        >
            <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
            </span>
            <span className="nav-item__title">{endpoint.title}</span>
        </button>
    );
});

export function Sidebar({ query, setQuery, grouped, selectedId, onSelect }: SidebarProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Flatten grouped items into a virtual list with section headers
    const flatItems = useMemo<VirtualItem[]>(() => {
        const items: VirtualItem[] = [];
        Object.entries(grouped).forEach(([sectionName, endpoints]) => {
            items.push({ type: 'section', name: sectionName });
            endpoints.forEach((ep) => {
                items.push({ type: 'endpoint', endpoint: ep });
            });
        });
        return items;
    }, [grouped]);

    const virtualizer = useVirtualizer({
        count: flatItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const item = flatItems[index];
            // Section headers are taller than endpoint items
            return item.type === 'section' ? 32 : 40;
        },
        overscan: 10, // Render extra items for smoother scrolling
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <aside className="sidebar">
            <div className="sidebar__search">
                <input
                    type="search"
                    placeholder="Search endpoints..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-input"
                />
            </div>
            <nav className="sidebar__nav" ref={parentRef}>
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualItems.map((virtualRow) => {
                        const item = flatItems[virtualRow.index];

                        if (item.type === 'section') {
                            return (
                                <div
                                    key={`section-${item.name}`}
                                    className="nav-group__title"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {item.name}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={item.endpoint.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <EndpointButton
                                    endpoint={item.endpoint}
                                    isSelected={selectedId === item.endpoint.id}
                                    onSelect={onSelect}
                                />
                            </div>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}
