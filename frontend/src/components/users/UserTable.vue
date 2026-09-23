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
          <select 
            :value="selectedRoleFilter" 
            class="role-filter-select"
            @change="$emit('update:selectedRoleFilter', $event.target.value)"
          >
            <option value="">Todos los roles</option>
            <option v-for="r in roleOptions" :key="r.role || r.name" :value="r.role || r.name">
              {{ r.name }}
            </option>
          </select>
        </div>

        <!-- Cuadro de Búsqueda -->
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            :value="searchQuery" 
            placeholder="Buscar por nombre o correo..." 
            class="search-input"
            @input="$emit('update:searchQuery', $event.target.value)"
          />
          <button 
            v-if="searchQuery" 
            type="button" 
            class="clear-search-btn" 
            @click="$emit('update:searchQuery', '')"
            title="Limpiar búsqueda"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla de Usuarios -->
    <div class="table-container">
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
            :key="user.id || user.email"
            class="user-table-row"
            @click="$emit('open-detail', user)"
          >
            <td>
              <div class="user-cell">
                <img 
                  :src="user.picture" 
                  :alt="user.name" 
                  class="user-cell-avatar" 
                  @error="onAvatarError($event, user.name)"
                />
                <div class="user-cell-details">
                  <div class="user-name-wrapper">
                    <span class="user-cell-name">{{ user.name }}</span>
                    <span v-if="user.email === currentUserEmail" class="you-badge">(Tú)</span>
                  </div>
                  <div class="email-copy-wrapper">
                    <span class="user-cell-email">{{ user.email }}</span>
                    <button 
                      type="button" 
                      class="copy-email-btn" 
                      @click.stop="$emit('copy-email', user.email)" 
                      :title="copiedEmail === user.email ? '¡Copiado!' : 'Copiar correo'"
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
              <div class="access-methods-cell">
                <span v-if="user.googleLoginEnabled" class="access-icon google" title="Inicio de Sesión con Google">
                  <svg class="google-g-svg" viewBox="0 0 24 24" width="14" height="14">
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
  </div>
</template>

<script setup>
const props = defineProps({
  userList: { type: Array, required: true },
  totalActiveUsersCount: { type: Number, required: true },
  searchQuery: { type: String, default: '' },
  selectedRoleFilter: { type: String, default: '' },
  roleOptions: { type: Array, required: true },
  currentUserEmail: { type: String, default: '' },
  copiedEmail: { type: String, default: '' }
});

defineEmits(['update:searchQuery', 'update:selectedRoleFilter', 'open-detail', 'copy-email']);

function getRoleLabel(roleCode) {
  const match = props.roleOptions.find(r => (r.role || r.name) === roleCode);
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
}

.email-copy-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-cell-email {
  font-size: 12px;
  color: var(--text-muted, #64748b);
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

.dept-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main, #334155);
}

.access-methods-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.access-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
}

.access-icon.password {
  color: var(--primary, #1e3a8a);
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 700;
}

.role-admin { background: rgba(30, 58, 138, 0.12); color: #1e3a8a; }
.role-leader { background: rgba(13, 148, 136, 0.12); color: #0d9488; }
.role-operator { background: rgba(100, 116, 139, 0.12); color: #475569; }
.role-auditor { background: rgba(168, 85, 247, 0.12); color: #7e22ce; }
.role-custom { background: rgba(234, 88, 12, 0.12); color: #c2410c; }

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

.table-footer {
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
}

.text-green { color: #16a34a !important; }
</style>
