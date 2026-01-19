/**
 * Plugin Grid Component
 * 
 * Displays installed plugins in a folder-like icon grid view.
 * Shows each plugin as an icon with name, like files in a Finder window.
 * 
 * Features:
 * - Fetches plugins from /api/plugins
 * - Shows plugin icon and name in a grid
 * - Click to select, double-click to view details
 * - Keyboard navigation (arrows, enter)
 * 
 * @example
 * ```yaml
 * - component: plugin-grid
 *   props:
 *     columns: 6
 * ```
 */

import React, { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';

// =============================================================================
// Types
// =============================================================================

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  operations: string[];
  utilities: string[];
}

interface PluginGridProps {
  /** Number of columns (default: 6) */
  columns?: number;
  /** Gap between items in pixels (default: 8) */
  gap?: number;
  /** Callback when a plugin is selected (single click) */
  onSelect?: (plugin: Plugin) => void;
  /** Callback when a plugin is opened (double click) */
  onOpen?: (plugin: Plugin) => void;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// API Helper
// =============================================================================

async function fetchPlugins(): Promise<Plugin[]> {
  const response = await fetch('/api/plugins');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.plugins || [];
}

// =============================================================================
// Main Component
// =============================================================================

export function PluginGrid({ 
  columns = 6, 
  gap = 8,
  onSelect,
  onOpen,
  className = '' 
}: PluginGridProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [iconErrors, setIconErrors] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch plugins on mount
  useEffect(() => {
    let cancelled = false;
    
    fetchPlugins()
      .then(data => {
        if (!cancelled) {
          // Sort alphabetically by name
          const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setPlugins(sorted);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, []);

  // Handle icon load error - track which icons failed
  const handleIconError = useCallback((pluginId: string) => {
    setIconErrors(prev => new Set([...prev, pluginId]));
  }, []);

  // Handle click
  const handleClick = useCallback((plugin: Plugin) => {
    setSelectedId(plugin.id);
    onSelect?.(plugin);
  }, [onSelect]);

  // Handle double click
  const handleDoubleClick = useCallback((plugin: Plugin) => {
    onOpen?.(plugin);
  }, [onOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (plugins.length === 0) return;
    
    const currentIndex = plugins.findIndex(p => p.id === selectedId);
    const idx = currentIndex === -1 ? 0 : currentIndex;
    const rows = Math.ceil(plugins.length / columns);
    const currentRow = Math.floor(idx / columns);
    const currentCol = idx % columns;
    
    let newIndex = idx;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(idx + 1, plugins.length - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(idx - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentRow < rows - 1) {
          newIndex = Math.min((currentRow + 1) * columns + currentCol, plugins.length - 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentRow > 0) {
          newIndex = (currentRow - 1) * columns + currentCol;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = plugins.length - 1;
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0) {
          onOpen?.(plugins[currentIndex]);
        }
        break;
      default:
        return;
    }
    
    setSelectedId(plugins[newIndex].id);
    onSelect?.(plugins[newIndex]);
  }, [plugins, selectedId, columns, onSelect, onOpen]);

  // Loading state
  if (loading) {
    return (
      <div className={`plugin-grid plugin-grid--loading ${className}`}>
        <div className="plugin-grid-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading plugins..." />
          <span className="plugin-grid-loading-text">Loading plugins...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`plugin-grid plugin-grid--error ${className}`}>
        <div className="plugin-grid-error">
          <span className="plugin-grid-error-icon">⚠</span>
          <span className="plugin-grid-error-text">{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (plugins.length === 0) {
    return (
      <div className={`plugin-grid plugin-grid--empty ${className}`}>
        <div className="plugin-grid-empty">
          <span className="plugin-grid-empty-text">No plugins installed</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className={`plugin-grid ${className}`}
      role="grid"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Installed plugins"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        padding: '16px',
      }}
    >
      {plugins.map(plugin => {
        const isSelected = plugin.id === selectedId;
        const hasIconError = iconErrors.has(plugin.id);
        
        return (
          <div
            key={plugin.id}
            className={`plugin-grid-item ${isSelected ? 'plugin-grid-item--selected' : ''} ${!plugin.enabled ? 'plugin-grid-item--disabled' : ''}`}
            role="gridcell"
            aria-selected={isSelected}
            onClick={() => handleClick(plugin)}
            onDoubleClick={() => handleDoubleClick(plugin)}
            title={plugin.description || plugin.name}
          >
            <div className="plugin-grid-item-icon">
              {hasIconError ? (
                <div className="plugin-grid-item-fallback">
                  {plugin.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img
                  src={`/plugins/${plugin.id}/icon.svg`}
                  alt=""
                  draggable={false}
                  onError={() => handleIconError(plugin.id)}
                />
              )}
            </div>
            <span className="plugin-grid-item-name">{plugin.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default PluginGrid;
