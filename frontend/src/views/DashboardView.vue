<template>
  <div class="admin-layout">
    <aside class="admin-sidebar glass-card desktop-only-sidebar">
      <div class="sidebar-user" v-if="user">
        <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ user.name }}</div>
          <div class="sidebar-user-email">{{ user.email }}</div>
          <span :class="['user-role-badge', roleBadgeClass]">{{ roleLabel }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Principal</div>
        
        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/overview') }]"
          @click="navigate('/dashboard/overview')"
        >
          <i class="fa-solid fa-chart-pie"></i>
          <span>Resumen Dashboard</span>
        </button>

        <button 
          v-if="canReadDocuments"
          :class="['nav-item', { active: isTabActive('/dashboard/documents') }]"
          @click="navigate('/dashboard/documents')"
        >
          <i class="fa-solid fa-folder-closed"></i>
          <span>Gestor de Documentos</span>
          <span class="badge-count">{{ documentStore.documents.length }}</span>
        </button>

        <div class="nav-section-title" v-if="canReadDepartments || canReadUsers || canReadRoles">Administración</div>

        <button 
          v-if="canReadDepartments"
          :class="['nav-item', { active: isTabActive('/dashboard/departments') }]"
          @click="navigate('/dashboard/departments')"
        >
          <i class="fa-solid fa-building"></i>
          <span>Departamentos</span>
        </button>

        <button 
          v-if="canReadUsers"
          :class="['nav-item', { active: isTabActive('/dashboard/users') }]"
          @click="navigate('/dashboard/users')"
        >
          <i class="fa-solid fa-users"></i>
          <span>Usuarios</span>
        </button>

        <button 
          v-if="canReadRoles"
          :class="['nav-item', { active: isTabActive('/dashboard/roles') }]"
          @click="navigate('/dashboard/roles')"
        >
          <i class="fa-solid fa-user-gear"></i>
          <span>Roles y Permisos</span>
        </button>

        <button 
          :class="['nav-item', { active: isTabActive('/dashboard/profile') }]"
          @click="navigate('/dashboard/profile')"
        >
          <i class="fa-solid fa-circle-user"></i>
          <span>Mi Perfil</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-full" @click="handleLogout">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Cerrar Sesión</span>
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
const userRole = computed(() => user.value?.role || 'operator');

const canReadDocuments = computed(() => authStore.hasPermission('templates:read'));
const canReadUsers = computed(() => authStore.hasPermission('users:read'));
const canReadRoles = computed(() => authStore.hasPermission('roles:read'));
const canReadDepartments = computed(() => authStore.hasPermission('departments:read'));

const roleLabel = computed(() => {
  switch (userRole.value) {
    case 'admin_sgc': return 'Administrador';
    case 'leader': return 'Líder de Área';
    case 'auditor': return 'Auditor';
    default: return 'Operativo';
  }
});

const roleBadgeClass = computed(() => {
  switch (userRole.value) {
    case 'admin_sgc': return 'badge-admin';
    case 'leader': return 'badge-leader';
    case 'auditor': return 'badge-auditor';
    default: return 'badge-operator';
  }
});

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

onMounted(async () => {
  await authStore.fetchCurrentUser();
  if (canReadDocuments.value) {
    documentStore.fetchAll();
  }
  if (canReadUsers.value) {
    userStore.fetchUsers();
  }
  if (canReadRoles.value) {
    roleStore.fetchRoles();
  }
});
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 16px;
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
  max-width: 180px;
  white-space: nowrap;
}

.user-role-badge {
  display: inline-block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-admin { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
.badge-leader { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.badge-auditor { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.badge-operator { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 14px 4px 14px;
  margin-top: 4px;
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
  width: 100%;
}

.sidebar-footer .btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  font-weight: 600;
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
