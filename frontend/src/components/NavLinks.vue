<template>
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
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useDocumentStore } from '../stores/documents';

const emit = defineEmits(['navigate']);
const route = useRoute();
const authStore = useAuthStore();
const documentStore = useDocumentStore();

const canReadDocuments = computed(() => authStore.hasPermission('templates:read'));
const canReadUsers = computed(() => authStore.hasPermission('users:read'));
const canReadRoles = computed(() => authStore.hasPermission('roles:read'));
const canReadDepartments = computed(() => authStore.hasPermission('departments:read'));

const documentsCount = computed(() => documentStore.documents.length);

function isTabActive(path) {
  return route.path === path;
}

function navigate(path) {
  emit('navigate', path);
}
</script>

<style scoped>
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
  width: 100%;
}

.nav-item i {
  font-size: 16px;
  color: var(--text-muted);
  width: 20px;
  text-align: center;
}

.nav-item:hover {
  background: rgba(2, 132, 199, 0.08);
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

.nav-item.active i {
  color: #ffffff;
}

</style>
