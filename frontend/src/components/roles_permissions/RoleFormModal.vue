<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card glass-card shadow-lg">
        <div class="modal-header">
          <h3 class="modal-title">
            <i :class="isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-shield-plus'"></i> 
            {{ isEdit ? 'Editar Rol: ' + formData.name : 'Crear Nuevo Rol de Calidad' }}
          </h3>
          <button class="icon-btn" @click="closeModal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-body">
          <div class="form-group">
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

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea 
              v-model="formData.description" 
              class="form-textarea" 
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Matriz de Permisos</label>
            <div class="permissions-module-list">
              <div v-for="(perms, moduleName) in permissionsByModule" :key="moduleName" class="perm-module-group">
                <h5 class="perm-module-title">{{ moduleName }}</h5>
                <div class="checkbox-grid">
                  <label v-for="opt in perms" :key="opt.key" class="checkbox-label">
                    <input type="checkbox" :value="opt" v-model="formData.selectedPermissions">
                    <span>{{ opt.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
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

const props = defineProps({
  show: Boolean,
  role: { type: Object, default: null }
});

const emit = defineEmits(['close', 'saved']);
const roleStore = useRoleStore();

const isSubmitting = ref(false);
const isEdit = computed(() => !!props.role);

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

function closeModal() {
  emit('close');
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
        permissions: formData.value.selectedPermissions
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
  max-width: 500px;
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
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-body);
  cursor: pointer;
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
