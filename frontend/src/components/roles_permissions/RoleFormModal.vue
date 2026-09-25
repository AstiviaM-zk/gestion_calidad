<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card glass-card shadow-lg">
        <div class="modal-header">
          <h3 class="modal-title">
            <i :class="isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-shield-plus'"></i> 
            {{ isEdit ? 'Editar Rol: ' + formData.name : 'Crear Nuevo Rol' }}
          </h3>
          <button class="icon-btn" @click="closeModal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-body">
          <div class="modal-columns">
            <div class="left-col">
              <!-- SECCION 1: Información General -->
              <div class="section-panel">
                <h4 class="section-heading"><i class="fa-solid fa-circle-info"></i> Información General</h4>
                <div class="form-group mt-2">
                  <label class="form-label">Nombre del Rol *</label>
                  <input 
                    type="text" 
                    v-model="formData.name" 
                    :placeholder="isEdit ? '' : 'ej: Gestor de Calidad'"
                    class="form-input" 
                    required
                    :disabled="isEdit && formData.isSystem"
                    :title="isEdit && formData.isSystem ? 'Los roles del sistema no pueden cambiar de nombre' : ''"
                  >
                </div>

                <div class="form-group mt-2">
                  <label class="form-label">Descripción</label>
                  <textarea 
                    v-model="formData.description" 
                    class="form-textarea" 
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <!-- SECCION 2: Usuarios con este Rol (solo en Edición) -->
              <div class="section-panel mt-3" v-if="isEdit">
                <h4 class="section-heading"><i class="fa-solid fa-users"></i> Usuarios con este Rol</h4>
                <div class="users-list mt-2">
                  <div v-if="roleUsers.length === 0" class="no-users">
                    No hay usuarios asignados a este rol.
                  </div>
                  <div v-for="user in roleUsers" :key="user.email" class="user-item">
                    <div class="user-info">
                      <i class="fa-solid fa-user-circle text-muted"></i>
                      <div class="user-texts">
                        <span class="user-name">{{ user.name }}</span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </div>
                    <button type="button" class="btn-remove" @click="removeUserFromRole(user)" title="Remover rol">
                      <i class="fa-solid fa-user-minus"></i>
                    </button>
                  </div>
                </div>

                <div class="add-user-section mt-2">
                  <select class="form-input select-user" v-model="selectedUserToAdd">
                    <option :value="null">Asignar a un usuario...</option>
                    <option v-for="u in availableUsers" :key="u.email" :value="u">{{ u.name }}</option>
                  </select>
                  <button type="button" class="btn btn-primary btn-sm btn-assign" :disabled="!selectedUserToAdd" @click="addUserToRole">
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="right-col">
              <!-- SECCION 3: Permisos del Rol -->
              <div class="section-panel h-100">
                <h4 class="section-heading"><i class="fa-solid fa-shield-halved"></i> Permisos del Rol</h4>
                <div class="permissions-module-list mt-2">
                  <div v-for="(perms, moduleName) in permissionsByModule" :key="moduleName" class="perm-module-group">
                    <h5 class="perm-module-title">
                      <i class="fa-solid fa-layer-group"></i> {{ moduleName }}
                    </h5>
                    <div class="checkbox-grid">
                      <label v-for="opt in perms" :key="opt.key" class="checkbox-label">
                        <input type="checkbox" :value="opt" v-model="formData.selectedPermissions" class="perm-checkbox">
                        <div class="perm-info">
                          <span class="perm-label">{{ opt.label }}</span>
                          <span v-if="opt.description" class="perm-desc">{{ opt.description }}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-danger btn-sm btn-delete" v-if="isEdit && !formData.isSystem && canDelete" @click="handleDeleteRole" :disabled="isSubmitting">
              <i class="fa-solid fa-trash"></i> Eliminar
            </button>
            <div style="flex:1"></div>
            <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmitting">
              <i class="fa-solid fa-floppy-disk"></i> {{ isEdit ? 'Guardar Cambios' : 'Guardar Rol' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoleStore } from '../../stores/roles';
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';

const props = defineProps({
  show: Boolean,
  role: { type: Object, default: null }
});

const emit = defineEmits(['close', 'saved']);
const roleStore = useRoleStore();
const userStore = useUserStore();
const authStore = useAuthStore();

const isSubmitting = ref(false);
const isEdit = computed(() => !!props.role);
const canDelete = computed(() => authStore.hasPermission('roles:delete'));

const selectedUserToAdd = ref(null);

const formData = ref({
  originalKey: null,
  name: "",
  description: "",
  isSystem: false,
  selectedPermissions: []
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.role) {
      formData.value = {
        originalKey: props.role.role || props.role.name,
        name: props.role.name,
        description: props.role.description,
        isSystem: props.role.isSystem,
        selectedPermissions: (roleStore.permissions || []).filter(p => 
          (props.role.permissions || []).some(rp => rp.key === p.key || rp === p.key)
        )
      };
    } else {
      formData.value = {
        originalKey: null,
        name: "",
        description: "",
        isSystem: false,
        selectedPermissions: []
      };
    }
  }
});

const permissionsByModule = computed(() => {
  const groups = {};
  for (const p of (roleStore.permissions || [])) {
    const mod = p.module || 'Otros';
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  return groups;
});

const roleUsers = computed(() => {
  if (!formData.value.originalKey) return [];
  const code = formData.value.originalKey;
  const name = formData.value.name;
  return userStore.users.filter(u => u.role === code || u.role === name);
});

const availableUsers = computed(() => {
  if (!formData.value.originalKey) return [];
  return userStore.users.filter(u => {
    // Excluir si ya tiene este rol
    if (u.role === formData.value.originalKey || u.role === formData.value.name) return false;
    // Mostrar solo si no tiene rol o es 'guest' (rol no asignado real)
    return !u.role || u.role.trim() === '' || u.role === 'guest';
  });
});

async function addUserToRole() {
  if (!selectedUserToAdd.value) return;
  const u = selectedUserToAdd.value;
  selectedUserToAdd.value = null;
  try {
    await userStore.updateUserRole(u.email, formData.value.originalKey || formData.value.name);
  } catch(e) {
    alert("Error al asignar usuario al rol");
  }
}

async function removeUserFromRole(u) {
  if(!confirm(`¿Estás seguro de quitar el rol a ${u.name}?`)) return;
  try {
    await userStore.updateUserRole(u.email, 'guest');
  } catch(e) {
    alert("Error al remover el rol del usuario");
  }
}

function closeModal() {
  emit('close');
}

async function handleDeleteRole() {
  if (roleUsers.value.length > 0) {
    alert("Este rol tiene usuarios asociados. No puede ser eliminado.");
    return;
  }
  
  if (formData.value.isSystem) {
    alert("No se pueden eliminar roles de sistema.");
    return;
  }

  if (!confirm(`¿Estás completamente seguro de eliminar el rol "${formData.value.name}"?\nEsta acción no se puede deshacer.`)) {
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await roleStore.deleteRole(formData.value.originalKey);
    if (res.success) {
      emit('saved');
      closeModal();
    } else {
      alert(res.message || "Error al eliminar el rol");
    }
  } catch (err) {
    console.error("Error eliminando rol:", err);
  } finally {
    isSubmitting.value = false;
  }
}

async function submitForm() {
  if (!formData.value.name) return;
  isSubmitting.value = true;
  try {
    let res;
    if (isEdit.value) {
      res = await roleStore.updateRole(formData.value.originalKey, {
        name: formData.value.name,
        description: formData.value.description,
        permissions: formData.value.selectedPermissions
      });
    } else {
      res = await roleStore.createRole({
        name: formData.value.name,
        description: formData.value.description,
        permissions: formData.value.selectedPermissions,
        is_system: false
      });
    }
    
    if (res.success) {
      emit('saved');
      closeModal();
    } else {
      alert(res.message || "Error al procesar el rol");
    }
  } catch (err) {
    console.error("Error guardando rol:", err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 900px; /* Wider to support 2 columns nicely */
  background: #ffffff;
  border-radius: var(--radius-xl);
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
}

.section-panel {
  background: var(--bg-main);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.section-heading {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.h-100 {
  height: 100%;
}

.mt-2 {
  margin-top: 10px;
}

.mt-3 {
  margin-top: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  font-family: var(--font-primary);
  font-size: 12px;
  color: var(--text-main);
  outline: none;
  transition: var(--transition);
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.permissions-module-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
  background: var(--bg-body);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.perm-module-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.perm-module-title {
  font-size: 11px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  background: var(--bg-main);
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checkbox-label:hover {
  background: var(--bg-body);
}

.perm-checkbox {
  margin-top: 2px;
}

.perm-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.perm-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
}

.perm-desc {
  font-size: 10px;
  font-weight: 400;
  color: var(--text-muted, #64748b);
  line-height: 1.2;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 8px;
  background: #f8fafc;
}

.no-users {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info i {
  font-size: 18px;
}

.user-texts {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.user-email {
  font-size: 10px;
  color: var(--text-muted);
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #fef2f2;
}

.add-user-section {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.select-user {
  flex: 1;
}

.btn-assign {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
}
.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}
</style>
