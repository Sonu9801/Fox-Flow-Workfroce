import { create } from "zustand";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, email: string, name: string, role: string) => void;
  updateToken: (token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  email: null,
  name: null,
  role: null,
  isAuthenticated: false,

  login: (token, refreshToken, email, name, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("email", email);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    set({ token, refreshToken, email, name, role, isAuthenticated: true });
  },

  updateToken: (token) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    // Also remove legacy keys
    localStorage.removeItem("username");
    set({ token: null, refreshToken: null, email: null, name: null, role: null, isAuthenticated: false });
  },

  initialize: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const email = localStorage.getItem("email");
      const name = localStorage.getItem("name");
      const role = localStorage.getItem("role");
      if (token && email && role) {
        set({ token, refreshToken, email, name, role, isAuthenticated: true });
      }
    }
  },
}));
