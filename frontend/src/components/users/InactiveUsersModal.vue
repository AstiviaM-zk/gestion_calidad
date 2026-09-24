<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop confirm-backdrop" @click.self="$emit('close')">
      <div class="modal-card shadow-lg glass-card inactive-modal-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <h4 class="modal-title"><i class="fa-solid fa-users-slash text-danger"></i> Usuarios Desactivados</h4>
          </div>
          <button type="button" class="close-modal-btn icon-btn" @click="$emit('close')" title="Cerrar modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div class="modal-body-table">
          <UserTable
            :user-list="inactiveUsers"
            :total-active-users-count="inactiveUsers.length"
            :search-query="searchQuery"
            :selected-role-filter="selectedRoleFilter"
            :role-options="roleOptions"
            :current-user-email="currentUserEmail"
            :copied-email="copiedEmail"
            :is-inactive-mode="true"
            @update:searchQuery="$emit('update:searchQuery', $event)"
            @update:selectedRoleFilter="$emit('update:selectedRoleFilter', $event)"
            @copy-email="$emit('copy-email', $event)"
            @activate-user="$emit('activate-user', $event)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import UserTable from './UserTable.vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  inactiveUsers: { type: Array, required: true },
  roleOptions: { type: Array, required: true },
  searchQuery: { type: String, default: '' },
  selectedRoleFilter: { type: String, default: '' },
  currentUserEmail: { type: String, default: '' },
  copiedEmail: { type: String, default: '' }
});

defineEmits([
  'close', 
  'update:searchQuery', 
  'update:selectedRoleFilter', 
  'copy-email', 
  'activate-user'
]);
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

.inactive-modal-card {
  width: 100%;
  max-width: 900px;
  height: 85vh;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.modal-body-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  background: #f8fafc;
}

/* Reducimos el padding dentro de la tabla cuando está en el modal para que quepa mejor */
:deep(.panel-section) {
  border: none;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: #f1f5f9;
  color: var(--text-main, #1e293b);
}

.text-danger { color: #dc2626; }
</style>
