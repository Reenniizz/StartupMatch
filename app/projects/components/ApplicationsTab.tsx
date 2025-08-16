import { motion } from 'framer-motion';
import { ProjectApplication, ViewMode } from '../types';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Eye,
  MessageSquare,
  MoreHorizontal,
  ExternalLink,
  X,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Archive
} from 'lucide-react';

interface ApplicationsTabProps {
  applications: ProjectApplication[];
  loading: boolean;
  viewMode: ViewMode;
  onView: (application: ProjectApplication) => void;
  onMessage?: (application: ProjectApplication) => void;
  onWithdraw?: (applicationId: string) => void;
  onAccept?: (applicationId: string) => void;
  onReject?: (applicationId: string) => void;
  showActions?: boolean;
}

export function ApplicationsTab({
  applications,
  loading,
  viewMode,
  onView,
  onMessage,
  onWithdraw,
  onAccept,
  onReject,
  showActions = true
}: ApplicationsTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'interview':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'negotiating':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'rejected':
        return 'Rechazada';
      case 'withdrawn':
        return 'Retirada';
      case 'interview':
        return 'Entrevista';
      case 'negotiating':
        return 'Negociando';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'accepted':
        return <CheckCircle className="w-3 h-3" />;
      case 'rejected':
        return <X className="w-3 h-3" />;
      case 'withdrawn':
        return <AlertCircle className="w-3 h-3" />;
      case 'interview':
        return <Users className="w-3 h-3" />;
      case 'negotiating':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getUrgencyLevel = (status: string, createdAt: string) => {
    const hoursOld = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    
    if (status === 'interview' || status === 'negotiating') return 'high';
    if (status === 'pending' && hoursOld > 48) return 'medium';
    if (status === 'accepted' && hoursOld < 24) return 'high';
    
    return 'low';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton 
            key={i} 
            type="project-cards"
          />
        ))}
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <EmptyState
        type="no-applications"
      />
    );
  }

  // Group applications by status for better organization
  const groupedApplications = applications.reduce((acc, app) => {
    const status = app.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(app);
    return acc;
  }, {} as Record<string, ProjectApplication[]>);

  const statusOrder = ['pending', 'interview', 'negotiating', 'accepted', 'rejected', 'withdrawn'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Applications Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {applications.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {applications.filter(a => a.status === 'interview').length}
          </div>
          <div className="text-sm text-gray-600">Entrevistas</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {applications.filter(a => a.status === 'accepted').length}
          </div>
          <div className="text-sm text-gray-600">Aceptadas</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">
            {applications.length}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Applications by Status */}
      <div className="space-y-8">
        {statusOrder.map(status => {
          const statusApplications = groupedApplications[status];
          if (!statusApplications?.length) return null;

          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span className="font-medium text-sm">
                    {getStatusLabel(status)} ({statusApplications.length})
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                {statusApplications.map((application) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white rounded-lg border-l-4 border-r border-t border-b border-gray-200 hover:shadow-md transition-all duration-200 ${getUrgencyColor(getUrgencyLevel(application.status, application.created_at))}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 
                              className="font-semibold text-lg text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => onView(application)}
                            >
                              {application.project?.title}
                            </h3>
                            
                            <Badge className={`border ${getStatusColor(application.status)}`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-1">{getStatusLabel(application.status)}</span>
                            </Badge>
                          </div>
                          
                          {application.role && (
                            <p className="text-blue-600 font-medium text-sm mb-2">
                              Aplicando para: {application.role}
                            </p>
                          )}
                          
                          {application.project?.short_description && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                              {application.project.short_description}
                            </p>
                          )}
                        </div>

                        {/* Actions Menu */}
                        {showActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onView(application)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              
                              {application.project && (
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver Proyecto
                                </DropdownMenuItem>
                              )}
                              
                              {onMessage && (
                                <DropdownMenuItem onClick={() => onMessage(application)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Enviar Mensaje
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              
                              {application.status === 'pending' && onWithdraw && (
                                <DropdownMenuItem 
                                  onClick={() => onWithdraw(application.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Retirar Aplicación
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Application Meta */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Aplicado {formatTimeAgo(application.created_at)}</span>
                        </div>
                        
                        {application.project?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{application.project.location}</span>
                          </div>
                        )}
                        
                        {application.project?.is_paid && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-3 h-3" />
                            <span>Pagado</span>
                          </div>
                        )}
                      </div>

                      {/* Message Preview */}
                      {application.message && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700 font-medium mb-1">Tu mensaje:</p>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            "{application.message}"
                          </p>
                        </div>
                      )}

                      {/* Skills Match */}
                      {application.project?.skills_required && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 font-medium mb-2">Habilidades requeridas:</p>
                          <div className="flex flex-wrap gap-1">
                            {application.project.skills_required.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {application.project.skills_required.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.project.skills_required.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Response Time Indicator */}
                      {application.status === 'pending' && (
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Tiempo de respuesta típico: 2-3 días
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => onView(application)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                            
                            {onMessage && (
                              <Button
                                onClick={() => onMessage(application)}
                                size="sm"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Mensaje
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Accepted Application Actions */}
                      {application.status === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-800">¡Felicitaciones! Tu aplicación fue aceptada</span>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            El propietario del proyecto está interesado en trabajar contigo. 
                            Es hora de coordinar los siguientes pasos.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Iniciar Conversación
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="w-3 h-3 mr-1" />
                              Agendar Reunión
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
