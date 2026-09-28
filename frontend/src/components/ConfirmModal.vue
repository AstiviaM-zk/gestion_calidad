<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click.self="cancel">
      <div class="confirm-card shadow-lg">
        <div class="confirm-icon-wrapper" :class="type">
          <i :class="iconClass"></i>
        </div>
        <div class="confirm-content">
          <h4 class="confirm-title">{{ title }}</h4>
          <p class="confirm-message">{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="btn btn-secondary btn-sm" @click="cancel">
            {{ cancelText }}
          </button>
          <button type="button" class="btn btn-sm" :class="confirmBtnClass" @click="confirm" :disabled="isLoading">
            <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '¿Estás seguro?' },
  message: { type: String, required: true },
  type: { type: String, default: 'danger' }, // 'danger', 'warning', 'info'
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  isLoading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const iconClass = computed(() => {
  switch(props.type) {
    case 'danger': return 'fa-solid fa-triangle-exclamation';
    case 'warning': return 'fa-solid fa-circle-exclamation';
    case 'info': return 'fa-solid fa-circle-info';
    default: return 'fa-solid fa-circle-question';
  }
});

const confirmBtnClass = computed(() => {
  switch(props.type) {
    case 'danger': return 'btn-danger';
    case 'warning': return 'btn-warning';
    case 'info': return 'btn-primary';
    default: return 'btn-primary';
  }
});

function confirm() {
  emit('confirm');
}

function cancel() {
  emit('cancel');
  emit('update:modelValue', false);
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
  z-index: 1200;
  padding: 16px;
}

.confirm-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
}

.confirm-icon-wrapper.danger { background: #fee2e2; color: #dc2626; }
.confirm-icon-wrapper.warning { background: #fef9c3; color: #ca8a04; }
.confirm-icon-wrapper.info { background: #eff6ff; color: #3b82f6; }

.confirm-title {
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.confirm-message {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 24px 0;
}

.confirm-footer {
  display: flex;
  gap: 12px;
  width: 100%;
}

.confirm-footer .btn {
  flex: 1;
  justify-content: center;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: 1px solid #b91c1c;
}
.btn-danger:hover { background: #b91c1c; }

.btn-warning {
  background: #eab308;
  color: white;
  border: 1px solid #ca8a04;
}
.btn-warning:hover { background: #ca8a04; }
</style>
