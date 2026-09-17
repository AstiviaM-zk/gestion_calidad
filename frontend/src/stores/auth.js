import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('qms_user')) || null,
    token: sessionStorage.getItem('qms_token') || '',
    isAuthenticated: !!sessionStorage.getItem('qms_token'),
    googleClientId: '606541311192-nta8lgacqaaofml43jci2vcokumom3mp.apps.googleusercontent.com',
    statusMessage: '',
    statusType: 'info',
    isLoading: false
  }),

  getters: {
    userRole: (state) => state.user?.role || 'guest',
    userPermissions: (state) => state.user?.permissions || [],
    hasRole: (state) => (role) => {
      if (!state.user) return false;
      if (Array.isArray(role)) return role.includes(state.user.role);
      return state.user.role === role;
    },
    hasPermission: (state) => (permissionKey) => {
      if (!state.user) return false;
      if (state.user.role === 'admin_sgc') return true;
      const perms = state.user.permissions || [];
      return perms.includes(permissionKey);
    }
  },

  actions: {
    async fetchAuthConfig() {
      try {
        const { data } = await api.get('/auth/config');
        if (data && data.googleClientId) {
          this.googleClientId = data.googleClientId;
        }
      } catch (err) {
        console.warn('Backend /auth/config no respondió, usando GOOGLE_CLIENT_ID por defecto:', err.message);
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return;
      try {
        const { data } = await api.get('/auth/me');
        if (data && data.success && data.user) {
          this.user = data.user;
          sessionStorage.setItem('qms_user', JSON.stringify(data.user));
          if (data.token) {
            this.token = data.token;
            sessionStorage.setItem('qms_token', data.token);
          }
        }
      } catch (err) {
        console.warn('No se pudo refrescar la información del usuario:', err.message);
      }
    },

    async loginWithForm(email, password) {
      this.isLoading = true;
      this.statusMessage = 'Iniciando sesión...';
      this.statusType = 'info';

      try {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.success) {
          this.token = data.token;
          this.user = data.user;
          this.isAuthenticated = true;
          sessionStorage.setItem('qms_token', data.token);
          sessionStorage.setItem('qms_user', JSON.stringify(data.user));
          this.statusMessage = '';
          return true;
        } else {
          this.statusMessage = data.message || 'Error en inicio de sesión';
          this.statusType = 'error';
          return false;
        }
      } catch (err) {
        this.statusMessage = err.response?.data?.message || 'Error de conexión al iniciar sesión. ¿El servidor backend está activo?';
        this.statusType = 'error';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async registerWithForm(name, email, password) {
      this.isLoading = true;
      this.statusMessage = 'Creando cuenta...';
      this.statusType = 'info';

      try {
        const { data } = await api.post('/auth/register', { name, email, password });
        if (data.success) {
          this.token = data.token;
          this.user = data.user;
          this.isAuthenticated = true;
          sessionStorage.setItem('qms_token', data.token);
          sessionStorage.setItem('qms_user', JSON.stringify(data.user));
          this.statusMessage = '';
          return true;
        } else {
          this.statusMessage = data.message || 'Error en registro';
          this.statusType = 'error';
          return false;
        }
      } catch (err) {
        this.statusMessage = err.response?.data?.message || 'Error al registrar usuario';
        this.statusType = 'error';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async loginWithGoogle(credential) {
      this.isLoading = true;
      this.statusMessage = 'Autenticando credencial con backend...';
      this.statusType = 'info';

      try {
        const { data } = await api.post('/auth/google', { credential });

        if (data.success) {
          this.token = data.token;
          this.user = data.user;
          this.isAuthenticated = true;
          sessionStorage.setItem('qms_token', data.token);
          sessionStorage.setItem('qms_user', JSON.stringify(data.user));
          this.statusMessage = '';
          return true;
        } else {
          this.statusMessage = data.message || 'Error durante la autenticación de Google';
          this.statusType = 'error';
          return false;
        }
      } catch (err) {
        console.error('Error en login de Google:', err);
        this.statusMessage = err.response?.data?.message || 'Error de conexión con el servidor backend (Puerto 3001)';
        this.statusType = 'error';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = '';
      this.isAuthenticated = false;
      this.statusMessage = '';
      sessionStorage.removeItem('qms_token');
      sessionStorage.removeItem('qms_user');
    }
  }
});
