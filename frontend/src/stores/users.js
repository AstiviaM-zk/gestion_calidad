import { defineStore } from 'pinia';
import api from '../services/api';

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [],
    departments: [],
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchUsers() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/users');
        if (data.success) {
          this.users = data.users;
        }
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        this.error = 'Error cargando usuarios';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDepartments() {
      try {
        const { data } = await api.get('/departments');
        if (data.success) {
          this.departments = data.departments;
        }
      } catch (err) {
        console.error('Error cargando departamentos:', err);
      }
    },

    async updateUserRole(email, role) {
      try {
        const { data } = await api.put(`/users/${encodeURIComponent(email)}/role`, { role });
        if (data.success) {
          await this.fetchUsers();
          return { success: true, message: data.message };
        }
        return { success: false, message: data.message };
      } catch (err) {
        console.error('Error actualizando rol de usuario:', err.message);
        return {
          success: false,
          message: err.response?.data?.message || 'Error al actualizar el rol del usuario'
        };
      }
    },

    async updateUser(id, userData) {
      try {
        const { data } = await api.put(`/users/${id}`, userData);
        if (data.success) {
          await this.fetchUsers();
          return { success: true, message: data.message, user: data.user };
        }
        return { success: false, message: data.message };
      } catch (err) {
        console.error('Error actualizando información del usuario:', err);
        return {
          success: false,
          message: err.response?.data?.message || 'Error al actualizar información del usuario'
        };
      }
    }
  }
});
