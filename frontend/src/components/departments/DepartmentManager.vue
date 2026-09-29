<template>
  <div class="department-manager-container">
    <div class="panel-section glass-card shadow-sm">
      <div class="section-header">
        <div>
          <div class="title-with-badge">
            <h3 class="section-title"><i class="fa-solid fa-building-user"></i> Gestión de Departamentos</h3>
            <span class="dept-count-badge">
              <i class="fa-solid fa-layer-group"></i> {{ filteredDepartments.length }}
            </span>
          </div>
          <p class="section-subtitle">Administra los departamentos y áreas de la organización</p>
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

      <div class="table-responsive">
        <table class="qms-table">
          <thead>
            <tr>
              <th>Departamento</th>
              <th>Código</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th v-if="canManage" class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody v-if="filteredDepartments.length > 0">
            <tr v-for="dept in filteredDepartments" :key="dept.id" :class="{'inactive-row': !dept.status}">
              <td>
                <div class="dept-info-cell">
                  <div class="dept-icon-mini" :class="{ 'inactive': !dept.status }">
                    <i :class="dept.icon || 'fa-solid fa-building'"></i>
                  </div>
                  <span class="dept-name">{{ dept.title }}</span>
                </div>
              </td>
              <td>
                <span class="badge-code" v-if="dept.code">{{ dept.code }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="desc-cell">
                <span v-if="dept.description" class="truncate-text" :title="dept.description">{{ dept.description }}</span>
                <span v-else class="text-muted italic">Sin descripción</span>
              </td>
              <td>
                <span v-if="dept.status === true" class="status-badge active">Activo</span>
                <span v-else class="status-badge inactive">Inactivo</span>
              </td>
              <td v-if="canManage" class="actions-cell">
                <button type="button" class="icon-btn edit-btn" @click="openEditModal(dept)" title="Editar">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="icon-btn delete-btn" v-if="dept.status === true" @click="confirmDelete(dept)" title="Inhabilitar">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="canManage ? 5 : 4" class="empty-cell">
                <div class="empty-state-mini">
                  <i class="fa-solid fa-building-circle-xmark"></i>
                  <p>No se encontraron departamentos.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../utils/toast';
import DepartmentModal from './DepartmentModal.vue';
import ConfirmModal from '../ConfirmModal.vue';

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

.panel-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* needed for flex children to shrink */
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

.table-responsive {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-light, #e2e8f0);
}

.qms-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.qms-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  background: #fff;
}

.qms-table th {
  background: #f8fafc;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-light, #e2e8f0);
}

.qms-table td {
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  color: var(--text-main, #1e293b);
  vertical-align: middle;
}

.qms-table tr:hover {
  background-color: #f8fafc;
}

.inactive-row {
  background-color: #fcfcfc;
}
.inactive-row td {
  color: var(--text-muted, #94a3b8);
}

.dept-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dept-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.dept-icon-mini.inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.dept-name {
  font-weight: 600;
}

.badge-code {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}

.desc-cell {
  max-width: 300px;
}

.truncate-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #64748b;
  font-size: 13px;
}

.italic {
  font-style: italic;
}

.text-muted {
  color: #94a3b8;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-badge.inactive {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.actions-col {
  width: 100px;
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
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

.empty-cell {
  padding: 40px !important;
}

.empty-state-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 12px;
}

.empty-state-mini i {
  font-size: 32px;
  color: #cbd5e1;
}
</style>
