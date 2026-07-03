import { create } from "zustand";
import type { Notification } from "@/types";

interface UIState {
  sidebarCollapsed: boolean;
  searchQuery: string;
  activeVehicleId: string | number | null;
  notifications: Notification[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveVehicleId: (id: string | number | null) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Notification) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  searchQuery: "",
  activeVehicleId: null,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveVehicleId: (id) => set({ activeVehicleId: id }),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  addNotification: (n) => 
    set((state) => ({
      notifications: [n, ...state.notifications]
    })),
}));
