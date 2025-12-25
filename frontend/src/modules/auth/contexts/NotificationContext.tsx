import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: number;
  projectId?: number;
  entryId?: number;
  sheetType?: string; // Add sheetType to identify which table to navigate to
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getRecentNotifications: () => Notification[]; // Add this new function
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to Date objects
        return parsed.map((notification: any) => ({
          ...notification,
          timestamp: typeof notification.timestamp === 'string' 
            ? new Date(notification.timestamp) 
            : notification.timestamp
        }));
      } catch (e) {
        console.error('Error parsing notifications from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  // Filter notifications to only include those from the last 2 days
  const getRecentNotifications = (): Notification[] => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    return notifications.filter(notification => 
      new Date(notification.timestamp) >= twoDaysAgo
    );
  };

  const recentNotifications = getRecentNotifications();
  const unreadCount = recentNotifications.filter(notification => !notification.read).length;

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications: recentNotifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      clearNotifications,
      getRecentNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};