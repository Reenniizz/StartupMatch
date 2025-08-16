"use client";

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketProvider';

interface ConnectionMonitorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showDetails?: boolean;
}

export const ConnectionMonitor: React.FC<ConnectionMonitorProps> = ({ 
  position = 'top-right',
  showDetails = false 
}) => {
  const { isConnected, connectionStats } = useSocket();
  const [expanded, setExpanded] = useState(showDetails);
  const [serverStats, setServerStats] = useState<any>(null);

  // Posicionamiento
  const getPositionClasses = () => {
    const base = 'fixed z-50 m-4';
    switch (position) {
      case 'top-left': return `${base} top-0 left-0`;
      case 'top-right': return `${base} top-0 right-0`;
      case 'bottom-left': return `${base} bottom-0 left-0`;
      case 'bottom-right': return `${base} bottom-0 right-0`;
      default: return `${base} top-0 right-0`;
    }
  };

  // Status colors
  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (connectionStats.latency > 1000) return 'bg-yellow-500';
    if (connectionStats.latency > 500) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Desconectado';
    if (connectionStats.latency > 1000) return 'Lento';
    if (connectionStats.latency > 500) return 'Moderado';
    return 'Óptimo';
  };

  // Formato de latencia
  const formatLatency = (ms: number) => {
    if (ms === 0) return 'N/A';
    if (ms > 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  // Auto-hide en production
  if (process.env.NODE_ENV === 'production' && !showDetails) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      {/* Indicator compacto */}
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer
          transition-all duration-200 hover:shadow-xl
          ${expanded ? 'bg-gray-800' : 'bg-gray-700'}
          text-white text-sm font-mono
        `}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status dot */}
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
        
        {/* Status text */}
        <span className="hidden sm:inline">
          {getStatusText()}
        </span>
        
        {/* Latency */}
        {isConnected && connectionStats.latency > 0 && (
          <span className="text-gray-300">
            {formatLatency(connectionStats.latency)}
          </span>
        )}

        {/* Expand/collapse icon */}
        <svg 
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
        </svg>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="mt-2 bg-gray-800 rounded-lg shadow-xl p-4 text-white text-xs font-mono min-w-64">
          <h3 className="text-sm font-bold mb-3 text-blue-400">
            🔗 Socket.IO Monitor
          </h3>
          
          {/* Connection status */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Estado:</span>
              <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
            </div>

            {isConnected && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Latencia:</span>
                  <span className={`font-bold ${
                    connectionStats.latency > 1000 ? 'text-red-400' : 
                    connectionStats.latency > 500 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {formatLatency(connectionStats.latency)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Reconexiones:</span>
                  <span className="text-blue-400 font-bold">
                    {connectionStats.reconnectCount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Salud:</span>
                  <span className={`font-bold ${
                    connectionStats.isHealthy ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {connectionStats.isHealthy ? '✅ Saludable' : '⚠️ Degradado'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Latency chart (mini) */}
          {isConnected && connectionStats.latency > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-gray-400 mb-2">Rendimiento:</div>
              <div className="flex items-end gap-1 h-8">
                {/* Mini bars representing latency over time */}
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-sm opacity-75 ${
                      connectionStats.latency > 1000 ? 'bg-red-400' :
                      connectionStats.latency > 500 ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`}
                    style={{
                      height: `${Math.max(20, Math.min(100, connectionStats.latency / 10))}%`
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Últimos 10 pings
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 pt-3 border-t border-gray-600 space-y-1">
            <button 
              className="w-full text-left text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => {
                console.log('📊 Connection Stats:', connectionStats);
              }}
            >
              📊 Log estadísticas
            </button>
            
            <button 
              className="w-full text-left text-yellow-400 hover:text-yellow-300 transition-colors"
              onClick={() => {
                // Trigger reconnection if needed
                window.location.reload();
              }}
            >
              🔄 Forzar reconexión
            </button>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-500">
            Socket.IO v{process.env.NEXT_PUBLIC_SOCKET_VERSION || '4.x'}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook para usar el monitor de forma condicional
export const useConnectionMonitor = () => {
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Show monitor in development or when debug flag is set
    const shouldShow = 
      process.env.NODE_ENV === 'development' || 
      localStorage.getItem('socket-debug') === 'true';
    
    setShowMonitor(shouldShow);
  }, []);

  return { showMonitor, setShowMonitor };
};

// Component wrapper para desarrollo
export const DevelopmentConnectionMonitor: React.FC = () => {
  const { showMonitor } = useConnectionMonitor();
  
  if (!showMonitor) return null;
  
  return <ConnectionMonitor position="top-right" showDetails={false} />;
};

export default ConnectionMonitor;
