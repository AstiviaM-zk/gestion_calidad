<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="closeModal">
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
              <label class="edit-label">Título del Departamento *</label>
              <input type="text" v-model="form.title" @input="generateCode" class="edit-input" placeholder="Ej. Recursos Humanos" required>
            </div>
            <div class="edit-form-group">
              <label class="edit-label">Código / Clave (Opcional)</label>
              <input type="text" v-model="form.code" class="edit-input" placeholder="Ej. RRHH">
            </div>
            <div class="edit-form-group">
              <label class="edit-label">Descripción (Opcional)</label>
              <textarea v-model="form.description" class="edit-input" placeholder="Breve descripción del departamento..." rows="2"></textarea>
            </div>
            <div class="edit-form-group">
              <label class="edit-label">Icono</label>
              <div class="icon-selector">
                <button 
                  v-for="iconClass in availableIcons" 
                  :key="iconClass" 
                  type="button" 
                  class="icon-option" 
                  :class="{ active: form.icon === iconClass }"
                  @click="form.icon = iconClass"
                  :title="iconClass"
                >
                  <i :class="iconClass"></i>
                </button>
              </div>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '../../stores/users';
import { showToast } from '../../utils/toast';

const props = defineProps({
  modelValue: Boolean,
  initialData: {
    type: Object,
    default: () => ({ id: null, title: '', code: '', description: '', icon: '', status: true })
  }
});

const emit = defineEmits(['update:modelValue', 'saved']);
const userStore = useUserStore();

const isEditing = computed(() => !!props.initialData?.id);
const isSaving = ref(false);
const form = ref({ id: null, title: '', code: '', description: '', icon: 'fa-solid fa-building', status: true });
let autoCodeRef = ''; // Para saber si el usuario no ha tocado el código manual

const availableIcons = [
  'fa-solid fa-building', 'fa-solid fa-users', 'fa-solid fa-laptop-code', 
  'fa-solid fa-chart-line', 'fa-solid fa-briefcase', 'fa-solid fa-folder-open',
  'fa-solid fa-scale-balanced', 'fa-solid fa-helmet-safety', 'fa-solid fa-headset',
  'fa-solid fa-truck', 'fa-solid fa-leaf', 'fa-solid fa-stethoscope',
  'fa-solid fa-money-bill-trend-up', 'fa-solid fa-microchip', 'fa-solid fa-shield-halved'
];

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.value = { ...props.initialData };
    if (!form.value.icon) form.value.icon = 'fa-solid fa-building';
    autoCodeRef = form.value.code || '';
  }
});

function generateCode() {
  if (!isEditing.value) {
    const title = form.value.title.trim();
    if (!title) {
      if (form.value.code === autoCodeRef) {
        form.value.code = '';
        autoCodeRef = '';
      }
      return;
    }
    
    // Si el usuario ya modificó el código a mano, no se lo pisamos
    if (form.value.code !== autoCodeRef && form.value.code !== '') return;

    const words = title.split(/\s+/).filter(Boolean);
    let newCode = '';
    
    if (words.length > 1) {
      newCode = words.map(w => w[0].toUpperCase()).join('').substring(0, 5);
    } else {
      newCode = title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
    }
    
    form.value.code = newCode;
    autoCodeRef = newCode;
  }
}

function closeModal() {
  emit('update:modelValue', false);
}

async function saveDepartment() {
  if (!form.value.title.trim()) {
    showToast.error('El título es obligatorio');
    return;
  }

  isSaving.value = true;
  let res;
  const payload = { 
    title: form.value.title, 
    code: form.value.code, 
    description: form.value.description, 
    icon: form.value.icon, 
    status: form.value.status 
  };
  
  if (isEditing.value) {
    res = await userStore.updateDepartment(form.value.id, payload);
  } else {
    res = await userStore.createDepartment(payload);
  }
  isSaving.value = false;

  if (res.success) {
    showToast.success(isEditing.value ? 'Departamento actualizado' : 'Departamento creado');
    emit('saved');
    closeModal();
  } else {
    showToast.error(res.message || 'Error al guardar el departamento');
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
  border-color: var(--primary, #1e3a8a);
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.icon-option {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-option:hover {
  background: #f1f5f9;
}
.icon-option.active {
  background: rgba(30, 58, 138, 0.08);
  border-color: var(--primary, #1e3a8a);
  color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.15);
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
