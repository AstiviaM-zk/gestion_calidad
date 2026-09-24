<template>
  <div class="user-management-container">
    <UserTable
      :user-list="userList"
      :total-active-users-count="totalActiveUsersCount"
      v-model:search-query="searchQuery"
      v-model:selected-role-filter="selectedRoleFilter"
      :role-options="roleOptions"
      :current-user-email="currentUserEmail"
      :copied-email="copiedEmail"
      @open-detail="openUserDetail"
      @copy-email="copyEmail"
    />

    <UserDetailModal
      :show="showDetailModal"
      :user="selectedUser"
      :temp-role="tempSelectedRole"
      :role-options="roleOptions"
      :department-options="departmentOptions"
      :current-user-email="currentUserEmail"
      :can-update-user="canUpdateUser"
      :can-delete-user="canDeleteUser"
      @close="closeDetailModal"
      @save-user="handleSaveUser"
      @request-role-change="handleRoleSelectInModal"
    />

    <UserRoleConfirmModal
      :show="showConfirmModal"
      :pending-user="pendingUser"
      :previous-user-role="previousUserRole"
      :pending-new-role="pendingNewRole"
      :role-options="roleOptions"
      @cancel="cancelRoleChange"
      @confirm="confirmRoleChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../stores/users';
import { useRoleStore } from '../stores/roles';
import { useAuthStore } from '../stores/auth';

import UserTable from './users/UserTable.vue';
import UserDetailModal from './users/UserDetailModal.vue';
import UserRoleConfirmModal from './users/UserRoleConfirmModal.vue';

const props = defineProps({
  users: { type: Array, default: null },
  roles: { type: Array, default: null }
});

const userStore = useUserStore();
const roleStore = useRoleStore();
const authStore = useAuthStore();

const currentUserEmail = computed(() => authStore.user?.email);

const canUpdateUser = computed(() => {
  return authStore.user?.role === 'admin_sgc' || authStore.hasPermission('users:update');
});

const canDeleteUser = computed(() => {
  return authStore.user?.role === 'admin_sgc' || authStore.hasPermission('users:delete');
});

// Modales y usuario seleccionado
const showDetailModal = ref(false);
const selectedUser = ref(null);
const tempSelectedRole = ref('');

// Confirmación de rol
const showConfirmModal = ref(false);
const pendingUser = ref(null);
const pendingNewRole = ref('');
const previousUserRole = ref('');

// Filtros
const searchQuery = ref('');
const selectedRoleFilter = ref('');

// Copiar correo
const copiedEmail = ref('');

function copyEmail(email) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email);
  }
  copiedEmail.value = email;
  setTimeout(() => {
    copiedEmail.value = '';
  }, 2000);
}

onMounted(() => {
  if (!props.users) userStore.fetchUsers();
  if (!props.roles) roleStore.fetchRoles();
  userStore.fetchDepartments();
});

const totalActiveUsersCount = computed(() => {
  const rawList = props.users || userStore.users;
  return rawList.filter(u => u.isActive !== false && u.status !== 'Inactivo').length;
});

const userList = computed(() => {
  const rawList = props.users || userStore.users;
  const activeList = rawList.filter(u => u.isActive !== false && u.status !== 'Inactivo');

  let filtered = activeList;

  if (selectedRoleFilter.value) {
    filtered = filtered.filter(u => u.role === selectedRoleFilter.value);
  }

  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(u => {
      const nameMatch = u.name && u.name.toLowerCase().includes(q);
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }

  return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
});

const roleOptions = computed(() => {
  const currentRoles = props.roles || roleStore.roles;
  if (currentRoles && currentRoles.length > 0) return currentRoles;
  return [
    { role: "admin_sgc", name: "Administrador (Calidad)" },
    { role: "leader", name: "Líder de Área (Dueño de proceso)" },
    { role: "operator", name: "Usuario común / Operativo" },
    { role: "auditor", name: "Auditor interno / externo" }
  ];
});

const departmentOptions = computed(() => {
  return userStore.departments || [];
});

function openUserDetail(user) {
  selectedUser.value = user;
  tempSelectedRole.value = user.role;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedUser.value = null;
  tempSelectedRole.value = '';
}

async function handleSaveUser({ id, userData, onSuccess, onError }) {
  const res = await userStore.updateUser(id, userData);
  if (res.success) {
    if (res.user && selectedUser.value) {
      selectedUser.value = { ...selectedUser.value, ...res.user };
    }
    onSuccess();
  } else {
    onError(res.message);
  }
}

function handleRoleSelectInModal(newRole) {
  if (!selectedUser.value) return;
  const oldRole = selectedUser.value.role;

  if (newRole === oldRole) return;

  pendingUser.value = selectedUser.value;
  pendingNewRole.value = newRole;
  previousUserRole.value = oldRole;
  showConfirmModal.value = true;
}

function cancelRoleChange() {
  if (selectedUser.value && previousUserRole.value) {
    tempSelectedRole.value = previousUserRole.value;
  }
  showConfirmModal.value = false;
  pendingUser.value = null;
  pendingNewRole.value = '';
  previousUserRole.value = '';
}

async function confirmRoleChange() {
  if (!pendingUser.value) return;
  const targetUser = pendingUser.value;
  const newRole = pendingNewRole.value;
  showConfirmModal.value = false;

  const res = await userStore.updateUserRole(targetUser.email, newRole);
  if (!res.success) {
    alert(res.message || "Error al actualizar el rol");
    if (selectedUser.value) {
      tempSelectedRole.value = previousUserRole.value;
    }
  } else {
    targetUser.role = newRole;
    if (selectedUser.value) {
      selectedUser.value.role = newRole;
    }
  }
  pendingUser.value = null;
  pendingNewRole.value = '';
  previousUserRole.value = '';
}
</script>

<style scoped>
.user-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>