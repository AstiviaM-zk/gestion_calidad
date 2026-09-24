<template>
  <div class="department-manager-container">
    <div class="panel-section glass-card shadow-sm">
      <div class="section-header">
        <div>
          <h3 class="section-title"><i class="fa-solid fa-building"></i> Departamentos (Catálogo)</h3>
          <p class="section-subtitle">Administra la lista de departamentos de la organización</p>
        </div>
        <button v-if="canManage" class="btn btn-primary btn-sm" @click="openCreateModal">
          <i class="fa-solid fa-plus"></i> Nuevo Departamento
        </button>
      </div>

      <div class="table-responsive">
        <table class="qms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre del Departamento</th>
              <th>Código / Clave</th>
              <th v-if="canManage">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in departments" :key="dept.id" class="table-row">
              <td>{{ dept.id }}</td>
              <td class="font-bold">{{ dept.name }}</td>
              <td>
                <span class="badge-code" v-if="dept.code">{{ dept.code }}</span>
                <span class="text-subtle text-xs" v-else>N/A</span>
              </td>
              <td v-if="canManage">
                <div class="action-buttons">
                  <button type="button" class="icon-btn edit-btn" @click="openEditModal(dept)" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button type="button" class="icon-btn delete-btn" @click="confirmDelete(dept)" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="departments.length === 0">
              <td :colspan="canManage ? 4 : 3" class="text-center empty-state">
                <i class="fa-solid fa-building-circle-xmark empty-icon"></i>
                <p>No hay departamentos registrados.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-card shadow-lg glass-card">
          <div class="modal-header">
            <h4 class="modal-title">
              <i :class="isEditing ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus'"></i> 
              {{ isEditing ? 'Editar Departamento' : 'Nuevo Departamento' }}
            </h4>
            <button type="button" class="icon-btn" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form @submit.prevent="saveDepartment">
            <div class="modal-body">
              <div class="edit-form-group">
                <label class="edit-label">Nombre del Departamento *</label>
                <input type="text" v-model="form.name" class="edit-input" placeholder="Ej. Recursos Humanos" required>
              </div>
              <div class="edit-form-group">
                <label class="edit-label">Código / Clave (Opcional)</label>
                <input type="text" v-model="form.code" class="edit-input" placeholder="Ej. RRHH">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary btn-sm" :disabled="isSaving">
                <i v-if="isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else class="fa-solid fa-save"></i> 
                {{ isEditing ? 'Guardar Cambios' : 'Crear Departamento' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../utils/toast';

const userStore = useUserStore();
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasPermission('departments:update') || authStore.hasPermission('departments:create') || authStore.user?.role === 'admin_sgc');
const departments = computed(() => userStore.departments);

const showModal = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const form = ref({ id: null, name: '', code: '' });

onMounted(() => {
  if (departments.value.length === 0) {
    userStore.fetchDepartments();
  }
});

function openCreateModal() {
  form.value = { id: null, name: '', code: '' };
  isEditing.value = false;
  showModal.value = true;
}

function openEditModal(dept) {
  form.value = { id: dept.id, name: dept.name, code: dept.code || '' };
  isEditing.value = true;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  form.value = { id: null, name: '', code: '' };
}

async function saveDepartment() {
  if (!form.value.name.trim()) {
    showToast.error('El nombre es obligatorio');
    return;
  }

  isSaving.value = true;
  let res;
  if (isEditing.value) {
    res = await userStore.updateDepartment(form.value.id, { name: form.value.name, code: form.value.code });
  } else {
    res = await userStore.createDepartment({ name: form.value.name, code: form.value.code });
  }
  isSaving.value = false;

  if (res.success) {
    showToast.success(isEditing.value ? 'Departamento actualizado' : 'Departamento creado');
    closeModal();
  } else {
    showToast.error(res.message || 'Error al guardar el departamento');
  }
}

async function confirmDelete(dept) {
  if (!confirm(`¿Estás seguro de eliminar el departamento "${dept.name}"? Esta acción no se puede deshacer y fallará si hay usuarios asignados a él.`)) return;

  const res = await userStore.deleteDepartment(dept.id);
  if (res.success) {
    showToast.success('Departamento eliminado exitosamente');
  } else {
    showToast.error(res.message || 'Error al eliminar el departamento');
  }
}
</script>

<style scoped>
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

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-btn { color: #3b82f6; }
.edit-btn:hover { background: #eff6ff; color: #2563eb; }

.delete-btn { color: #ef4444; }
.delete-btn:hover { background: #fef2f2; color: #dc2626; }

.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 450px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main, #1e293b);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-body {
  padding: 20px;
}

.edit-form-group {
  margin-bottom: 16px;
}
.edit-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 6px;
}
.edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}
.edit-input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
