<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-user-gear"></i> Roles y Matriz de Permisos QMS</h3>
        <p class="section-subtitle">Administra los roles por defecto (admin_sgc, leader, operator, auditor) y sus perfiles de permisos</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        <i class="fa-solid fa-shield-plus"></i> Crear Nuevo Rol
      </button>
    </div>

    <div class="roles-grid">
      <div 
        v-for="role in roleList" 
        :key="role.role || role.name" 
        :class="['role-card', 'shadow-card', { 'system-role': role.isSystem }]"
      >
        <div class="role-header">
          <div class="role-title-box">
            <i :class="getRoleIcon(role.role, role.name)" class="role-card-icon"></i>
            <div>
              <h4 class="role-name">{{ role.name }}</h4>
              <code class="role-code-badge">{{ role.role || 'custom' }}</code>
            </div>
          </div>
          <span :class="['type-badge', role.isSystem ? 'badge-system' : 'badge-custom']">
            {{ role.isSystem ? "Sistema" : "Personalizado" }}
          </span>
        </div>

        <p class="role-desc">{{ role.description }}</p>

        <div class="role-meta">
          <span class="user-count">
            <i class="fa-solid fa-users"></i> {{ getUserCountForRole(role) }} usuario(s) asignado(s)
          </span>
        </div>

        <div class="permissions-container">
          <span class="perm-title">Alcance de Permisos:</span>
          <div class="perm-tags">
            <span v-if="!role.permissions || role.permissions.length === 0" class="perm-tag" style="opacity: 0.7;">
              <i class="fa-solid fa-circle-exclamation text-muted"></i> Sin permisos asignados
            </span>
            <template v-else>
              <span 
                v-for="perm in role.permissions.slice(0, 9)" 
                :key="perm.key || perm" 
                class="perm-tag"
              >
                <i class="fa-solid fa-check text-emerald"></i> {{ perm.label || perm }}
              </span>
              <span v-if="role.permissions.length > 9" class="perm-tag more-tag" :title="role.permissions.slice(9).map(p => p.label || p).join(', ')">
                +{{ role.permissions.length - 9 }} permisos
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card glass-card shadow-lg">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fa-solid fa-shield-plus"></i> Crear Nuevo Rol de Calidad</h3>
          <button class="icon-btn" @click="showCreateModal = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="submitCreateRole" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre del Rol *</label>
            <input 
              type="text" 
              v-model="newRole.name" 
              placeholder="ej: Gestor de Calidad" 
              class="form-input" 
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea 
              v-model="newRole.description" 
              placeholder="Describe las responsabilidades de este rol..." 
              class="form-textarea" 
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Matriz de Permisos</label>
            <div class="checkbox-grid">
              <label v-for="opt in availablePermissions" :key="opt.key" class="checkbox-label">
                <input type="checkbox" :value="opt" v-model="newRole.selectedPermissions">
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmitting">
              <i class="fa-solid fa-floppy-disk"></i> Guardar Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoleStore } from "../../stores/roles";
import { useUserStore } from "../../stores/users";

const props = defineProps({
  roles: { type: Array, default: null },
  users: { type: Array, default: null }
});

const roleStore = useRoleStore();
const userStore = useUserStore();

const showCreateModal = ref(false);
const isSubmitting = ref(false);
const newRole = ref({ name: "", description: "", selectedPermissions: [] });

onMounted(() => {
  if (!props.roles) roleStore.fetchRoles();
  if (!props.users) userStore.fetchUsers();
  if (roleStore.permissions.length === 0) roleStore.fetchPermissions();
});

const roleList = computed(() => {
  return props.roles || roleStore.roles;
});

const userList = computed(() => {
  return props.users || userStore.users;
});

const availablePermissions = computed(() => roleStore.permissions);

function getRoleIcon(roleKey, roleName) {
  const key = roleKey || roleName || "";
  if (key === "admin_sgc" || key.includes("Administrador")) return "fa-solid fa-user-shield text-indigo";
  if (key === "leader" || key.includes("Líder")) return "fa-solid fa-user-tie text-blue";
  if (key === "operator" || key.includes("Operativo") || key.includes("Usuario")) return "fa-solid fa-user text-purple";
  if (key === "auditor" || key.includes("Auditor")) return "fa-solid fa-user-check text-emerald";
  return "fa-solid fa-user-gear text-purple";
}

function getUserCountForRole(roleObj) {
  const targetKey = roleObj.role || roleObj.name;
  return userList.value.filter(u => u.role === targetKey || u.role === roleObj.name).length;
}

async function submitCreateRole() {
  if (!newRole.value.name) return;
  isSubmitting.value = true;
  try {
    const res = await roleStore.createRole({
      name: newRole.value.name,
      description: newRole.value.description,
      permissions: newRole.value.selectedPermissions
    });
    if (res.success) {
      showCreateModal.value = false;
      newRole.value = { name: "", description: "", selectedPermissions: [] };
    } else {
      alert(res.message || "Error al crear el rol");
    }
  } catch (err) {
    console.error("Error guardando rol:", err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.panel-section {
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-card);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
}

.role-card {
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 320px;
  transition: var(--transition);
}

.role-card:hover {
  border-color: var(--border-glow);
  box-shadow: var(--shadow-card);
}

.role-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.role-title-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.role-card-icon {
  font-size: 20px;
  margin-top: 2px;
}

.role-name {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1.2;
}

.role-code-badge {
  font-family: monospace;
  font-size: 10px;
  background: var(--bg-main);
  color: var(--text-muted);
  padding: 1px 5px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 2px;
}

.type-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.badge-system { background: #e0e7ff; color: #1e3a8a; }
.badge-custom { background: rgba(117, 186, 33, 0.15); color: #558718; }

.role-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.role-meta {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-body);
}

.permissions-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-light);
  padding-top: 10px;
  margin-top: auto;
}

.perm-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--brand-green);
}

.perm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.perm-tag {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-body);
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.more-tag {
  background: #f1f5f9;
  border-color: #cbd5e1;
  border-style: dashed;
  color: #475569;
  font-weight: 700;
  cursor: help;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 100;
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
  gap: 5px;
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