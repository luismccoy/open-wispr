/**
 * Connection Status Indicator Component
 * 
 * Displays a visual indicator of the AWS connection health status.
 * Shows green when connected, yellow when initializing, red when there's an error.
 * 
 * Requirement: R13 (Performance) - Clear indicator if AWS connection fails
 */

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

// Connection status types matching connectionWarmup.js
type ConnectionStatusType = 
  | 'not_initialized' 
  | 'initializing' 
  | 'ready' 
  | 'error' 
  | 'credentials_missing';

interface ConnectionStatusData {
  credentials: ConnectionStatusType;
  bedrock: ConnectionStatusType;
  isReady: boolean;
  lastError: string | null;
  warmupDuration: number | null;
  region: string;
}

interface HealthCheckData {
  healthy: boolean;
  credentials: {
    status: ConnectionStatusType;
    healthy: boolean;
  };
  bedrock: {
    status: ConnectionStatusType;
    healthy: boolean;
    client: boolean;
  };
  region: string;
  lastError: string | null;
  warmupDuration: number | null;
}

interface ConnectionStatusIndicatorProps {
  /** Show detailed status information */
  showDetails?: boolean;
  /** Compact mode - just show the dot */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Auto-refresh interval in ms (0 to disable) */
  autoRefreshInterval?: number;
}

/**
 * Get status color based on connection state
 */
function getStatusColor(status: ConnectionStatusType): string {
  switch (status) {
    case 'ready':
      return 'bg-green-500';
    case 'initializing':
      return 'bg-yellow-500';
    case 'not_initialized':
      return 'bg-gray-400';
    case 'credentials_missing':
      return 'bg-orange-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Get status text based on connection state
 */
function getStatusText(status: ConnectionStatusType): string {
  switch (status) {
    case 'ready':
      return 'Connected';
    case 'initializing':
      return 'Connecting...';
    case 'not_initialized':
      return 'Not initialized';
    case 'credentials_missing':
      return 'Credentials missing';
    case 'error':
      return 'Connection error';
    default:
      return 'Unknown';
  }
}

/**
 * Get overall status from health check data
 */
function getOverallStatus(health: HealthCheckData | null): ConnectionStatusType {
  if (!health) return 'not_initialized';
  if (health.healthy) return 'ready';
  if (health.credentials.status === 'credentials_missing') return 'credentials_missing';
  if (health.credentials.status === 'error' || health.bedrock.status === 'error') return 'error';
  if (health.credentials.status === 'initializing' || health.bedrock.status === 'initializing') return 'initializing';
  return 'not_initialized';
}

/**
 * Connection Status Indicator
 * 
 * A small visual indicator showing AWS connection health.
 */
export default function ConnectionStatusIndicator({
  showDetails = false,
  compact = false,
  className = '',
  autoRefreshInterval = 0,
}: ConnectionStatusIndicatorProps) {
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Fetch connection health status
   */
  const fetchHealth = useCallback(async () => {
    if (!window.electronAPI?.connectionHealthCheck) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.connectionHealthCheck();
      setHealth(result);
    } catch (error) {
      console.error('Failed to fetch connection health:', error);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Trigger a connection warmup/refresh
   */
  const refreshConnection = useCallback(async () => {
    if (!window.electronAPI?.connectionWarmup) {
      return;
    }

    setIsLoading(true);
    try {
      await window.electronAPI.connectionWarmup({ testConnection: false });
      await fetchHealth();
    } catch (error) {
      console.error('Failed to refresh connection:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchHealth]);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchHealth, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, fetchHealth]);

  const overallStatus = getOverallStatus(health);
  const statusColor = getStatusColor(overallStatus);
  const statusText = getStatusText(overallStatus);

  // Compact mode - just the dot with tooltip
  if (compact) {
    return (
      <div 
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={`w-2.5 h-2.5 rounded-full ${statusColor} ${
            overallStatus === 'initializing' ? 'animate-pulse' : ''
          }`}
          title={statusText}
        />
        
        {/* Tooltip on hover */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
            AWS: {statusText}
            {health?.lastError && (
              <div className="text-red-300 text-[10px] mt-0.5">
                {health.lastError}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
          </div>
        )}
      </div>
    );
  }

  // Standard mode - dot with label
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div 
          className={`w-2.5 h-2.5 rounded-full ${statusColor} ${
            overallStatus === 'initializing' ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm text-gray-600">
          {statusText}
        </span>
      </div>

      {/* Refresh button */}
      <button
        onClick={refreshConnection}
        disabled={isLoading}
        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        title="Refresh connection"
      >
        <RefreshCw 
          size={14} 
          className={isLoading ? 'animate-spin' : ''} 
        />
      </button>

      {/* Detailed status */}
      {showDetails && health && (
        <div className="ml-2 text-xs text-gray-500 border-l pl-2">
          <div>Region: {health.region}</div>
          {health.warmupDuration && (
            <div>Warmup: {health.warmupDuration}ms</div>
          )}
          {health.lastError && (
            <div className="text-red-500">{health.lastError}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline status badge - for use in headers or compact spaces
 */
export function ConnectionStatusBadge({ className = '' }: { className?: string }) {
  const [isReady, setIsReady] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (window.electronAPI?.connectionIsReady) {
        const ready = await window.electronAPI.connectionIsReady();
        setIsReady(ready);
      }
    };
    
    checkStatus();
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isReady === null) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 ${className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Checking...
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
      isReady 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    } ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
      {isReady ? 'AWS Connected' : 'AWS Disconnected'}
    </span>
  );
}
