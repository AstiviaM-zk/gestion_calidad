<template>
  <div class="department-manager-container">
    <div class="breadcrumb">
      <router-link to="/dashboard/overview" class="breadcrumb-link"><i class="fa-solid fa-house"></i> Inicio</router-link>
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current">Departamentos</span>
    </div>
    <div class="department-content-wrapper">
      <div class="section-header">
        <div>
          <div class="title-with-badge">
            <h3 class="section-title"><i class="fa-solid fa-building-user"></i> Gestión de Departamentos</h3>
            <span class="dept-count-badge">
              <i class="fa-solid fa-layer-group"></i> {{ filteredDepartments.length }}
            </span>
          </div>
          <p class="section-subtitle">Selecciona un departamento para explorar o administrarlos si tienes permisos.</p>
        </div>
        
        <div class="header-actions">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar..." 
              class="search-input"
            />
          </div>
          
          <button v-if="canManage" class="btn btn-primary btn-sm" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i> Nuevo
          </button>
        </div>
      </div>

      <!-- Skeleton Loader -->
      <div class="departments-grid" v-if="userStore.isLoadingDepartments">
        <div v-for="i in 6" :key="i" class="dept-card skeleton-card">
          <div class="dept-card-header">
            <div class="skeleton-icon"></div>
          </div>
          <div class="dept-card-body">
            <div class="skeleton-title"></div>
            <div class="skeleton-desc line-1"></div>
            <div class="skeleton-desc line-2"></div>
          </div>
          <div class="dept-card-footer">
            <div class="skeleton-badge"></div>
            <div class="skeleton-badge-status"></div>
          </div>
        </div>
      </div>

      <div class="departments-grid" v-else-if="filteredDepartments.length > 0">
        <div 
          v-for="dept in filteredDepartments" 
          :key="dept.id" 
          class="dept-card" 
          :class="{ 'inactive-card': !dept.status }" 
          @click="openDepartment(dept)"
        >
          <div class="dept-card-header">
            <div class="dept-icon-wrapper" :class="{ 'inactive': !dept.status }">
              <i :class="dept.icon || 'fa-solid fa-building'"></i>
            </div>
            
            <div v-if="canManage" class="card-actions" @click.stop>
              <button type="button" class="icon-btn edit-btn" @click="openEditModal(dept)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="icon-btn delete-btn" v-if="dept.status === true" @click="confirmDelete(dept)" title="Inhabilitar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="dept-card-body">
            <h4 class="dept-title">{{ dept.title }}</h4>
            <p class="dept-description" v-if="dept.description">{{ dept.description }}</p>
            <p class="dept-description empty-desc" v-else>Sin descripción</p>
          </div>
          
          <div class="dept-card-footer">
            <span class="badge-code" v-if="dept.code">{{ dept.code }}</span>
            <span v-else></span>
            <span v-if="dept.status === true" class="badge-active">Activo</span>
            <span v-else class="badge-inactive">Inactivo</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fa-solid fa-building-circle-xmark empty-icon" v-if="!searchQuery"></i>
        <i class="fa-solid fa-magnifying-glass empty-icon" v-else></i>
        <p v-if="!searchQuery">No hay departamentos disponibles.</p>
        <p v-else>No se encontraron departamentos con la búsqueda "{{ searchQuery }}".</p>
      </div>
    </div>

    <!-- Modal Formulario (Crear/Editar) -->
    <DepartmentModal v-model="showModal" :initialData="form" />

    <!-- Confirm Modal for Deletion -->
    <ConfirmModal 
      v-model="showConfirmModal"
      title="Inhabilitar Departamento"
      :message="confirmMessage"
      type="danger"
      confirmText="Inhabilitar"
      :isLoading="isDeleting"
      @confirm="proceedDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../utils/toast';
import DepartmentModal from './DepartmentModal.vue';
import ConfirmModal from '../ConfirmModal.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasPermission('departments:update') || authStore.hasPermission('departments:create') || authStore.user?.role === 'admin_sgc');
const departments = computed(() => userStore.departments);

const showModal = ref(false);
const showConfirmModal = ref(false);
const deptToDelete = ref(null);
const isDeleting = ref(false);
const confirmMessage = ref('');
const form = ref({ id: null, title: '', code: '', description: '', icon: '', status: true });
const searchQuery = ref('');

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return departments.value;
  const lowerQ = searchQuery.value.toLowerCase();
  return departments.value.filter(d => 
    (d.title && d.title.toLowerCase().includes(lowerQ)) || 
    (d.code && d.code.toLowerCase().includes(lowerQ))
  );
});

onMounted(() => {
  if (departments.value.length === 0) {
    userStore.fetchDepartments();
  }
});

function openDepartment(dept) {
  if (!dept.status) return;
  userStore.selectDepartment(dept.id);
  router.push('/dashboard/department-categories');
}

function openCreateModal() {
  form.value = { id: null, title: '', code: '', description: '', icon: '', status: true };
  showModal.value = true;
}

function openEditModal(dept) {
  form.value = { id: dept.id, title: dept.title, code: dept.code || '', description: dept.description || '', icon: dept.icon || '', status: dept.status !== false };
  showModal.value = true;
}

function confirmDelete(dept) {
  deptToDelete.value = dept;
  confirmMessage.value = `¿Estás seguro de inhabilitar el departamento "${dept.title}"?`;
  showConfirmModal.value = true;
}

async function proceedDelete() {
  if (!deptToDelete.value) return;

  const usersInDept = userStore.users.filter(u => u.departmentId === deptToDelete.value.id);
  if (usersInDept.length > 0) {
    showToast.error(`No es posible inhabilitar departamentos que aún tienen usuarios asociados (${usersInDept.length} usuarios).`);
    showConfirmModal.value = false;
    return;
  }

  isDeleting.value = true;
  const res = await userStore.deleteDepartment(deptToDelete.value.id);
  isDeleting.value = false;

  if (res.success) {
    showToast.success('Departamento inhabilitado exitosamente');
    showConfirmModal.value = false;
  } else {
    showToast.error(res.message || 'Error al inhabilitar el departamento');
    showConfirmModal.value = false;
  }
}
</script>

<style scoped>
.department-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.department-content-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; 
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.dept-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  border: 1px solid rgba(30, 58, 138, 0.18);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 13px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  font-size: 13px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.dept-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.dept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--primary);
}

.inactive-card {
  background: #f8fafc;
  border-color: #e2e8f0;
  opacity: 0.7;
  cursor: not-allowed;
}

.inactive-card:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.dept-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dept-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.dept-icon-wrapper.inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.edit-btn {
  color: var(--primary, #1e3a8a);
}
.edit-btn:hover {
  background: rgba(30, 58, 138, 0.08);
}

.delete-btn {
  color: #ef4444;
}
.delete-btn:hover {
  background: #fef2f2;
}

.dept-card-body {
  flex-grow: 1;
  margin-bottom: 20px;
}

.dept-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dept-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-desc {
  font-style: italic;
  opacity: 0.7;
}

.dept-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.badge-code {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.badge-active {
  background: #75ba21;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-inactive {
  background: #fee2e2;
  color: #991b1b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  flex: 1;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  overflow-y: auto;
}

.empty-icon {
  font-size: 64px;
  color: #cbd5e1;
  margin-bottom: 20px;
}

/* Skeleton Loader */
.skeleton-card {
  pointer-events: none;
}

.skeleton-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-title {
  height: 20px;
  width: 70%;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-desc {
  height: 12px;
  background: #f1f5f9;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-desc.line-1 { width: 100%; }
.skeleton-desc.line-2 { width: 85%; }

.skeleton-badge, .skeleton-badge-status {
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-badge { width: 50px; }
.skeleton-badge-status { width: 60px; }

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}
</style>
