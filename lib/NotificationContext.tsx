"use client";

import React, { createContext, useState, useContext, useCallback, ReactNode } from "react";
import { Notification } from "../types";
import { NotificationContainer } from "../components/ui/Notification";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    if (notification.message && typeof notification.message === 'string' && notification.message.toLowerCase().includes('failed to fetch')) {
      return; // Ignore noisy network errors that occur when device wakes from sleep
    }
    const id = Date.now().toString() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, ...notification }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
