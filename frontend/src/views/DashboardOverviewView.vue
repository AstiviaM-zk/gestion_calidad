<template>
  <div class="dashboard-content">
    <div class="page-title-box">
      <h2 class="page-title">Bienvenido, {{ authStore.user?.name || 'Usuario' }}</h2>
      <p class="page-subtitle">Este es el panel principal de control del sistema de gestión de documentos.</p>
    </div>

    <div class="summary-cards">
      <!-- Shortcut to Departamentos -->
      <div class="summary-card" @click="router.push('/dashboard/departments')">
        <div class="card-icon dept-icon">
          <i class="fa-solid fa-building"></i>
        </div>
        <div class="card-info">
          <h3>Departamentos</h3>
          <p>Explorar áreas y documentos</p>
        </div>
      </div>

      <!-- Shortcut to Usuarios (only if have permission) -->
      <div v-if="authStore.hasPermission('users:read')" class="summary-card" @click="router.push('/dashboard/users')">
        <div class="card-icon user-icon">
          <i class="fa-solid fa-users"></i>
        </div>
        <div class="card-info">
          <h3>Usuarios</h3>
          <p>Gestionar cuentas y accesos</p>
        </div>
      </div>

      <!-- Shortcut to Roles (only if have permission) -->
      <div v-if="authStore.hasPermission('roles:read')" class="summary-card" @click="router.push('/dashboard/roles')">
        <div class="card-icon role-icon">
          <i class="fa-solid fa-user-gear"></i>
        </div>
        <div class="card-info">
          <h3>Roles y Permisos</h3>
          <p>Configurar seguridad</p>
        </div>
      </div>

      <!-- Shortcut to Documents -->
      <div v-if="authStore.hasPermission('documents:read')" class="summary-card" @click="router.push('/dashboard/documents')">
        <div class="card-icon doc-icon">
          <i class="fa-solid fa-folder-closed"></i>
        </div>
        <div class="card-info">
          <h3>Documentos</h3>
          <p>Archivos y evidencias</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
</script>

<style scoped>
.dashboard-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-title-box {
  margin-bottom: 32px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.3px;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
}

.dept-icon {
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary);
}

.user-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.role-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.doc-icon {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.card-info h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
}

.card-info p {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}
</style>
