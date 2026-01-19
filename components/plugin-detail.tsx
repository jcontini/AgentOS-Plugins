/**
 * Plugin Detail Component
 * 
 * Full-page view of a plugin's details, shown when double-clicking
 * a plugin in the plugin browser.
 * 
 * Shows:
 * - Plugin icon, name, and status
 * - Description
 * - Enable/Disable toggle
 * - Operations list with details
 * - Utilities list with details
 * 
 * @example
 * ```yaml
 * - component: plugin-detail
 *   props:
 *     pluginId: "{{params.pluginId}}"
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

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

interface PluginDetailProps {
  /** Plugin ID to display */
  pluginId: string;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// API Helpers
// =============================================================================

async function fetchPlugin(pluginId: string): Promise<Plugin | null> {
  const response = await fetch('/api/plugins');
  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }
  const data = await response.json();
  const plugins = data.plugins || [];
  return plugins.find((p: Plugin) => p.id === pluginId) || null;
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
// Main Component
// =============================================================================

export function PluginDetail({ pluginId, className = '' }: PluginDetailProps) {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [iconError, setIconError] = useState(false);

  // Fetch plugin on mount or when pluginId changes
  useEffect(() => {
    if (!pluginId) {
      setError('No plugin specified');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setIconError(false);
    
    fetchPlugin(pluginId)
      .then(data => {
        if (!cancelled) {
          if (data) {
            setPlugin(data);
          } else {
            setError(`Plugin not found: ${pluginId}`);
          }
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
  }, [pluginId]);

  // Handle toggle
  const handleToggle = useCallback(async () => {
    if (!plugin) return;
    
    const newEnabled = !plugin.enabled;
    setUpdating(true);
    
    try {
      await setPluginEnabled(plugin.id, newEnabled);
      setPlugin({ ...plugin, enabled: newEnabled });
    } catch (err) {
      console.error('Failed to update plugin:', err);
    } finally {
      setUpdating(false);
    }
  }, [plugin]);

  // Loading state
  if (loading) {
    return (
      <div className={`plugin-detail-view plugin-detail-view--loading ${className}`}>
        <div className="plugin-detail-view-loading">
          <div className="progress-bar" role="progressbar" aria-label="Loading plugin..." />
          <span>Loading plugin...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !plugin) {
    return (
      <div className={`plugin-detail-view plugin-detail-view--error ${className}`}>
        <div className="plugin-detail-view-error">
          <span className="plugin-detail-view-error-icon">⚠</span>
          <span>{error || 'Plugin not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`plugin-detail-view ${className}`}>
      {/* Header */}
      <div className="plugin-detail-view-header">
        <div className="plugin-detail-view-icon">
          {iconError ? (
            <div className="plugin-detail-view-icon-fallback">
              {plugin.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={`/plugins/${plugin.id}/icon.svg`}
              alt=""
              onError={() => setIconError(true)}
            />
          )}
        </div>
        <div className="plugin-detail-view-info">
          <h1 className="plugin-detail-view-name">{plugin.name}</h1>
          <div className="plugin-detail-view-meta">
            <span className={`status-badge ${plugin.enabled ? 'status-badge--enabled' : 'status-badge--disabled'}`}>
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className="plugin-detail-view-id">{plugin.id}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {plugin.description && (
        <div className="plugin-detail-view-section">
          <p className="plugin-detail-view-description">{plugin.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="plugin-detail-view-section plugin-detail-view-actions">
        <button
          onClick={handleToggle}
          disabled={updating}
          className={plugin.enabled ? 'button--danger' : 'button--primary'}
        >
          {updating ? 'Updating...' : plugin.enabled ? 'Disable Plugin' : 'Enable Plugin'}
        </button>
      </div>

      {/* Operations */}
      {plugin.operations.length > 0 && (
        <fieldset className="plugin-detail-view-section">
          <legend>Operations ({plugin.operations.length})</legend>
          <div className="plugin-detail-view-list">
            {plugin.operations.map(op => (
              <div key={op} className="plugin-detail-view-list-item">
                <code>{op}</code>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {/* Utilities */}
      {plugin.utilities.length > 0 && (
        <fieldset className="plugin-detail-view-section">
          <legend>Utilities ({plugin.utilities.length})</legend>
          <div className="plugin-detail-view-list">
            {plugin.utilities.map(util => (
              <div key={util} className="plugin-detail-view-list-item">
                <code>{util}</code>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {/* No tools message */}
      {plugin.operations.length === 0 && plugin.utilities.length === 0 && (
        <div className="plugin-detail-view-section">
          <p className="plugin-detail-view-no-tools">
            This plugin has no operations or utilities defined.
          </p>
        </div>
      )}
    </div>
  );
}

export default PluginDetail;
