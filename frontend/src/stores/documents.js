import { defineStore } from 'pinia';
import api from '../services/api';

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    documents: [],
    stats: {},
    selectedCategoryId: sessionStorage.getItem('selectedCategoryId') || null,
    selectedCategoryDepartmentId: sessionStorage.getItem('selectedCategoryDepartmentId') || null,
    isLoading: false,
    error: null
  }),

  actions: {
    selectCategoryContext(categoryId, departmentId) {
      this.selectedCategoryId = categoryId;
      this.selectedCategoryDepartmentId = departmentId || 'global';
      
      if (categoryId) sessionStorage.setItem('selectedCategoryId', categoryId);
      else sessionStorage.removeItem('selectedCategoryId');
      
      if (departmentId) sessionStorage.setItem('selectedCategoryDepartmentId', departmentId || 'global');
      else sessionStorage.removeItem('selectedCategoryDepartmentId');
    },

    clearCategoryContext() {
      this.selectedCategoryId = null;
      this.selectedCategoryDepartmentId = null;
      sessionStorage.removeItem('selectedCategoryId');
      sessionStorage.removeItem('selectedCategoryDepartmentId');
    },

    async fetchDocuments() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/documents');
        if (data.success) {
          this.documents = data.documents;
        }
      } catch (err) {
        console.error('Error cargando documentos:', err);
        this.error = 'Error cargando documentos';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchStats() {
      try {
        const { data } = await api.get('/stats');
        if (data.success) {
          this.stats = data.stats;
        }
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      }
    },

    async fetchAll() {
      await Promise.all([this.fetchDocuments(), this.fetchStats()]);
    }
  }
});
