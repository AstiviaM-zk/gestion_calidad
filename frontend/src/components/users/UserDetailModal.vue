<template>
  <Teleport to="body">
    <div v-if="show && user" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-card detail-modal-card shadow-lg glass-card">
        <!-- MODO CONFIRMACIÓN DE DESACTIVACIÓN -->
        <template v-if="showDeactivateConfirm">
          <div class="detail-header deactivate-header">
            <div class="detail-user-identity">
              <div class="deactivate-icon-avatar">
                <i class="fa-solid fa-user-slash text-danger"></i>
              </div>
              <div class="detail-user-main">
                <h4 class="detail-user-name">Desactivar Usuario</h4>
                <span class="detail-user-email">Confirmación de desactivación</span>
              </div>
            </div>
            <button type="button" class="close-modal-btn icon-btn" @click="cancelDeactivate" title="Cancelar">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="detail-body">

            <div class="deactivate-warning-box">
              <div class="warning-icon-wrapper">
                <i class="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div class="warning-text">
                <p class="warning-title">¿Desactivar al usuario <strong>{{ user.name }}</strong>?</p>
                <p class="warning-desc">
                  El usuario quedará inactivo en la base de datos y perderá inmediatamente el acceso al sistema QMS hasta que vuelva a ser activado.
                </p>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="cancelDeactivate" :disabled="isSaving">
              Cancelar
            </button>
            <button type="button" class="btn btn-danger btn-sm" @click="confirmDeactivate" :disabled="isSaving">
              <i class="fa-solid fa-user-slash" v-if="!isSaving"></i>
              <i class="fa-solid fa-spinner fa-spin" v-else></i>
              {{ isSaving ? 'Desactivando...' : 'Sí, Desactivar' }}
            </button>
          </div>
        </template>

        <!-- MODO VISUALIZACIÓN / DETALLE -->
        <template v-else-if="!isEditMode">
          <div class="detail-header">
            <div class="detail-user-identity">
              <img 
                :src="user.picture" 
                :alt="user.name" 
                class="detail-avatar" 
                @error="onAvatarError($event, user.name)"
              />
              <div class="detail-user-main">
                <h4 class="detail-user-name">{{ user.name }}</h4>
                <span class="detail-user-email">{{ user.email }}</span>
              </div>
            </div>

            <div class="header-action-group">
              <button 
                v-if="canUpdateUser" 
                type="button" 
                class="header-action-btn edit-action-btn" 
                @click="startEditing" 
                title="Editar información"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>

              <button 
                v-if="canDeleteUser && user.email !== currentUserEmail" 
                type="button" 
                class="header-action-btn deactivate-action-btn" 
                @click="triggerDeactivateConfirm" 
                title="Desactivar usuario"
              >
                <i class="fa-solid fa-user-slash"></i>
              </button>

              <button 
                type="button" 
                class="close-modal-btn icon-btn" 
                @click="$emit('close')" 
                title="Cerrar modal"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div class="detail-body">
            <div class="detail-info-grid">
              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-building text-primary"></i> Departamento:</span>
                <span class="detail-value font-bold">{{ user.departmentName || 'General' }}</span>
              </div>

              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-clock text-primary"></i> Último Acceso:</span>
                <span class="detail-value">{{ formatDate(user.lastLogin) }}</span>
              </div>

              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-shield-halved text-primary"></i> Métodos de Acceso:</span>
                <div class="access-methods">
                  <span v-if="user.googleLoginEnabled" class="access-icon google" title="Google OAuth">
                    <svg class="google-g-svg" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </span>
                  <span v-if="user.hasPassword" class="access-icon password" title="Contraseña Local">
                    <i class="fa-solid fa-key"></i>
                  </span>
                  <span v-if="!user.googleLoginEnabled && !user.hasPassword" class="text-subtle text-xs">
                    Sin métodos registrados
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-divider"></div>

            <div class="role-management-box">
              <label class="detail-label-bold"><i class="fa-solid fa-user-gear text-primary"></i> Asignación de Rol:</label>
              
              <div v-if="user.email === currentUserEmail" class="self-edit-notice">
                <i class="fa-solid fa-triangle-exclamation text-amber"></i>
                <span>Estás editando tu propio usuario. Al cambiar tu rol se actualizarán tus accesos del sistema.</span>
              </div>

              <div class="role-select-modal-wrapper">
                <select 
                  :value="tempRole" 
                  class="role-select-modal" 
                  @change="$emit('request-role-change', $event.target.value)"
                  :disabled="!canUpdateUser"
                >
                  <option v-for="r in roleOptions" :key="r.role || r.name" :value="r.role || r.name">
                    {{ r.name }}
                  </option>
                </select>
              </div>
              <p class="text-subtle text-xs mt-1">
                Al seleccionar un rol diferente se solicitará confirmación antes de guardar los cambios en la base de datos.
              </p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="$emit('close')">
              Cerrar
            </button>
          </div>
        </template>

        <!-- MODO EDICIÓN -->
        <template v-else>
          <div class="detail-header">
            <div class="detail-user-identity">
              <div class="edit-icon-avatar">
                <i class="fa-solid fa-user-pen text-primary"></i>
              </div>
              <div class="detail-user-main">
                <h4 class="detail-user-name">Editar Usuario</h4>
                <span class="detail-user-email">Modificando datos en PostgreSQL</span>
              </div>
            </div>
            <button type="button" class="close-modal-btn icon-btn" @click="cancelEditing" title="Cancelar edición">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="detail-body">

            <div class="edit-form-group">
              <label class="edit-label"><i class="fa-solid fa-signature text-primary"></i> Nombre Completo:</label>
              <input type="text" v-model="editForm.name" class="edit-input" placeholder="Ej. Carlos Perez">
            </div>

            <div class="edit-form-group">
              <label class="edit-label"><i class="fa-solid fa-envelope text-primary"></i> Correo Electrónico:</label>
              <div class="locked-input-wrapper">
                <input type="email" :value="editForm.email" class="edit-input disabled-input" disabled title="El correo electrónico no se puede modificar">
                <i class="fa-solid fa-lock locked-icon"></i>
              </div>
              <p class="text-subtle text-xs mt-1">No es posible modificar el correo electrónico.</p>
            </div>

            <div class="edit-form-group">
              <label class="edit-label"><i class="fa-solid fa-building text-primary"></i> Departamento:</label>
              <select v-model="editForm.departmentId" class="edit-select">
                <option :value="null">General / Sin departamento</option>
                <option v-for="d in departmentOptions" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
            </div>

            <div class="edit-form-group">
              <label class="edit-label"><i class="fa-solid fa-user-gear text-primary"></i> Rol Asignado:</label>
              <select v-model="editForm.role" class="edit-select">
                <option v-for="r in roleOptions" :key="r.role || r.name" :value="r.role || r.name">
                  {{ r.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="cancelEditing" :disabled="isSaving">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary btn-sm" @click="handleSave" :disabled="isSaving">
              <i class="fa-solid fa-floppy-disk" v-if="!isSaving"></i>
              <i class="fa-solid fa-spinner fa-spin" v-else></i>
              {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { showToast } from '../../utils/toast';

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null },
  tempRole: { type: String, default: '' },
  roleOptions: { type: Array, required: true },
  departmentOptions: { type: Array, required: true },
  currentUserEmail: { type: String, default: '' },
  canUpdateUser: { type: Boolean, default: false },
  canDeleteUser: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'save-user', 'request-role-change']);

const isEditMode = ref(false);
const showDeactivateConfirm = ref(false);
const editForm = ref({
  name: '',
  email: '',
  role: '',
  departmentId: null
});
const isSaving = ref(false);
const saveError = ref('');
const saveSuccess = ref('');

watch(() => props.show, (newVal) => {
  if (!newVal) {
    isEditMode.value = false;
    showDeactivateConfirm.value = false;
    saveError.value = '';
    saveSuccess.value = '';
  }
});

function startEditing() {
  if (!props.user) return;
  editForm.value = {
    name: props.user.name || '',
    email: props.user.email || '',
    role: props.user.role || 'operator',
    departmentId: props.user.departmentId || null
  };
  saveError.value = '';
  saveSuccess.value = '';
  showDeactivateConfirm.value = false;
  isEditMode.value = true;
}

function cancelEditing() {
  isEditMode.value = false;
  saveError.value = '';
  saveSuccess.value = '';
}

function triggerDeactivateConfirm() {
  saveError.value = '';
  saveSuccess.value = '';
  isEditMode.value = false;
  showDeactivateConfirm.value = true;
}

function cancelDeactivate() {
  showDeactivateConfirm.value = false;
  saveError.value = '';
}

async function confirmDeactivate() {
  if (!props.user || !props.user.id) return;

  isSaving.value = true;
  saveError.value = '';

  emit('save-user', {
    id: props.user.id,
    userData: {
      isActive: false
    },
    onSuccess: () => {
      isSaving.value = false;
      showDeactivateConfirm.value = false;
      emit('close');
    },
    onError: (msg) => {
      isSaving.value = false;
      saveError.value = msg || 'Error al desactivar el usuario';
    }
  });
}

async function handleSave() {
  if (!props.user || !props.user.id) return;
  if (!editForm.value.name.trim()) {
    showToast.error('El nombre completo es obligatorio.');
    return;
  }
  
  isSaving.value = true;
  saveError.value = '';
  saveSuccess.value = '';

  emit('save-user', {
    id: props.user.id,
    userData: {
      name: editForm.value.name.trim(),
      role: editForm.value.role,
      departmentId: editForm.value.departmentId
    },
    onSuccess: () => {
      isSaving.value = false;
      isEditMode.value = false;
    },
    onError: (msg) => {
      isSaving.value = false;
      showToast.error(msg || 'Error al guardar cambios del usuario');
    }
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "Reciente";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return dateStr; }
}

function onAvatarError(e, name) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name || "User") + "&background=1e3a8a&color=fff";
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
  z-index: 999;
  padding: 16px;
}

.detail-modal-card {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-user-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.edit-action-btn {
  background: #f1f5f9;
  color: var(--primary, #1e3a8a);
  border-color: #e2e8f0;
}

.edit-action-btn:hover {
  background: #e0e7ff;
  color: #1d4ed8;
  border-color: #c7d2fe;
  transform: translateY(-1px);
}

.deactivate-action-btn {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fee2e2;
}

.deactivate-action-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

.deactivate-icon-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.deactivate-warning-box {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 16px;
  border-radius: 12px;
}

.warning-icon-wrapper {
  font-size: 22px;
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-title {
  font-size: 14px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 6px 0;
}

.warning-desc {
  font-size: 12.5px;
  color: #7f1d1d;
  margin: 0;
  line-height: 1.5;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #b91c1c;
}

.btn-danger:hover {
  background: #b91c1c;
}

.detail-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-light, #e2e8f0);
}

.detail-user-main {
  display: flex;
  flex-direction: column;
}

.detail-user-name {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.detail-user-email {
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

.detail-body {
  padding: 20px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.detail-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted, #64748b);
}

.detail-value {
  font-size: 13px;
  color: var(--text-main, #1e293b);
}

.access-methods {
  display: flex;
  align-items: center;
  gap: 6px;
}

.access-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f1f5f9;
}

.access-icon.password {
  color: var(--primary, #1e3a8a);
}

.detail-divider {
  height: 1px;
  background: var(--border-light, #e2e8f0);
  margin: 16px 0;
}

.role-management-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label-bold {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main, #1e293b);
}

.role-select-modal-wrapper {
  width: 100%;
}

.role-select-modal {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  outline: none;
}

.self-edit-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fef08a;
  color: #92400e;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  margin-bottom: 4px;
}

.modal-footer {
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.btn-outline-primary {
  background: transparent;
  color: var(--primary, #1e3a8a);
  border: 1px solid var(--primary, #1e3a8a);
}

.btn-outline-primary:hover {
  background: rgba(30, 58, 138, 0.08);
}

.edit-icon-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(30, 58, 138, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.edit-form-group {
  margin-bottom: 14px;
}

.edit-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  margin-bottom: 6px;
}

.edit-input, .edit-select {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  outline: none;
  transition: all 0.2s ease;
}

.edit-input:focus, .edit-select:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.locked-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.disabled-input {
  background-color: #f1f5f9 !important;
  color: #64748b !important;
  cursor: not-allowed;
  padding-right: 36px !important;
  border-color: #cbd5e1 !important;
}

.locked-icon {
  position: absolute;
  right: 12px;
  color: #94a3b8;
  font-size: 13px;
  pointer-events: none;
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 14px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
</style>
