<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop confirm-backdrop" @click.self="$emit('cancel')">
      <div class="modal-card shadow-lg glass-card confirm-modal-card">
        <div class="modal-header">
          <div class="modal-icon warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h4 class="modal-title">Confirmar Cambio de Rol</h4>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de cambiar el rol del usuario <strong>{{ pendingUser?.name }}</strong>?
          </p>
          <div class="role-change-preview">
            <span class="role-chip old">{{ getRoleLabel(previousUserRole) }}</span>
            <i class="fa-solid fa-arrow-right arrow-icon"></i>
            <span class="role-chip new">{{ getRoleLabel(pendingNewRole) }}</span>
          </div>
          <p class="text-subtle text-xs">
            Esta acción actualizará inmediatamente los accesos y permisos asignados en PostgreSQL.
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" @click="$emit('cancel')">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary btn-sm" @click="$emit('confirm')">
            <i class="fa-solid fa-check"></i> Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  pendingUser: { type: Object, default: null },
  previousUserRole: { type: String, default: '' },
  pendingNewRole: { type: String, default: '' },
  roleOptions: { type: Array, required: true }
});

defineEmits(['cancel', 'confirm']);

function getRoleLabel(roleCode) {
  const match = props.roleOptions.find(r => (r.role || r.name) === roleCode);
  return match ? match.name : roleCode;
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

.confirm-modal-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.modal-icon.warning {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #fef3c7;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.modal-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.modal-body {
  padding: 20px;
  font-size: 13px;
  color: var(--text-main, #334155);
}

.role-change-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid var(--border-light, #e2e8f0);
}

.role-chip {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 700;
}

.role-chip.old {
  background: #e2e8f0;
  color: #475569;
}

.role-chip.new {
  background: rgba(30, 58, 138, 0.12);
  color: #1e3a8a;
}

.arrow-icon {
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
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
</style>
