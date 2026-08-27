import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
          connectSocket(data.user.id, data.user.role);
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, isLoading: false });
          return { success: false, message: msg };
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', payload);
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isLoading: false });
          connectSocket(data.user.id, data.user.role);
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, isLoading: false });
          return { success: false, message: msg };
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        disconnectSocket();
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
          return data.user;
        } catch {
          set({ user: null });
          return null;
        }
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      isAuthenticated: () => !!get().user && !!localStorage.getItem('accessToken'),
      isFarmer: () => get().user?.role === 'farmer',
      isBuyer: () => get().user?.role === 'buyer',
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'agriconnect-auth',
      partialize: (state) => ({ user: state.user, refreshToken: state.refreshToken }),
    }
  )
);

export default useAuthStore;
