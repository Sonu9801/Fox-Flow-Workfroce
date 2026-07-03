import { create } from "zustand";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, username: string, role: string) => void;
  updateToken: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  username: null,
  role: null,
  isAuthenticated: false,

  login: (token, refreshToken, username, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("username", username);
    localStorage.setItem("role", role);
    set({ token, refreshToken, username, role, isAuthenticated: true });
  },

  updateToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    set({ token: null, refreshToken: null, username: null, role: null, isAuthenticated: false });
  },

  initialize: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const username = localStorage.getItem("username");
      const role = localStorage.getItem("role");
      if (token && username && role) {
        set({ token, refreshToken, username, role, isAuthenticated: true });
      }
    }
  },
}));
