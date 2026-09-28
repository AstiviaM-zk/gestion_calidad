<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card shadow-lg glass-card">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <div class="dept-icon-wrapper" :class="{ 'inactive': !department?.status }">
              <i :class="department?.icon || 'fa-solid fa-building'"></i>
            </div>
            <div class="dept-title-container">
              <h4 class="modal-title">{{ department?.title }}</h4>
              <div class="dept-badges">
                <span class="badge-code" v-if="department?.code">{{ department.code }}</span>
                <span v-if="department?.status" class="badge-active">Activo</span>
                <span v-else class="badge-inactive">Inactivo</span>
              </div>
            </div>
          </div>
          <button type="button" class="icon-btn" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        
        <div class="modal-body">
          <div class="dept-description" v-if="department?.description">
            <p>{{ department.description }}</p>
          </div>
          <div class="dept-description empty-desc" v-else>
            <p>Este departamento no tiene descripción.</p>
          </div>

          <div class="users-section">
            <div class="users-section-header">
              <h5 class="section-subtitle">
                <i class="fa-solid fa-users"></i> 
                {{ isAddingUsers ? 'Usuarios disponibles (Sin asignar)' : `Usuarios en este departamento (${deptUsers.length})` }}
              </h5>
              <button 
                v-if="canManage" 
                type="button" 
                class="btn btn-sm btn-outline-primary"
                @click="isAddingUsers = !isAddingUsers"
              >
                <i :class="isAddingUsers ? 'fa-solid fa-arrow-left' : 'fa-solid fa-user-plus'"></i> 
                {{ isAddingUsers ? 'Volver a lista' : 'Agregar Usuarios' }}
              </button>
            </div>
            
            <!-- Lista de usuarios actuales en el departamento -->
            <div v-if="!isAddingUsers">
              <div class="users-list" v-if="deptUsers.length > 0">
                <div v-for="user in deptUsers" :key="user.id" class="user-item">
                  <img :src="user.picture" :alt="user.name" class="user-avatar" @error="onAvatarError($event, user.name)">
                  <div class="user-info">
                    <span class="user-name" :class="{ 'text-danger': !user.isActive }">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span class="role-badge" :title="user.role">{{ getRoleLabel(user.role) }}</span>
                    <button 
                      v-if="canManage" 
                      type="button" 
                      class="icon-btn text-danger" 
                      @click="removeUser(user)" 
                      title="Quitar del departamento"
                    >
                      <i class="fa-solid fa-user-minus"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="empty-users">
                <i class="fa-solid fa-user-slash empty-user-icon"></i>
                <p>No hay usuarios asignados a este departamento.</p>
              </div>
            </div>

            <!-- Lista de usuarios sin asignar para agregar -->
            <div v-else>
              <div class="users-list" v-if="unassignedUsers.length > 0">
                <div v-for="user in unassignedUsers" :key="user.id" class="user-item">
                  <img :src="user.picture" :alt="user.name" class="user-avatar" @error="onAvatarError($event, user.name)">
                  <div class="user-info">
                    <span class="user-name" :class="{ 'text-danger': !user.isActive }">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-primary" 
                    @click="addUser(user)"
                  >
                    <i class="fa-solid fa-plus"></i> Agregar
                  </button>
                </div>
              </div>
              <div v-else class="empty-users">
                <i class="fa-solid fa-check-double empty-user-icon"></i>
                <p>Todos los usuarios del sistema ya tienen un departamento asignado.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" @click="closeModal">Cerrar</button>
          <button v-if="canManage" type="button" class="btn btn-primary btn-sm" @click="openEdit">
            <i class="fa-solid fa-pen"></i> Editar Departamento
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../../stores/users';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../utils/toast';

const props = defineProps({
  modelValue: Boolean,
  department: Object
});

const emit = defineEmits(['update:modelValue', 'edit']);

const userStore = useUserStore();
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasPermission('departments:update') || authStore.hasPermission('departments:create') || authStore.user?.role === 'admin_sgc');
const isAddingUsers = ref(false);

// Ensure users are loaded
if (userStore.users.length === 0) {
  userStore.fetchUsers();
}

const deptUsers = computed(() => {
  if (!props.department?.id) return [];
  return userStore.users.filter(u => u.departmentId === props.department.id);
});

const unassignedUsers = computed(() => {
  return userStore.users.filter(u => !u.departmentId || u.departmentId === '' || u.departmentId === 'null');
});

function closeModal() {
  isAddingUsers.value = false;
  emit('update:modelValue', false);
}

async function addUser(user) {
  const res = await userStore.updateUser(user.id, { departmentId: props.department.id });
  if (res.success) {
    showToast.success(`${user.name} asignado al departamento`);
  } else {
    showToast.error(res.message || 'Error al asignar usuario');
  }
}

async function removeUser(user) {
  if (!confirm(`¿Quitar a ${user.name} de este departamento?`)) return;
  const res = await userStore.updateUser(user.id, { departmentId: 'null' });
  if (res.success) {
    showToast.success(`${user.name} removido del departamento`);
  } else {
    showToast.error(res.message || 'Error al remover usuario');
  }
}

function openEdit() {
  emit('edit', props.department);
  closeModal();
}

function onAvatarError(e, name) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name || "User") + "&background=1e3a8a&color=fff";
}

function getRoleLabel(role) {
  const roles = {
    'admin_sgc': 'Admin SGC',
    'leader': 'Líder',
    'auditor': 'Auditor',
    'operator': 'Operador'
  };
  return roles[role] || role;
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
  max-width: 500px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.modal-title-wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
}

.dept-icon-wrapper {
  width: 54px;
  height: 54px;
  border-radius: 12px;
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

.dept-title-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.dept-badges {
  display: flex;
  gap: 8px;
  align-items: center;
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

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.dept-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.empty-desc {
  font-style: italic;
  color: #94a3b8;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary, #1e3a8a);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn-outline-primary {
  background: transparent;
  color: var(--primary, #1e3a8a);
  border: 1px solid var(--primary, #1e3a8a);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline-primary:hover {
  background: rgba(30, 58, 138, 0.05);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: 10px;
  transition: all 0.2s;
}

.user-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #e2e8f0;
}

.user-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 700;
  font-size: 13px;
  color: #1e293b;
}

.text-danger {
  color: #dc2626;
}

.user-email {
  font-size: 12px;
  color: #64748b;
}

.role-badge {
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.empty-users {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.empty-user-icon {
  font-size: 32px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.modal-footer {
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
