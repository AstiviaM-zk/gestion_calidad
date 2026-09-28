<template>
  <div class="department-manager-container">
    <div class="panel-section glass-card shadow-sm">
      <div class="section-header">
        <div>
          <div class="title-with-badge">
            <h3 class="section-title"><i class="fa-solid fa-building"></i> Departamentos (Catálogo)</h3>
            <span class="dept-count-badge">
              <i class="fa-solid fa-layer-group"></i> {{ filteredDepartments.length }} {{ filteredDepartments.length === 1 ? 'departamento' : 'departamentos' }}
            </span>
          </div>
          <p class="section-subtitle">Administra la lista de departamentos de la organización</p>
        </div>
        
        <div class="header-actions">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por título o código..." 
              class="search-input"
            />
            <button 
              v-if="searchQuery" 
              type="button" 
              class="clear-search-btn" 
              @click="searchQuery = ''"
              title="Limpiar búsqueda"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <button v-if="canManage" class="btn btn-primary btn-sm" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i> Nuevo Departamento
          </button>
        </div>
      </div>

      <div class="departments-grid" v-if="filteredDepartments.length > 0">
        <div v-for="dept in filteredDepartments" :key="dept.id" class="dept-card" @click="openDetailsModal(dept)">
          <div class="dept-card-header">
            <div class="dept-icon-wrapper" :class="{ 'inactive': !dept.status }">
              <i :class="dept.icon || 'fa-solid fa-building'"></i>
            </div>
            <div class="dept-actions" v-if="canManage">
              <button type="button" class="icon-btn edit-btn" @click.stop="openEditModal(dept)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="icon-btn delete-btn" @click.stop="confirmDelete(dept)" title="Eliminar">
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
            <span v-if="dept.status" class="badge-active">Activo</span>
            <span v-else class="badge-inactive">Inactivo</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fa-solid fa-building-circle-xmark empty-icon" v-if="!searchQuery"></i>
        <i class="fa-solid fa-magnifying-glass empty-icon" v-else></i>
        <p v-if="!searchQuery">No hay departamentos registrados.</p>
        <p v-else>No se encontraron departamentos con la búsqueda "{{ searchQuery }}".</p>
      </div>
    </div>

    <!-- Modal de Detalles -->
    <DepartmentDetailsModal 
      v-model="showDetailsModal" 
      :department="selectedDept" 
      @edit="openEditModal" 
    />

    <!-- Modal Formulario (Crear/Editar) -->
    <DepartmentModal v-model="showModal" :initialData="form" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../utils/toast';
import DepartmentModal from './DepartmentModal.vue';
import DepartmentDetailsModal from './DepartmentDetailsModal.vue';

const userStore = useUserStore();
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasPermission('departments:update') || authStore.hasPermission('departments:create') || authStore.user?.role === 'admin_sgc');
const departments = computed(() => userStore.departments);

const showModal = ref(false);
const showDetailsModal = ref(false);
const selectedDept = ref(null);
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

function openDetailsModal(dept) {
  selectedDept.value = dept;
  showDetailsModal.value = true;
}

function openEditModal(dept) {
  form.value = { id: dept.id, title: dept.title, code: dept.code || '', description: dept.description || '', icon: dept.icon || '', status: dept.status !== false };
  showModal.value = true;
}

async function confirmDelete(dept) {
  if (!confirm(`¿Estás seguro de eliminar el departamento "${dept.title}"? Esta acción no se puede deshacer y fallará si hay usuarios asignados a él.`)) return;

  const res = await userStore.deleteDepartment(dept.id);
  if (res.success) {
    showToast.success('Departamento eliminado exitosamente');
  } else {
    showToast.error(res.message || 'Error al eliminar el departamento');
  }
}
</script>

<style scoped>
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
  padding: 8px 34px;
  font-size: 13px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 10px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: var(--primary, #1e3a8a);
  background: #f1f5f9;
}

.department-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.badge-code {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

.badge-active {
  background: #75ba21;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.badge-inactive {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-btn { color: var(--primary, #1e3a8a); }
.edit-btn:hover { background: rgba(30, 58, 138, 0.08); color: #0f172a; }

.delete-btn { color: #ef4444; }
.delete-btn:hover { background: #fef2f2; color: #dc2626; }

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 16px 0;
}

.dept-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
  cursor: pointer;
}

.dept-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.dept-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dept-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.dept-icon-wrapper.inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.dept-actions {
  display: flex;
  gap: 8px;
}

.dept-card-body {
  flex-grow: 1;
  margin-bottom: 16px;
}

.dept-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dept-description {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
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

.empty-state {
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 16px;
}
</style>
