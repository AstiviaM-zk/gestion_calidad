<template>
  <div class="dashboard-content">
    <div class="page-title-box">
      <h2 class="page-title">Panel de Control de Calidad (QMS)</h2>
      <p class="page-subtitle">Bienvenido de nuevo, {{ userName }}. Aquí está el estado actual del sistema.</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card shadow-card">
        <div class="kpi-icon icon-blue">
          <i class="fa-solid fa-files"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Total Documentos</span>
          <span class="kpi-value">{{ documentStore.stats.totalDocuments || documentStore.documents.length }}</span>
          <span class="kpi-subtext text-emerald"><i class="fa-solid fa-arrow-up"></i> +4 este mes</span>
        </div>
      </div>

      <div class="kpi-card shadow-card">
        <div class="kpi-icon icon-amber">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Revisiones Pendientes</span>
          <span class="kpi-value">{{ documentStore.stats.pendingReviews || 3 }}</span>
          <span class="kpi-subtext text-amber"><i class="fa-solid fa-triangle-exclamation"></i> Requiere atención</span>
        </div>
      </div>

      <div class="kpi-card shadow-card">
        <div class="kpi-icon icon-emerald">
          <i class="fa-solid fa-shield-check"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Cumplimiento ISO 9001</span>
          <span class="kpi-value">{{ documentStore.stats.qualityComplianceRate || '98.5%' }}</span>
          <span class="kpi-subtext text-emerald"><i class="fa-solid fa-circle-check"></i> Auditoría aprobada</span>
        </div>
      </div>

      <div v-if="authStore.hasRole('admin_sgc')" class="kpi-card shadow-card">
        <div class="kpi-icon icon-purple">
          <i class="fa-solid fa-users"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Usuarios Registrados</span>
          <span class="kpi-value">{{ userStore.users.length }}</span>
          <span class="kpi-subtext text-purple"><i class="fa-solid fa-user-check"></i> Gestión de Acceso</span>
        </div>
      </div>

      <div v-else class="kpi-card shadow-card">
        <div class="kpi-icon icon-purple">
          <i class="fa-solid fa-id-card"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">Nivel de Acceso</span>
          <span class="kpi-value">{{ roleLabel }}</span>
          <span class="kpi-subtext text-purple"><i class="fa-solid fa-shield-halved"></i> Rol Asignado</span>
        </div>
      </div>
    </div>

    <DocumentManager />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useDocumentStore } from '../stores/documents';
import { useUserStore } from '../stores/users';
import DocumentManager from '../components/DocumentManager.vue';

const authStore = useAuthStore();
const documentStore = useDocumentStore();
const userStore = useUserStore();

const userName = computed(() => {
  return authStore.user?.givenName || authStore.user?.name || 'Usuario';
});

const roleLabel = computed(() => {
  switch (authStore.userRole) {
    case 'admin_sgc': return 'Administrador';
    case 'leader': return 'Líder de Área';
    case 'auditor': return 'Auditor';
    default: return 'Operativo';
  }
});

onMounted(() => {
  documentStore.fetchAll();
  if (authStore.hasRole('admin_sgc')) {
    userStore.fetchUsers();
  }
});
</script>

<style scoped>
.dashboard-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.page-title-box {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.3px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: var(--transition);
}

.kpi-card:hover {
  border-color: var(--border-glow);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.icon-blue { background: #e0e7ff; color: #1e3a8a; }
.icon-amber { background: #fffbeb; color: #b45309; }
.icon-emerald { background: rgba(117, 186, 33, 0.14); color: #75ba21; }
.icon-purple { background: #f0f9ff; color: #0284c7; }

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.1;
  margin: 1px 0;
}

.kpi-subtext {
  font-size: 10px;
  font-weight: 600;
}
</style>
