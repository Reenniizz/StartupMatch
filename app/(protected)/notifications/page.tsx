"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Bell,
  Check,
  MessageCircle,
  Users,
  Calendar,
  AlertCircle,
  Settings,
  MoreVertical,
  X,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: 'message' | 'match' | 'event' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'Nuevo mensaje de Ana García',
    description: 'Te ha enviado un mensaje sobre el proyecto FinTech',
    time: '5 min',
    read: false,
    avatar: '/api/placeholder/40/40'
  },
  {
    id: '2',
    type: 'match',
    title: 'Nuevo match encontrado',
    description: 'Carlos Martínez (CTO) podría ser compatible contigo - 85% match',
    time: '2 h',
    read: false
  },
  {
    id: '3',
    type: 'event',
    title: 'Recordatorio de evento',
    description: 'El Startup Meetup Madrid comienza en 1 hora',
    time: '3 h',
    read: true
  },
  {
    id: '4',
    type: 'system',
    title: 'Perfil completado',
    description: 'Has completado tu perfil al 100%. ¡Ahora apareces en más búsquedas!',
    time: '1 d',
    read: true
  },
  {
    id: '5',
    type: 'message',
    title: 'Mensaje de Luis Rodríguez',
    description: 'Está interesado en colaborar en tu proyecto',
    time: '2 d',
    read: true,
    avatar: '/api/placeholder/40/40'
  }
];

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'match': return <Users className="h-5 w-5 text-green-500" />;
      case 'event': return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'system': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'border-l-blue-500 bg-blue-50/30';
      case 'match': return 'border-l-green-500 bg-green-50/30';
      case 'event': return 'border-l-purple-500 bg-purple-50/30';
      case 'system': return 'border-l-orange-500 bg-orange-50/30';
      default: return 'border-l-gray-500 bg-gray-50/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="h-6 w-6 mr-2" />
                Notificaciones
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
                )}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button 
                  onClick={markAllAsRead} 
                  variant="outline"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Marcar todas como leídas
                </Button>
              )}
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtrar:</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                Todas ({notifications.length})
              </Button>
              <Button 
                onClick={() => setFilter('unread')}
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
              >
                No leídas ({unreadCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'Todas tus notificaciones están al día' 
                : 'Las notificaciones aparecerán aquí cuando tengas actividad'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`
                  border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md
                  ${getNotificationColor(notification.type)}
                  ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-50/50'}
                `}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Avatar if exists */}
                      {notification.avatar && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`text-sm mt-1 ${
                              !notification.read ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              hace {notification.time}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
