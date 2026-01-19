/**
 * Plugin Browser Component
 * 
 * A Finder-like browser for plugins with multiple view modes:
 * - Icons: Grid of plugin icons (like Finder icon view)
 * - List: Simple list with icon and name
 * - Details: Table with columns (Name, Operations, Utilities, Status)
 * 
 * Features:
 * - Toolbar with view mode switcher
 * - Click to select, double-click to open details
 * - Keyboard navigation
 * - Enable/disable plugins inline
 * 
 * @example
 * ```yaml
 * - component: plugin-browser
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

type ViewMode = 'icons' | 'list' | 'details';

interface PluginBrowserProps {
  /** Initial view mode */
  initialView?: ViewMode;
  /** Callback when a plugin is opened (double-click) */
  onOpen?: (plugin: Plugin) => void;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// API Helpers
// =============================================================================

async function fetchPlugins(): Promise<Plugin[]> {
  const response = await fetch('/api/plugins');
  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }
  const data = await response.json();
  return data.plugins || [];
}

async function setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
  const action = enabled ? 'enable_plugin' : 'disable_plugin';
  const response = await fetch('/api/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'Settings',
      arguments: { action, plugin: pluginId }
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to ${action}: ${response.statusText}`);
  }
}

// =============================================================================
// View Mode Icons (simple SVG)
// =============================================================================

function IconViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="2" width="4" height="4" rx="0.5" />
      <rect x="7" y="3" width="8" height="2" rx="0.5" />
      <rect x="1" y="8" width="4" height="4" rx="0.5" />
      <rect x="7" y="9" width="8" height="2" rx="0.5" />
    </svg>
  );
}

function DetailsViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="14" height="3" rx="0.5" />
      <rect x="1" y="6" width="14" height="2" rx="0.5" />
      <rect x="1" y="10" width="14" height="2" rx="0.5" />
      <rect x="1" y="14" width="14" height="2" rx="0.5" />
    </svg>
  );
}

// =============================================================================
// Icon Grid View
// =============================================================================

interface IconGridProps {
  plugins: Plugin[];
  selectedId: string | null;
  iconErrors: Set<string>;
  onSelect: (plugin: Plugin) => void;
  onOpen: (plugin: Plugin) => void;
  onIconError: (id: string) => void;
}

function IconGrid({ plugins, selectedId, iconErrors, onSelect, onOpen, onIconError }: IconGridProps) {
  return (
    <div className="plugin-browser-icons icon-grid">
      {plugins.map(plugin => {
        const isSelected = plugin.id === selectedId;
        const hasIconError = iconErrors.has(plugin.id);
        
        return (
          <div
            key={plugin.id}
            className={`icon ${isSelected ? 'icon--selected' : ''} ${!plugin.enabled ? 'icon--disabled' : ''}`}
            aria-selected={isSelected}
            onClick={() => onSelect(plugin)}
            onDoubleClick={() => onOpen(plugin)}
            title={plugin.description || plugin.name}
          >
            {hasIconError ? (
              <div className="icon-fallback">
                {plugin.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <img
                src={`/plugins/${plugin.id}/icon.svg`}
                alt=""
                draggable={false}
                onError={() => onIconError(plugin.id)}
              />
            )}
            <span className="icon-label">{plugin.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// List View
// =============================================================================

interface ListViewProps {
  plugins: Plugin[];
  selectedId: string | null;
  iconErrors: Set<string>;
  onSelect: (plugin: Plugin) => void;
  onOpen: (plugin: Plugin) => void;
  onIconError: (id: string) => void;
}

function ListView({ plugins, selectedId, iconErrors, onSelect, onOpen, onIconError }: ListViewProps) {
  return (
    <ul className="plugin-browser-list list" role="listbox">
      {plugins.map(plugin => {
        const isSelected = plugin.id === selectedId;
        const hasIconError = iconErrors.has(plugin.id);
        
        return (
          <li
            key={plugin.id}
            className={`${!plugin.enabled ? 'list-item--disabled' : ''}`}
            aria-selected={isSelected}
            onClick={() => onSelect(plugin)}
            onDoubleClick={() => onOpen(plugin)}
            title={plugin.description || plugin.name}
          >
            {hasIconError ? (
              <span className="list-icon-fallback">
                {plugin.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <img
                src={`/plugins/${plugin.id}/icon.svg`}
                alt=""
                width="16"
                height="16"
                draggable={false}
                onError={() => onIconError(plugin.id)}
              />
            )}
            <span className={!plugin.enabled ? 'plugin-disabled' : ''}>{plugin.name}</span>
          </li>
        );
      })}
    </ul>
  );
}

// =============================================================================
// Details View (Table)
// =============================================================================

interface DetailsViewProps {
  plugins: Plugin[];
  selectedId: string | null;
  iconErrors: Set<string>;
  updating: string | null;
  onSelect: (plugin: Plugin) => void;
  onOpen: (plugin: Plugin) => void;
  onToggle: (plugin: Plugin) => void;
  onIconError: (id: string) => void;
}

function DetailsView({ 
  plugins, 
  selectedId, 
  iconErrors, 
  updating,
  onSelect, 
  onOpen,
  onToggle,
  onIconError 
}: DetailsViewProps) {
  return (
    <table className="plugin-browser-details detailed" role="grid">
      <thead>
        <tr>
          <th style={{ width: '24px' }}></th>
          <th style={{ width: '24px' }}></th>
          <th>Name</th>
          <th style={{ width: '80px' }}>Operations</th>
          <th style={{ width: '80px' }}>Utilities</th>
          <th style={{ width: '80px' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {plugins.map(plugin => {
          const isSelected = plugin.id === selectedId;
          const hasIconError = iconErrors.has(plugin.id);
          
          return (
            <tr
              key={plugin.id}
              aria-selected={isSelected}
              onClick={() => onSelect(plugin)}
              onDoubleClick={() => onOpen(plugin)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={plugin.enabled}
                  disabled={updating === plugin.id}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggle(plugin);
                  }}
                  aria-label={`Enable ${plugin.name}`}
                />
              </td>
              <td>
                {hasIconError ? (
                  <span className="details-icon-fallback">
                    {plugin.name.charAt(0)}
                  </span>
                ) : (
                  <img
                    src={`/plugins/${plugin.id}/icon.svg`}
                    alt=""
                    width="16"
                    height="16"
                    draggable={false}
                    onError={() => onIconError(plugin.id)}
                  />
                )}
              </td>
              <td>
                <span className={!plugin.enabled ? 'plugin-disabled' : ''}>
                  {plugin.name}
                </span>
              </td>
              <td>{plugin.operations.length || '—'}</td>
              <td>{plugin.utilities.length || '—'}</td>
              <td>
                <span className={`status-badge ${plugin.enabled ? 'status-badge--enabled' : 'status-badge--disabled'}`}>
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// =============================================================================
// Plugin Detail Panel (shown on double-click)
// =============================================================================

interface PluginDetailPanelProps {
  plugin: Plugin;
  updating: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function PluginDetailPanel({ plugin, updating, onToggle, onClose }: PluginDetailPanelProps) {
  return (
    <div className="plugin-detail-panel">
      <div className="plugin-detail-panel-header">
        <img
          src={`/plugins/${plugin.id}/icon.svg`}
          alt=""
          width="48"
          height="48"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="plugin-detail-panel-title">
          <h2>{plugin.name}</h2>
          <span className={`status-badge ${plugin.enabled ? 'status-badge--enabled' : 'status-badge--disabled'}`}>
            {plugin.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <button 
          className="plugin-detail-panel-close" 
          onClick={onClose}
          aria-label="Close panel"
          title="Close"
        >
          Close
        </button>
      </div>
      
      {plugin.description && (
        <p className="plugin-detail-panel-description">{plugin.description}</p>
      )}
      
      <div className="plugin-detail-panel-actions">
        <button
          onClick={onToggle}
          disabled={updating}
        >
          {plugin.enabled ? 'Disable Plugin' : 'Enable Plugin'}
        </button>
      </div>
      
      {plugin.operations.length > 0 && (
        <fieldset className="plugin-detail-panel-section">
          <legend>Operations ({plugin.operations.length})</legend>
          <ul className="plugin-detail-panel-list">
            {plugin.operations.map(op => (
              <li key={op}>{op}</li>
            ))}
          </ul>
        </fieldset>
      )}
      
      {plugin.utilities.length > 0 && (
        <fieldset className="plugin-detail-panel-section">
          <legend>Utilities ({plugin.utilities.length})</legend>
          <ul className="plugin-detail-panel-list">
            {plugin.utilities.map(util => (
              <li key={util}>{util}</li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PluginBrowser({ 
  initialView = 'icons',
  onOpen,
  className = '' 
}: PluginBrowserProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [iconErrors, setIconErrors] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailPlugin, setDetailPlugin] = useState<Plugin | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch plugins on mount
  useEffect(() => {
    let cancelled = false;
    
    fetchPlugins()
      .then(data => {
        if (!cancelled) {
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

  // Handle icon error
  const handleIconError = useCallback((pluginId: string) => {
    setIconErrors(prev => new Set([...prev, pluginId]));
  }, []);

  // Handle selection (single click) - also shows detail panel
  const handleSelect = useCallback((plugin: Plugin) => {
    setSelectedId(plugin.id);
    setDetailPlugin(plugin); // Show detail panel on selection
  }, []);

  // Handle open (double-click) - opens plugin detail view
  const handleOpen = useCallback((plugin: Plugin) => {
    // Dispatch custom event to open plugin detail view
    window.dispatchEvent(new CustomEvent('agentos:open-window', {
      detail: {
        appId: 'plugins',
        title: plugin.name,
        view: 'detail',
        params: { pluginId: plugin.id }
      }
    }));
    onOpen?.(plugin);
  }, [onOpen]);

  // Handle toggle enabled/disabled
  const handleToggle = useCallback(async (plugin: Plugin) => {
    const newEnabled = !plugin.enabled;
    setUpdating(plugin.id);
    
    try {
      await setPluginEnabled(plugin.id, newEnabled);
      setPlugins(prev => prev.map(p => 
        p.id === plugin.id ? { ...p, enabled: newEnabled } : p
      ));
      // Update detail panel if showing this plugin
      if (detailPlugin?.id === plugin.id) {
        setDetailPlugin({ ...plugin, enabled: newEnabled });
      }
    } catch (err) {
      console.error('Failed to update plugin:', err);
    } finally {
      setUpdating(null);
    }
  }, [detailPlugin]);

  // Close detail panel
  const closeDetail = useCallback(() => {
    setDetailPlugin(null);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (plugins.length === 0) return;
    
    const currentIndex = plugins.findIndex(p => p.id === selectedId);
    const idx = currentIndex === -1 ? 0 : currentIndex;
    
    // For icon view, calculate grid navigation
    const columns = viewMode === 'icons' ? 6 : 1;
    const rows = Math.ceil(plugins.length / columns);
    const currentRow = Math.floor(idx / columns);
    const currentCol = idx % columns;
    
    let newIndex = idx;
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (viewMode === 'icons') {
          newIndex = Math.min(idx + 1, plugins.length - 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (viewMode === 'icons') {
          newIndex = Math.max(idx - 1, 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (viewMode === 'icons') {
          if (currentRow < rows - 1) {
            newIndex = Math.min((currentRow + 1) * columns + currentCol, plugins.length - 1);
          }
        } else {
          newIndex = Math.min(idx + 1, plugins.length - 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (viewMode === 'icons') {
          if (currentRow > 0) {
            newIndex = (currentRow - 1) * columns + currentCol;
          }
        } else {
          newIndex = Math.max(idx - 1, 0);
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
          handleOpen(plugins[currentIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (detailPlugin) {
          closeDetail();
        }
        break;
      default:
        return;
    }
    
    setSelectedId(plugins[newIndex].id);
  }, [plugins, selectedId, viewMode, handleOpen, detailPlugin, closeDetail]);

  // Loading state
  if (loading) {
    return (
      <div className={`plugin-browser plugin-browser--loading ${className}`}>
        <div className="plugin-browser-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading plugins..." />
          <span>Loading plugins...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`plugin-browser plugin-browser--error ${className}`}>
        <div className="plugin-browser-error">
          <span className="plugin-browser-error-icon">⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (plugins.length === 0) {
    return (
      <div className={`plugin-browser plugin-browser--empty ${className}`}>
        <div className="plugin-browser-empty">
          <span>No plugins installed</span>
        </div>
      </div>
    );
  }

  const selectedPlugin = plugins.find(p => p.id === selectedId);

  return (
    <div
      ref={containerRef}
      className={`plugin-browser ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      <div className="plugin-browser-toolbar">
        <div className="plugin-browser-toolbar-left">
          <span className="plugin-browser-count">{plugins.length} plugins</span>
        </div>
        <div className="plugin-browser-toolbar-right">
          <div className="plugin-browser-view-switcher" role="radiogroup" aria-label="View mode">
            <button
              className={viewMode === 'icons' ? 'active' : ''}
              onClick={() => setViewMode('icons')}
              aria-pressed={viewMode === 'icons'}
              title="Icon view"
            >
              <IconViewIcon />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              title="List view"
            >
              <ListViewIcon />
            </button>
            <button
              className={viewMode === 'details' ? 'active' : ''}
              onClick={() => setViewMode('details')}
              aria-pressed={viewMode === 'details'}
              title="Details view"
            >
              <DetailsViewIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Content area with optional detail panel */}
      <div className={`plugin-browser-content ${detailPlugin ? 'plugin-browser-content--with-detail' : ''}`}>
        {/* Main view */}
        <div className="plugin-browser-main">
          {viewMode === 'icons' && (
            <IconGrid
              plugins={plugins}
              selectedId={selectedId}
              iconErrors={iconErrors}
              onSelect={handleSelect}
              onOpen={handleOpen}
              onIconError={handleIconError}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              plugins={plugins}
              selectedId={selectedId}
              iconErrors={iconErrors}
              onSelect={handleSelect}
              onOpen={handleOpen}
              onIconError={handleIconError}
            />
          )}
          {viewMode === 'details' && (
            <DetailsView
              plugins={plugins}
              selectedId={selectedId}
              iconErrors={iconErrors}
              updating={updating}
              onSelect={handleSelect}
              onOpen={handleOpen}
              onToggle={handleToggle}
              onIconError={handleIconError}
            />
          )}
        </div>

        {/* Detail panel (shown on double-click) */}
        {detailPlugin && (
          <PluginDetailPanel
            plugin={detailPlugin}
            updating={updating === detailPlugin.id}
            onToggle={() => handleToggle(detailPlugin)}
            onClose={closeDetail}
          />
        )}
      </div>

      {/* Status bar */}
      {selectedPlugin && !detailPlugin && (
        <div className="plugin-browser-status">
          <span>{selectedPlugin.name}</span>
          {selectedPlugin.description && (
            <span className="plugin-browser-status-desc">— {selectedPlugin.description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default PluginBrowser;
