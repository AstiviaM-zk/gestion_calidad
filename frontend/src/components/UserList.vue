<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-users-gear"></i> Usuarios Autenticados y Asignación de Roles</h3>
        <p class="section-subtitle">Asigna y modifica roles para los usuarios autenticados en el sistema QMS</p>
      </div>
    </div>

    <div class="table-container shadow-card">
      <table class="qms-table">
        <thead>
          <tr>
            <th>ID Sistema</th>
            <th>Usuario Google</th>
            <th>Correo Electrónico</th>
            <th>Rol Asignado</th>
            <th>Último Acceso</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userList" :key="user.email">
            <td class="font-mono text-sm font-bold text-primary">{{ user.id }}</td>
            <td>
              <div class="user-cell">
                <img :src="user.picture" :alt="user.name" class="user-cell-avatar" @error="onAvatarError($event, user.name)">
                <span class="user-cell-name">{{ user.name }}</span>
              </div>
            </td>
            <td class="text-subtle font-mono text-sm">{{ user.email }}</td>
            <td>
              <div class="role-select-wrapper">
                <select 
                  v-model="user.role" 
                  class="role-select" 
                  @change="onRoleChange(user)"
                >
                  <option v-for="r in roleOptions" :key="r.role || r.name" :value="r.role || r.name">
                    {{ r.name }}
                  </option>
                </select>
              </div>
            </td>
            <td class="text-subtle text-sm">{{ formatDate(user.lastLogin) }}</td>
            <td>
              <span :class="['status-pill', user.status === 'Activo' ? 'status-approved' : 'status-pending']">
                <i :class="user.status === 'Activo' ? 'fa-solid fa-circle-check' : 'fa-solid fa-user-clock'"></i> {{ user.status }}
              </span>
            </td>
          </tr>
          <tr v-if="userList.length === 0">
            <td colspan="6" class="text-center empty-state">
              <i class="fa-solid fa-user-xmark empty-icon"></i>
              <p>Aún no hay usuarios registrados en el sistema.</p>
              <span class="text-sm text-subtle">Los usuarios que inicien sesión mediante Google OAuth aparecerán aquí automáticamente.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useUserStore } from "../stores/users";
import { useRoleStore } from "../stores/roles";

const props = defineProps({
  users: { type: Array, default: null },
  roles: { type: Array, default: null }
});

const userStore = useUserStore();
const roleStore = useRoleStore();

onMounted(() => {
  if (!props.users) userStore.fetchUsers();
  if (!props.roles) roleStore.fetchRoles();
});

const userList = computed(() => {
  return props.users || userStore.users;
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

async function onRoleChange(user) {
  const res = await userStore.updateUserRole(user.email, user.role);
  if (!res.success) {
    alert(res.message || "Error al actualizar el rol");
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

.table-container {
  flex: 1;
  overflow-y: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  min-height: 0;
  max-height: 100%;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-cell-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.user-cell-name {
  font-weight: 600;
  color: var(--text-main);
}

.role-select-wrapper {
  position: relative;
  width: 100%;
  max-width: 220px;
}

.role-select {
  width: 100%;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  background: #ffffff;
  font-family: var(--font-primary);
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  outline: none;
  transition: var(--transition);
}

.role-select:focus,
.role-select:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}
</style>