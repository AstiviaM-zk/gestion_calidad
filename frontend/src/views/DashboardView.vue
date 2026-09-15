<template>
  <div class="admin-layout">
    <aside class="admin-sidebar glass-card desktop-only-sidebar">
      <div class="sidebar-user" v-if="user">
        <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ user.name }}</div>
          <div class="sidebar-user-email">{{ user.email }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/overview') }]"
          @click="navigate('/dashboard/overview')"
        >
          <i class="fa-solid fa-chart-pie"></i>
          <span>Resumen Dashboard</span>
        </button>

        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/documents') }]"
          @click="navigate('/dashboard/documents')"
        >
          <i class="fa-solid fa-folder-closed"></i>
          <span>Gestor de Documentos</span>
          <span class="badge-count">{{ documentStore.documents.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/users') }]"
          @click="navigate('/dashboard/users')"
        >
          <i class="fa-solid fa-users"></i>
          <span>Usuarios</span>
          <span class="badge-count light">{{ userStore.users.length }}</span>
        </button>

        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/roles') }]"
          @click="navigate('/dashboard/roles')"
        >
          <i class="fa-solid fa-user-gear"></i>
          <span>Roles y Permisos</span>
          <span class="badge-count light">{{ roleStore.roles.length || 3 }}</span>
        </button>

        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/profile') }]"
          @click="navigate('/dashboard/profile')"
        >
          <i class="fa-solid fa-circle-user"></i>
          <span>Mi Perfil & Token</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-sm" @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useDocumentStore } from '../stores/documents';
import { useUserStore } from '../stores/users';
import { useRoleStore } from '../stores/roles';

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const documentStore = useDocumentStore();
const userStore = useUserStore();
const roleStore = useRoleStore();

const user = computed(() => authStore.user);

const userAvatar = computed(() => {
  return user.value?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.value?.name || 'User') + '&background=1e3a8a&color=fff';
});

function isTabActive(path) {
  return route.path === path;
}

function navigate(path) {
  router.push(path);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function onAvatarError(e) {
  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.value?.name || 'User') + '&background=1e3a8a&color=fff';
}

onMounted(() => {
  documentStore.fetchAll();
  userStore.fetchUsers();
  roleStore.fetchRoles();
});
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

@media (max-width: 900px) {
  .desktop-only-sidebar {
    display: none !important;
  }
  .admin-layout {
    grid-template-columns: 1fr !important;
  }
}
</style>
