'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void; errorId?: string }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    // Enhanced error logging
    logger.error('React Error Boundary triggered', error, {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Enhanced error logging with component stack
    logger.error('Error Boundary - Component Stack', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString()
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    logger.info('Error reported to monitoring service', {
      errorId: this.state.errorId,
      service: 'custom-monitoring'
    });
  }

  private handleReportError = () => {
    if (this.state.error && this.state.errorInfo) {
      const errorReport = {
        errorId: this.state.errorId,
        message: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        url: typeof window !== 'undefined' ? window.location.href : 'N/A'
      };

      // Copy error report to clipboard
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
          .then(() => {
            alert('Reporte de error copiado al portapapeles. Por favor compártelo con soporte.');
          })
          .catch(() => {
            alert('Error al copiar el reporte. Por favor toma una captura de pantalla.');
          });
      }
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: undefined
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent 
          error={this.state.error!} 
          retry={this.handleReset}
          errorId={this.state.errorId}
        />;
      }

      // Enhanced default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-600">
                Algo salió mal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </p>
              
              {this.state.errorId && (
                <div className="bg-gray-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">ID del Error:</p>
                  <code className="text-sm font-mono text-gray-800">
                    {this.state.errorId}
                  </code>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-red-50 p-4 rounded-lg text-sm">
                  <summary className="font-medium cursor-pointer text-red-700">
                    Detalles del Error (Solo en desarrollo)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-red-600 overflow-x-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-red-600 overflow-x-auto text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="text-red-600 overflow-x-auto text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleReset}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full"
                >
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Link>
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={this.handleReportError}
                  className="w-full text-sm"
                  size="sm"
                >
                  Reportar Error
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Si este problema persiste, contacta a soporte con el ID del error.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced hook para manejo de errores en componentes funcionales
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    logger.error('useErrorHandler - Error caught', error, {
      errorId,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };
}
