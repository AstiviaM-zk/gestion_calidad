<template>
  <div class="admin-layout">
    <aside class="admin-sidebar glass-card desktop-only-sidebar">
      <div class="sidebar-user">
        <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ user.name }}</div>
          <div class="sidebar-user-email">{{ user.email }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          :class="['nav-item', { active: currentTab === 'overview' }]"
          @click="setTab('overview')"
        >
          <i class="fa-solid fa-chart-pie"></i>
          <span>Resumen Dashboard</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'documents' }]"
          @click="setTab('documents')"
        >
          <i class="fa-solid fa-folder-closed"></i>
          <span>Gestor de Documentos</span>
          <span class="badge-count">{{ documents.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'users' }]"
          @click="setTab('users')"
        >
          <i class="fa-solid fa-users"></i>
          <span>Usuarios</span>
          <span class="badge-count light">{{ users.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'roles' }]"
          @click="setTab('roles')"
        >
          <i class="fa-solid fa-user-gear"></i>
          <span>Roles y Permisos</span>
          <span class="badge-count light">{{ roles.length || 3 }}</span>
        </button>

        <button 
          :class="['nav-item', { active: currentTab === 'profile' }]"
          @click="setTab('profile')"
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
      <div v-if="currentTab === 'overview'" class="dashboard-content">
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

      <div v-else-if="currentTab === 'documents'">
        <DocumentManager :documents="documents" />
      </div>

      <div v-else-if="currentTab === 'users'">
        <UserList :users="users" :roles="roles" @user-updated="emit('reload-data')" />
      </div>

      <div v-else-if="currentTab === 'roles'">
        <RoleManager :roles="roles" :users="users" @role-created="emit('reload-data')" />
      </div>

      <div v-else-if="currentTab === 'profile'" class="profile-tab-wrapper">
        <UserProfile :user="user" :token="token" @logout="emit('logout')" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import DocumentManager from '../components/DocumentManager.vue';
import UserList from '../components/UserList.vue';
import RoleManager from '../components/RoleManager.vue';
import UserProfile from '../components/UserProfile.vue';

const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, default: '' },
  stats: { type: Object, default: () => ({}) },
  documents: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] },
  activeTab: { type: String, default: 'overview' }
});

const emit = defineEmits(['logout', 'reload-data', 'change-tab']);
const currentTab = ref(props.activeTab);

watch(() => props.activeTab, (newTab) => {
  if (newTab) currentTab.value = newTab;
});

function setTab(tab) {
  currentTab.value = tab;
  emit('change-tab', tab);
}

const userAvatar = computed(() => {
  return props.user?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(props.user?.name || 'User') + '&background=1e3a8a&color=fff';
});

function onAvatarError(e) {
  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(props.user?.name || 'User') + '&background=1e3a8a&color=fff';
}
</script>
