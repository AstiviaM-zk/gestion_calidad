import { defineStore } from 'pinia';
import api from '../services/api';

export const useRoleStore = defineStore('roles', {
  state: () => ({
    roles: [],
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchRoles() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/roles');
        if (data.success) {
          this.roles = data.roles;
        }
      } catch (err) {
        console.error('Error cargando roles:', err);
        this.error = 'Error cargando roles';
      } finally {
        this.isLoading = false;
      }
    },

    async createRole(roleData) {
      try {
        const { data } = await api.post('/roles', roleData);
        if (data.success) {
          await this.fetchRoles();
          return { success: true, message: data.message, role: data.role };
        }
        return { success: false, message: data.message };
      } catch (err) {
        console.error('Error creando rol:', err);
        return {
          success: false,
          message: err.response?.data?.message || 'Error al crear el rol'
        };
      }
    }
  }
});
