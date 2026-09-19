<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <div class="title-with-badge">
          <h3 class="section-title"><i class="fa-solid fa-users-gear"></i> Usuarios en sistema</h3>
          <span class="user-count-badge" :title="(searchQuery || selectedRoleFilter) ? 'Usuarios encontrados' : 'Total de usuarios activos'">
            <i class="fa-solid fa-user-group"></i> {{ userList.length }} {{ userList.length === 1 ? 'usuario' : 'usuarios' }}
          </span>
        </div>
        <p class="section-subtitle">Aquí puedes administrar los usuarios con acceso al sistema QMS</p>
      </div>

      <div class="filter-actions">
        <!-- Filtro por Rol -->
        <div class="role-filter-box">
          <i class="fa-solid fa-filter role-filter-icon"></i>
          <select v-model="selectedRoleFilter" class="role-filter-select" aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            <option v-for="r in roleOptions" :key="r.role || r.name" :value="r.role || r.name">
              {{ r.name }}
            </option>
          </select>
        </div>

        <!-- Búsqueda -->
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Buscar por nombre o correo..."
            aria-label="Buscar usuario por nombre o correo"
          />
          <button v-if="searchQuery" type="button" class="clear-search-btn" @click="searchQuery = ''" title="Limpiar búsqueda">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-container shadow-card">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Departamento</th>
            <th>Acceso</th>
            <th>Rol</th>
            <th>Último Acceso</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="user in userList" 
            :key="user.email" 
            class="user-table-row" 
            @click="openUserDetail(user)" 
            title="Haz clic para ver detalles y modificar rol"
          >
            <td>
              <div class="user-cell">
                <img :src="user.picture" :alt="user.name" class="user-cell-avatar" @error="onAvatarError($event, user.name)">
                <div class="user-cell-details">
                  <div class="user-name-wrapper">
                    <span class="user-cell-name">{{ user.name }}</span>
                    <span v-if="user.email === currentUserEmail" class="you-badge" title="Tu usuario en sesión actual">
                      (Tú)
                    </span>
                  </div>
                  <div class="email-copy-wrapper">
                    <span class="user-cell-email">{{ user.email }}</span>
                    <button 
                      type="button" 
                      class="copy-email-btn" 
                      @click.stop="copyEmail(user.email)" 
                      :title="copiedEmail === user.email ? '¡Correo copiado!' : 'Copiar correo'"
                    >
                      <i :class="copiedEmail === user.email ? 'fa-solid fa-check text-green' : 'fa-regular fa-copy'"></i>
                    </button>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span class="dept-badge">
                <i class="fa-solid fa-building"></i> {{ user.departmentName || 'General' }}
              </span>
            </td>
            <td>
              <div class="access-methods">
                <span v-if="user.googleLoginEnabled" class="access-icon google" title="Inicio de Sesión con Google OAuth">
                  <svg class="google-g-svg" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </span>
                <span v-if="user.hasPassword" class="access-icon password" title="Inicio de Sesión con Contraseña">
                  <i class="fa-solid fa-key"></i>
                </span>
                <span v-if="!user.googleLoginEnabled && !user.hasPassword" class="text-subtle text-xs">
                  Sin métodos
                </span>
              </div>
            </td>
            <td>
              <span :class="['role-badge', getRoleBadgeClass(user.role)]">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>
              <div class="last-login-cell">
                <span class="text-subtle text-sm">{{ formatDate(user.lastLogin) }}</span>
                <i class="fa-solid fa-chevron-right row-hover-icon"></i>
              </div>
            </td>
          </tr>
          <tr v-if="userList.length === 0">
            <td colspan="5" class="text-center empty-state">
              <i class="fa-solid fa-magnifying-glass empty-icon" v-if="searchQuery || selectedRoleFilter"></i>
              <i class="fa-solid fa-user-xmark empty-icon" v-else></i>
              <p v-if="searchQuery || selectedRoleFilter">No se encontraron usuarios con los filtros aplicados.</p>
              <p v-else>No se encontraron usuarios activos en el sistema.</p>
              <span class="text-sm text-subtle" v-if="searchQuery || selectedRoleFilter">Intenta limpiar el cuadro de búsqueda o cambiar el filtro de rol.</span>
              <span class="text-sm text-subtle" v-else>Los usuarios registrados con estado activo aparecerán aquí.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pie de tabla con información de registros -->
    <div class="table-footer">
      <span class="records-info">
        <i class="fa-solid fa-list-check"></i> Mostrando <strong>{{ userList.length }}</strong> de <strong>{{ totalActiveUsersCount }}</strong> {{ totalActiveUsersCount === 1 ? 'registro' : 'registros' }}
      </span>
    </div>

    <!-- Modal de Detalles del Usuario -->
    <Teleport to="body">
      <div v-if="showDetailModal && selectedUser" class="modal-backdrop" @click.self="closeDetailModal">
        <div class="modal-card detail-modal-card shadow-lg glass-card">
          <div class="detail-header">
            <div class="detail-user-identity">
              <img :src="selectedUser.picture" :alt="selectedUser.name" class="detail-avatar" @error="onAvatarError($event, selectedUser.name)">
              <div class="detail-user-main">
                <h4 class="detail-user-name">{{ selectedUser.name }}</h4>
                <span class="detail-user-email">{{ selectedUser.email }}</span>
              </div>
            </div>
            <button type="button" class="close-modal-btn icon-btn" @click="closeDetailModal" title="Cerrar modal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="detail-body">
            <div class="detail-info-grid">
              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-building text-primary"></i> Departamento:</span>
                <span class="detail-value font-bold">{{ selectedUser.departmentName || 'General' }}</span>
              </div>

              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-clock text-primary"></i> Último Acceso:</span>
                <span class="detail-value">{{ formatDate(selectedUser.lastLogin) }}</span>
              </div>

              <div class="detail-info-item">
                <span class="detail-label"><i class="fa-solid fa-shield-halved text-primary"></i> Métodos de Acceso:</span>
                <div class="access-methods">
                  <span v-if="selectedUser.googleLoginEnabled" class="access-icon google" title="Google OAuth">
                    <svg class="google-g-svg" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </span>
                  <span v-if="selectedUser.hasPassword" class="access-icon password" title="Contraseña Local">
                    <i class="fa-solid fa-key"></i>
                  </span>
                  <span v-if="!selectedUser.googleLoginEnabled && !selectedUser.hasPassword" class="text-subtle text-xs">
                    Sin métodos registrados
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-divider"></div>

            <div class="role-management-box">
              <label class="detail-label-bold"><i class="fa-solid fa-user-gear text-primary"></i> Asignación de Rol:</label>
              
              <div v-if="selectedUser.email === currentUserEmail" class="self-edit-notice">
                <i class="fa-solid fa-triangle-exclamation text-amber"></i>
                <span>Estás editando tu propio usuario. Al cambiar tu rol se actualizarán tus accesos del sistema.</span>
              </div>

              <div class="role-select-modal-wrapper">
                <select 
                  v-model="tempSelectedRole" 
                  class="role-select-modal" 
                  @change="handleRoleSelectInModal"
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
            <button type="button" class="btn btn-secondary btn-sm" @click="closeDetailModal">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Confirmación de Cambio de Rol -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="modal-backdrop confirm-backdrop" @click.self="cancelRoleChange">
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
            <button type="button" class="btn btn-secondary btn-sm" @click="cancelRoleChange">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary btn-sm" @click="confirmRoleChange">
              <i class="fa-solid fa-check"></i> Confirmar Cambio
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useUserStore } from "../stores/users";
import { useRoleStore } from "../stores/roles";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  users: { type: Array, default: null },
  roles: { type: Array, default: null }
});

const userStore = useUserStore();
const roleStore = useRoleStore();
const authStore = useAuthStore();

const currentUserEmail = computed(() => authStore.user?.email);

// Modal de detalles
const showDetailModal = ref(false);
const selectedUser = ref(null);
const tempSelectedRole = ref('');

// Modal de confirmación
const showConfirmModal = ref(false);
const pendingUser = ref(null);
const pendingNewRole = ref('');
const previousUserRole = ref('');

// Filtros
const searchQuery = ref('');
const selectedRoleFilter = ref('');

// Copiar correo al portapapeles
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
});

const totalActiveUsersCount = computed(() => {
  const rawList = props.users || userStore.users;
  return rawList.filter(u => u.isActive !== false && u.status !== 'Inactivo').length;
});

const userList = computed(() => {
  const rawList = props.users || userStore.users;
  const activeList = rawList.filter(u => u.isActive !== false && u.status !== 'Inactivo');

  let filtered = activeList;

  // Filtro por Rol seleccionado
  if (selectedRoleFilter.value) {
    filtered = filtered.filter(u => u.role === selectedRoleFilter.value);
  }

  // Búsqueda por nombre o correo
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(u => {
      const nameMatch = u.name && u.name.toLowerCase().includes(q);
      const emailMatch = u.email && u.email.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }

  // Ordenar alfabéticamente por nombre (A-Z)
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

function getRoleLabel(roleCode) {
  const match = roleOptions.value.find(r => (r.role || r.name) === roleCode);
  return match ? match.name : roleCode;
}

function getRoleBadgeClass(roleCode) {
  switch (roleCode) {
    case 'admin_sgc': return 'role-admin';
    case 'leader': return 'role-leader';
    case 'auditor': return 'role-auditor';
    case 'operator': return 'role-operator';
    default: return 'role-custom';
  }
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

function handleRoleSelectInModal() {
  if (!selectedUser.value) return;
  const newRole = tempSelectedRole.value;
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
  position: relative;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
  gap: 16px;
  flex-wrap: wrap;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  border: 1px solid rgba(30, 58, 138, 0.18);
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.user-count-badge i {
  font-size: 11px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 260px;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 13px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 34px 8px 34px;
  font-size: 13px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 10px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: var(--primary, #1e3a8a);
  background: #f1f5f9;
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

.user-table-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-table-row:hover {
  background-color: rgba(241, 245, 249, 0.9) !important;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-cell-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--border-light, #e2e8f0);
}

.user-cell-details {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.user-cell-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-main, #1e293b);
  line-height: 1.2;
}

.user-cell-email {
  font-size: 11px;
  color: var(--text-muted, #64748b);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
}

.dept-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary, #f8fafc);
  border: 1px solid var(--border-light, #e2e8f0);
  color: var(--text-main, #334155);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.dept-badge i {
  color: var(--primary, #1e3a8a);
  font-size: 11px;
}

.access-methods {
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.access-icon.google {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.access-icon.google:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.google-g-svg {
  width: 15px;
  height: 15px;
  display: block;
}

.access-icon.password {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

/* Badges de Rol Read-only en la Tabla */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.role-badge.role-admin { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
.role-badge.role-leader { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.role-badge.role-auditor { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
.role-badge.role-operator { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.role-badge.role-custom { background: #fdf4ff; color: #7e22ce; border: 1px solid #f5d0fe; }

/* Modales */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 16px;
}

.confirm-backdrop {
  z-index: 9999;
  background: rgba(15, 23, 42, 0.6);
}

.modal-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  border: 1px solid var(--border-light, #e2e8f0);
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-modal-card {
  max-width: 480px;
}

.confirm-modal-card {
  max-width: 420px;
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Modal de Detalles Estilos */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  margin-bottom: 16px;
}

.detail-user-identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary, #1e3a8a);
}

.detail-user-main {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.detail-user-name {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 800;
  color: var(--primary, #1e3a8a);
  margin: 0;
  line-height: 1.2;
}

.detail-user-email {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  font-family: var(--font-mono, monospace);
  margin-top: 2px;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  color: var(--primary, #1e3a8a);
  background: #f1f5f9;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  text-align: left;
}

.detail-info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.detail-info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
}

.detail-label {
  color: var(--text-muted, #64748b);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-label-bold {
  color: var(--text-main, #1e293b);
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.detail-value {
  color: var(--text-main, #1e293b);
}

.detail-divider {
  height: 1px;
  background: var(--border-light, #e2e8f0);
  margin: 4px 0;
}

.role-management-box {
  background: rgba(30, 58, 138, 0.03);
  border: 1px solid rgba(30, 58, 138, 0.12);
  padding: 14px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-select-modal-wrapper {
  width: 100%;
}

.role-select-modal {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light, #cbd5e1);
  background: #ffffff;
  font-family: var(--font-primary);
  font-size: 13px;
  font-weight: 700;
  color: var(--primary, #1e3a8a);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.role-select-modal:focus,
.role-select-modal:hover {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.mt-1 { margin-top: 4px; }

/* Modal Header & Icon */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.modal-icon.warning {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 800;
  color: var(--primary, #1e3a8a);
  margin: 0;
}

.modal-body {
  font-size: 13px;
  color: var(--text-body, #334155);
  line-height: 1.5;
  margin-bottom: 20px;
  text-align: left;
}

.role-change-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 14px 0;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.role-chip {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
}

.role-chip.old {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.role-chip.new {
  background: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
}

.arrow-icon {
  font-size: 12px;
  color: #94a3b8;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

/* Pie de Tabla */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 14px 2px 14px;
  flex-shrink: 0;
  border-top: 1px solid var(--border-light, rgba(226, 232, 240, 0.65));
  margin-top: 10px;
}

.records-info {
  font-size: 12px;
  color: var(--text-muted, #64748b);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.records-info i {
  color: var(--primary, #1e3a8a);
  font-size: 12px;
}

.records-info strong {
  color: var(--primary, #1e3a8a);
  font-weight: 700;
}

/* Acciones de filtro superiores */
.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.role-filter-box {
  position: relative;
  display: flex;
  align-items: center;
}

.role-filter-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted, #94a3b8);
  font-size: 12px;
  pointer-events: none;
}

.role-filter-select {
  padding: 8px 14px 8px 32px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 10px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-filter-select:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

/* Badge 'Tú' */
.user-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.you-badge {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: var(--primary, #1e3a8a);
  font-size: 11.5px;
  font-weight: 700;
  padding: 0;
}

/* Copiar Email */
.email-copy-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-email-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.user-table-row:hover .copy-email-btn {
  opacity: 1;
}

.copy-email-btn:hover {
  color: var(--primary, #1e3a8a);
  background: #f1f5f9;
}

.text-green {
  color: #16a34a !important;
}

.text-amber {
  color: #d97706 !important;
}

/* Indicador en celda de último acceso (Hover) */
.last-login-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.row-hover-icon {
  font-size: 12px;
  color: var(--primary, #1e3a8a);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s ease;
}

.user-table-row:hover .row-hover-icon {
  opacity: 1;
  transform: translateX(0);
}

/* Aviso de edición propia en Modal */
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
  margin-bottom: 8px;
  line-height: 1.35;
}

.self-edit-notice i {
  margin-top: 2px;
  font-size: 13px;
}
</style>