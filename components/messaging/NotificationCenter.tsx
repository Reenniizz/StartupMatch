import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, CheckCheck, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'connection_request':
      return <Users className="h-4 w-4 text-blue-600" />;
    case 'connection_accepted':
      return <UserCheck className="h-4 w-4 text-green-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClick 
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { 
    addSuffix: true, 
    locale: es 
  });

  return (
    <div 
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${!notification.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
        </div>
        <div className="flex-shrink-0 flex space-x-1">
          {!notification.read_at && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    stats, 
    loading, 
    markAsRead, 
    deleteNotification,
    refresh 
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'connection_request':
        router.push('/matches?tab=requests');
        break;
      case 'connection_accepted':
        router.push('/matches?tab=connections');
        break;
      default:
        router.push('/notifications');
    }

    setIsOpen(false);
  };

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead([id]);
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "No se pudo marcar como leída",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAsRead([], true);
    if (result.success) {
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas"
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudieron marcar como leídas",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteNotification(id);
    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar la notificación",
        variant: "destructive"
      });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const hasUnread = stats.unread > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refresh}
                  disabled={loading}
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={stats.unread === 0}>
                      <Check className="h-4 w-4 mr-2" />
                      Marcar todas como leídas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/notifications')}>
                      <Bell className="h-4 w-4 mr-2" />
                      Ver todas las notificaciones
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {hasUnread && (
              <p className="text-sm text-blue-600">
                {stats.unread} notificación{stats.unread !== 1 ? 'es' : ''} sin leer
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div>
                {notifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                  />
                ))}
                {notifications.length > 10 && (
                  <div className="p-3 text-center border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        router.push('/notifications');
                        setIsOpen(false);
                      }}
                    >
                      Ver todas las notificaciones ({notifications.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
