<template>
  <div class="admin-layout">
    <aside class="admin-sidebar glass-card">
      <div class="sidebar-user">
        <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ user.name }}</div>
          <div class="sidebar-user-email">{{ user.email }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          :class="['nav-item', { active: activeTab === 'overview' }]"
          @click="activeTab = 'overview'"
        >
          <i class="fa-solid fa-chart-pie"></i>
          <span>Resumen Dashboard</span>
        </button>

        <button 
          :class="['nav-item', { active: activeTab === 'documents' }]"
          @click="activeTab = 'documents'"
        >
          <i class="fa-solid fa-folder-closed"></i>
          <span>Gestor de Documentos</span>
          <span class="badge-count">{{ documents.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          <i class="fa-solid fa-users"></i>
          <span>Usuarios</span>
          <span class="badge-count light">{{ users.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: activeTab === 'roles' }]"
          @click="activeTab = 'roles'"
        >
          <i class="fa-solid fa-user-gear"></i>
          <span>Roles y Permisos</span>
          <span class="badge-count light">{{ roles.length || 3 }}</span>
        </button>

        <button 
          :class="['nav-item', { active: activeTab === 'profile' }]"
          @click="activeTab = 'profile'"
        >
          <i class="fa-solid fa-circle-user"></i>
          <span>Mi Perfil & Token</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-sm" @click="emit('logout')">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <div v-if="activeTab === 'overview'" class="dashboard-content">
        <div class="page-title-box">
          <h2 class="page-title">Panel de Control de Calidad (QMS)</h2>
          <p class="page-subtitle">Bienvenido de nuevo, {{ user.givenName || user.name }}. Aquí está el estado actual del sistema.</p>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-blue">
              <i class="fa-solid fa-files"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Documentos</span>
              <span class="kpi-value">{{ stats.totalDocuments || documents.length }}</span>
              <span class="kpi-subtext text-emerald"><i class="fa-solid fa-arrow-up"></i> +4 este mes</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-amber">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Revisiones Pendientes</span>
              <span class="kpi-value">{{ stats.pendingReviews || 3 }}</span>
              <span class="kpi-subtext text-amber"><i class="fa-solid fa-triangle-exclamation"></i> Requiere atención</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-emerald">
              <i class="fa-solid fa-shield-check"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Cumplimiento ISO 9001</span>
              <span class="kpi-value">{{ stats.qualityComplianceRate || '98.5%' }}</span>
              <span class="kpi-subtext text-emerald"><i class="fa-solid fa-circle-check"></i> Auditoría aprobada</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-purple">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Usuarios Autenticados</span>
              <span class="kpi-value">{{ users.length }}</span>
              <span class="kpi-subtext text-purple"><i class="fa-solid fa-user-check"></i> Google OAuth</span>
            </div>
          </div>
        </div>

        <DocumentManager :documents="documents" />
      </div>

      <div v-else-if="activeTab === 'documents'">
        <DocumentManager :documents="documents" />
      </div>

      <div v-else-if="activeTab === 'users'">
        <UserList :users="users" :roles="roles" @user-updated="emit('reload-data')" />
      </div>

      <div v-else-if="activeTab === 'roles'">
        <RoleManager :roles="roles" :users="users" @role-created="emit('reload-data')" />
      </div>

      <div v-else-if="activeTab === 'profile'" class="profile-tab-wrapper">
        <UserProfile :user="user" :token="token" @logout="emit('logout')" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DocumentManager from './DocumentManager.vue';
import UserList from './UserList.vue';
import RoleManager from './RoleManager.vue';
import UserProfile from './UserProfile.vue';

const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, default: '' },
  stats: { type: Object, default: () => ({}) },
  documents: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] }
});

const emit = defineEmits(['logout', 'reload-data']);
const activeTab = ref('overview');

const userAvatar = computed(() => {
  return props.user?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(props.user?.name || 'User') + '&background=1e3a8a&color=fff';
});

function onAvatarError(e) {
  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(props.user?.name || 'User') + '&background=1e3a8a&color=fff';
}
</script>