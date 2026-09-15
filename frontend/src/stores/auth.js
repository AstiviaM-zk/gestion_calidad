import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(sessionStorage.getItem('qms_user')) || null,
    token: sessionStorage.getItem('qms_token') || '',
    isAuthenticated: !!sessionStorage.getItem('qms_token'),
    googleClientId: '',
    statusMessage: '',
    statusType: 'info',
    isLoading: false
  }),

  actions: {
    async fetchAuthConfig() {
      try {
        const { data } = await api.get('/auth/config');
        if (data && data.googleClientId) {
          this.googleClientId = data.googleClientId;
        }
      } catch (err) {
        console.error('Error cargando configuración de autenticación:', err);
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
        this.statusMessage = err.response?.data?.message || 'Error de conexión con el servidor backend';
        this.statusType = 'error';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    demoLogin() {
      const demoUser = {
        id: 'USR-001',
        googleId: '1098234710928374',
        name: 'Ing. Carlos Mendoza (Demostración)',
        email: 'carlos.mendoza@institucion.gob.mx',
        picture: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=1e3a8a&color=fff',
        role: 'Administrador',
        status: 'Activo',
        lastLogin: new Date().toISOString()
      };
      const demoToken = 'demo-jwt-token-vue3';

      this.token = demoToken;
      this.user = demoUser;
      this.isAuthenticated = true;
      sessionStorage.setItem('qms_token', demoToken);
      sessionStorage.setItem('qms_user', JSON.stringify(demoUser));
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
