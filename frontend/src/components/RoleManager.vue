<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-user-gear"></i> Roles y Matriz de Permisos</h3>
        <p class="section-subtitle">Administra los roles predeterminados (Administrador, Usuario, Auditor) y crea perfiles personalizados</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        <i class="fa-solid fa-shield-plus"></i> Crear Nuevo Rol
      </button>
    </div>

    <div class="roles-grid">
      <div 
        v-for="role in roles" 
        :key="role.name" 
        :class="['role-card', 'shadow-card', { 'system-role': role.isSystem }]"
      >
        <div class="role-header">
          <div class="role-title-box">
            <i :class="getRoleIcon(role.name)" class="role-card-icon"></i>
            <h4 class="role-name">{{ role.name }}</h4>
          </div>
          <span :class="['type-badge', role.isSystem ? 'badge-system' : 'badge-custom']">
            {{ role.isSystem ? "Sistema" : "Personalizado" }}
          </span>
        </div>

        <p class="role-desc">{{ role.description }}</p>

        <div class="role-meta">
          <span class="user-count">
            <i class="fa-solid fa-users"></i> {{ getUserCountForRole(role.name) }} usuario(s) asignado(s)
          </span>
        </div>

        <div class="permissions-container">
          <span class="perm-title">Permisos Habilitados:</span>
          <div class="perm-tags">
            <span 
              v-for="perm in role.permissions" 
              :key="perm.key || perm" 
              class="perm-tag"
            >
              <i class="fa-solid fa-check text-emerald"></i> {{ perm.label || perm }}
            </span>
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
              placeholder="ej: Supervisor de Calidad" 
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
import { ref } from "vue";

const props = defineProps({
  roles: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] }
});

const emit = defineEmits(["role-created"]);
const showCreateModal = ref(false);
const isSubmitting = ref(false);
const newRole = ref({ name: "", description: "", selectedPermissions: [] });

const availablePermissions = [
  { key: "docs:read", label: "Lectura de Documentos" },
  { key: "docs:create", label: "Creación de Documentos" },
  { key: "docs:edit", label: "Edición de Documentos" },
  { key: "docs:delete", label: "Eliminación de Documentos" },
  { key: "docs:approve", label: "Aprobación de Calidad" },
  { key: "users:manage", label: "Gestión de Usuarios" },
  { key: "audit:export", label: "Exportación de Reportes" }
];

function getRoleIcon(roleName) {
  if (roleName === "Administrador") return "fa-solid fa-user-shield text-indigo";
  if (roleName === "Usuario") return "fa-solid fa-user text-blue";
  if (roleName === "Auditor") return "fa-solid fa-user-check text-emerald";
  return "fa-solid fa-user-gear text-purple";
}

function getUserCountForRole(roleName) {
  return props.users.filter(u => u.role === roleName).length;
}

async function submitCreateRole() {
  if (!newRole.value.name) return;
  isSubmitting.value = true;
  try {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRole.value.name,
        description: newRole.value.description,
        permissions: newRole.value.selectedPermissions
      })
    });
    const data = await res.json();
    if (data.success) {
      emit("role-created");
      showCreateModal.value = false;
      newRole.value = { name: "", description: "", selectedPermissions: [] };
    } else {
      alert(data.message || "Error al crear el rol");
    }
  } catch (err) { console.error("Error guardando rol:", err); }
  finally { isSubmitting.value = false; }
}
</script>