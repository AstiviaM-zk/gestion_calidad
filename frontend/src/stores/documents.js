import { defineStore } from 'pinia';
import api from '../services/api';

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    documents: [],
    stats: {},
    isLoading: false,
    error: null
  }),

  actions: {
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
