import { motion } from 'framer-motion';
import { 
  Activity, 
  Calendar, 
  Star, 
  Users, 
  Briefcase, 
  Code, 
  MessageCircle,
  Award,
  TrendingUp,
  GitBranch,
  Heart,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserActivity, ActivityType } from '../types';

interface ActivityFeedProps {
  activities: UserActivity[];
  isOwnProfile: boolean;
}

export function ActivityFeed({ activities, isOwnProfile }: ActivityFeedProps) {
  const activityConfig: Record<ActivityType, {
    icon: typeof Activity;
    color: string;
    bgColor: string;
    label: string;
  }> = {
    project_created: {
      icon: Code,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Proyecto creado'
    },
    project_updated: {
      icon: GitBranch,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Proyecto actualizado'
    },
    collaboration_started: {
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      label: 'Colaboración iniciada'
    },
    collaboration_completed: {
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Colaboración completada'
    },
    skill_added: {
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: 'Habilidad agregada'
    },
    profile_updated: {
      icon: Activity,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'Perfil actualizado'
    },
    connection_made: {
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      label: 'Nueva conexión'
    },
    achievement_earned: {
      icon: Award,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      label: 'Logro obtenido'
    }
  };

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1h';
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
    if (diffInHours < 730) return `Hace ${Math.floor(diffInHours / 168)}sem`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getActivityDescription = (activity: UserActivity) => {
    const config = activityConfig[activity.type];
    
    switch (activity.type) {
      case 'skill_added':
        return `Agregó la habilidad: ${activity.metadata?.skill || 'Nueva habilidad'}`;
      case 'project_created':
        return `Creó el proyecto: ${activity.metadata?.project_title || activity.title}`;
      case 'project_updated':
        return `Actualizó el proyecto: ${activity.metadata?.project_title || activity.title}`;
      case 'collaboration_started':
        return `Comenzó una colaboración en: ${activity.metadata?.project_title || activity.title}`;
      case 'collaboration_completed':
        return `Completó una colaboración en: ${activity.metadata?.project_title || activity.title}`;
      case 'connection_made':
        return `Se conectó con ${activity.metadata?.connection_name || 'otro usuario'}`;
      case 'achievement_earned':
        return `Obtuvo el logro: ${activity.metadata?.achievement_name || activity.title}`;
      case 'profile_updated':
        return activity.description || 'Actualizó su perfil';
      default:
        return activity.description || activity.title;
    }
  };

  // Sort activities by date (most recent first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group activities by date
  const groupedActivities = sortedActivities.reduce((groups, activity) => {
    const date = new Date(activity.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, UserActivity[]>);

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Actividad Reciente
          <Badge variant="secondary" className="ml-2">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([dateString, dayActivities]) => (
              <div key={dateString}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-600">
                    {formatGroupDate(dateString)}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {dayActivities.map((activity, index) => {
                    const config = activityConfig[activity.type];
                    const Icon = config.icon;
                    
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`
                          w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0
                        `}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {getActivityDescription(activity)}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatActivityDate(activity.date)}
                            </span>
                            
                            {activity.metadata && (
                              <Badge variant="outline" className="text-xs">
                                {config.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {isOwnProfile ? (
              <div>
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu actividad aparecerá aquí
                </h3>
                <p className="text-gray-600 mb-4">
                  Completa tu perfil, agrega proyectos y conecta con otros emprendedores para ver tu actividad
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Agregar habilidades
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Code className="w-3 h-3 mr-1" />
                    Crear proyectos
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Hacer conexiones
                  </Badge>
                </div>
              </div>
            ) : (
              <div>
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isOwnProfile ? 'Aún no tienes' : 'Este usuario aún no tiene'} actividad reciente
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity Summary */}
        {activities.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-blue-700">
                  <Activity className="w-4 h-4" />
                  <span>
                    <strong>{activities.length}</strong> actividades totales
                  </span>
                </div>
                
                {activities.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-700">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Últimos 30 días
                    </span>
                  </div>
                )}
              </div>
              
              {activities.length >= 10 && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Muy activo
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
