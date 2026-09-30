<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card shadow-lg glass-card">
        <div class="modal-header">
          <h4 class="modal-title">
            <i :class="isEditing ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus'"></i> 
            {{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}
          </h4>
          <button type="button" class="icon-btn" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="saveCategory">
          <div class="modal-body">
            <div class="edit-form-group">
              <label class="edit-label">Icono de la Categoría</label>
              <IconSelector v-model="form.icon" />
            </div>
            <div class="edit-form-group">
              <label class="edit-label">Nombre de la Categoría *</label>
              <input type="text" v-model="form.name" class="edit-input" placeholder="Ej. Procedimientos" required>
            </div>
            <div class="edit-form-group">
              <label class="edit-label">Código / Clave (Opcional)</label>
              <input type="text" v-model="form.code" class="edit-input" placeholder="Ej. PRO">
            </div>
            <div class="edit-form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.is_restricted">
                Acceso Restringido (Sólo administradores o líderes)
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="isSaving">
              <i v-if="isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-save"></i> 
              {{ isEditing ? 'Guardar Cambios' : 'Crear Categoría' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../../services/api';
import IconSelector from '../IconSelector.vue';
import { showToast } from '../../utils/toast';

const props = defineProps({
  modelValue: Boolean,
  departmentId: {
    type: Number,
    required: true
  },
  initialData: {
    type: Object,
    default: () => ({ id: null, name: '', code: '', icon: 'fa-solid fa-folder', is_restricted: false })
  }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const isEditing = computed(() => !!props.initialData?.id);
const isSaving = ref(false);
const form = ref({ id: null, name: '', code: '', icon: 'fa-solid fa-folder', is_restricted: false });

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.value = { ...props.initialData };
    if (!form.value.icon) form.value.icon = 'fa-solid fa-folder';
  }
});

function closeModal() {
  emit('update:modelValue', false);
}

async function saveCategory() {
  if (!form.value.name.trim()) {
    showToast.error('El nombre es obligatorio');
    return;
  }

  isSaving.value = true;
  const payload = { 
    name: form.value.name, 
    code: form.value.code, 
    icon: form.value.icon,
    is_restricted: form.value.is_restricted 
  };
  
  try {
    let res;
    if (isEditing.value) {
      res = await api.put(`/departments/${props.departmentId}/categories/${form.value.id}`, payload);
    } else {
      res = await api.post(`/departments/${props.departmentId}/categories`, payload);
    }
    
    if (res.data && res.data.success) {
      showToast.success(isEditing.value ? 'Categoría actualizada' : 'Categoría creada');
      emit('saved');
      closeModal();
    } else {
      showToast.error(res.data?.message || 'Error al guardar la categoría');
    }
  } catch (error) {
    showToast.error(error.response?.data?.message || 'Error de conexión');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
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
.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #64748b;
}
.icon-btn:hover {
  color: #1e293b;
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
}
.edit-input:focus {
  border-color: var(--primary, #1e3a8a);
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}
.checkbox-group {
  margin-top: 20px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-main);
  cursor: pointer;
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
