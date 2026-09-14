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

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 16px;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 14px;
}

.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary);
}

.sidebar-user-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-main);
  line-height: 1.2;
}

.sidebar-user-email {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  white-space: nowrap;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-body);
  font-family: var(--font-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
}

.nav-item i {
  font-size: 15px;
  color: var(--text-muted);
  width: 18px;
  text-align: center;
}

.nav-item:hover {
  background: rgba(30, 58, 138, 0.06);
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary-gradient);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.nav-item.active i {
  color: #ffffff;
}

.badge-count {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
}

.badge-count.light {
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.sidebar-footer {
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.admin-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

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

.profile-tab-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 16px 12px 32px 12px;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .desktop-only-sidebar {
    display: none !important;
  }
  .admin-layout {
    grid-template-columns: 1fr !important;
  }
}
</style>
