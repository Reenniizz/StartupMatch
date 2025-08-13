import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  connection_requests: number;
  connection_accepted: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    connection_requests: 0,
    connection_accepted: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (unreadOnly: boolean = false, limit: number = 20) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(unreadOnly && { unread_only: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
        
        // Calculate stats
        const connectionRequests = data.notifications.filter((n: Notification) => n.type === 'connection_request').length;
        const connectionAccepted = data.notifications.filter((n: Notification) => n.type === 'connection_accepted').length;
        
        setStats({
          total: data.count,
          unread: data.unread_count,
          connection_requests: connectionRequests,
          connection_accepted: connectionAccepted
        });
      } else {
        setError(data.error || 'Error al cargar notificaciones');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds?: string[], markAll: boolean = false) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_ids: notificationIds,
          mark_all: markAll
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        if (markAll) {
          setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
          setStats(prev => ({ ...prev, unread: 0 }));
        } else if (notificationIds) {
          setNotifications(prev => prev.map(n => 
            notificationIds.includes(n.id) 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          ));
          setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - notificationIds.length) }));
        }

        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      return { success: false, error: 'Error de conexión' };
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setStats(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          return {
            ...prev,
            total: prev.total - 1,
            unread: notification && !notification.read_at ? prev.unread - 1 : prev.unread
          };
        });

        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false, error: 'Error de conexión' };
    }
  }, [user, notifications]);

  // Get unread count only
  const getUnreadCount = useCallback(async () => {
    if (!user) return 0;

    try {
      const response = await fetch('/api/notifications?unread_only=true&limit=1');
      const data = await response.json();
      
      if (response.ok) {
        return data.unread_count || 0;
      }
    } catch (err) {
      console.error('Error getting unread count:', err);
    }
    
    return 0;
  }, [user]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Utility functions
  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read_at);
  }, [notifications]);

  const hasUnreadOfType = useCallback((type: string) => {
    return notifications.some(n => n.type === type && !n.read_at);
  }, [notifications]);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    getUnreadCount,
    getNotificationsByType,
    getUnreadNotifications,
    hasUnreadOfType,
    refresh: () => fetchNotifications()
  };
}
