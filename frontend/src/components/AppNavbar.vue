<template>
  <header class="app-navbar glass-nav">
    <div class="nav-brand">
      <div class="nav-logo">
        <i class="fa-solid fa-shield-halved"></i>
      </div>
      <div class="nav-title-box">
        <span class="nav-title">Sistema de Gestión de Calidad</span>
        <span class="nav-tag">Control Documental & ISO 9001</span>
      </div>
    </div>

    <!-- Acciones de escritorio -->
    <div class="nav-actions desktop-only">
      <div v-if="user" class="user-chip shadow-sm">
        <img :src="userAvatar" :alt="user.name" class="chip-avatar" @error="onAvatarError">
        <span class="chip-name">{{ user.givenName || user.name }}</span>
      </div>
      <div class="status-indicator shadow-sm" title="Servidor Backend Activo">
        <span class="dot green"></span>
        <span class="status-text">Backend en línea</span>
      </div>
    </div>

    <!-- Boton tipo toggle movil -->
    <button 
      type="button"
      class="mobile-toggle-btn mobile-only icon-btn" 
      @click="isMobileMenuOpen = !isMobileMenuOpen"
      aria-label="Menú Móvil"
    >
      <i :class="isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
    </button>

    <!-- Menu lateral  desplegable-->
    <Teleport to="body">
      <div 
        v-if="isMobileMenuOpen" 
        class="mobile-drawer-overlay" 
        @click.self="isMobileMenuOpen = false"
      >
        <aside class="mobile-drawer-panel glass-card shadow-lg">
          <div class="drawer-header">
            <div class="nav-brand">
              <div class="nav-logo">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <span class="nav-title text-sm">Menú de Calidad (QMS)</span>
            </div>
            <button type="button" class="icon-btn" @click="isMobileMenuOpen = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="drawer-body">
            <div v-if="user" class="drawer-user-box">
              <img :src="userAvatar" :alt="user.name" class="drawer-avatar" @error="onAvatarError">
              <div class="drawer-user-info">
                <span class="drawer-name">{{ user.name }}</span>
                <span class="drawer-email">{{ user.email }}</span>
              </div>
            </div>

            <!-- Mobile Navigation Menu -->
            <nav class="drawer-nav">
              <span class="drawer-section-title">Navegación del Sistema</span>
              
              <button 
                :class="['drawer-nav-item', { active: activeTab === 'overview' }]"
                @click="selectTab('overview')"
              >
                <i class="fa-solid fa-chart-pie"></i>
                <span>Resumen Dashboard</span>
              </button>

              <button 
                :class="['drawer-nav-item', { active: activeTab === 'documents' }]"
                @click="selectTab('documents')"
              >
                <i class="fa-solid fa-folder-closed"></i>
                <span>Gestor de Documentos</span>
                <span class="badge-count" v-if="documentsCount">{{ documentsCount }}</span>
              </button>

              <button 
                :class="['drawer-nav-item', { active: activeTab === 'users' }]"
                @click="selectTab('users')"
              >
                <i class="fa-solid fa-users"></i>
                <span>Usuarios</span>
                <span class="badge-count light" v-if="usersCount">{{ usersCount }}</span>
              </button>

              <button 
                :class="['drawer-nav-item', { active: activeTab === 'roles' }]"
                @click="selectTab('roles')"
              >
                <i class="fa-solid fa-user-gear"></i>
                <span>Roles y Permisos</span>
                <span class="badge-count light" v-if="rolesCount">{{ rolesCount }}</span>
              </button>

              <button 
                :class="['drawer-nav-item', { active: activeTab === 'profile' }]"
                @click="selectTab('profile')"
              >
                <i class="fa-solid fa-circle-user"></i>
                <span>Mi Perfil & Token</span>
              </button>
            </nav>

            <div class="drawer-status-box">
              <span class="dot green"></span>
              <span>Backend Activo • Puerto 3001</span>
            </div>
          </div>

          <div class="drawer-footer">
            <button type="button" class="btn btn-secondary btn-full" @click="handleLogout">
              <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </header>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  user: { type: Object, default: () => null },
  activeTab: { type: String, default: 'overview' },
  documentsCount: { type: Number, default: 0 },
  usersCount: { type: Number, default: 0 },
  rolesCount: { type: Number, default: 0 }
});

const emit = defineEmits(["logout", "select-tab"]);
const isMobileMenuOpen = ref(false);

const userAvatar = computed(() => {
  return props.user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
});

function onAvatarError(e) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
}

function selectTab(tabKey) {
  emit("select-tab", tabKey);
  isMobileMenuOpen.value = false;
}

function handleLogout() {
  isMobileMenuOpen.value = false;
  emit("logout");
}
</script>

<style scoped>
.app-navbar {
  width: 100%;
  max-width: 1320px;
  padding: 10px 24px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 100px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.glass-nav {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-light);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-logo {
  width: 38px;
  height: 38px;
  background: var(--primary-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
}

.nav-title-box {
  display: flex;
  flex-direction: column;
}

.nav-title {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 17px;
  color: var(--primary);
  letter-spacing: -0.4px;
  line-height: 1.1;
}

.nav-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--brand-green);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 4px 12px 4px 4px;
  border-radius: 30px;
  border: 1px solid var(--border-light);
}

.chip-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.chip-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: #ffffff;
  padding: 5px 12px;
  border-radius: 30px;
  border: 1px solid var(--border-light);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot.green {
  background-color: var(--brand-green);
  box-shadow: 0 0 6px rgba(117, 186, 33, 0.6);
}

.mobile-toggle-btn {
  background: #ffffff;
  border: 1px solid var(--border-light);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--primary);
  font-size: 16px;
}

/* Teleported Mobile Drawer Styles */
:global(.mobile-drawer-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
}

:global(.mobile-drawer-panel) {
  width: 290px;
  height: 100%;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.98);
  border-left: 1px solid var(--border-light);
  animation: slideInRight 0.25s ease-out;
}

:global(.drawer-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

:global(.drawer-body) {
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:global(.drawer-user-box) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

:global(.drawer-avatar) {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary);
}

:global(.drawer-user-info) {
  display: flex;
  flex-direction: column;
}

:global(.drawer-name) {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-main);
}

:global(.drawer-email) {
  font-size: 12px;
  color: var(--text-muted);
}

:global(.drawer-nav) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.drawer-section-title) {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

:global(.drawer-nav-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  width: 100%;
}

:global(.drawer-nav-item i) {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

:global(.drawer-nav-item:hover) {
  background: rgba(2, 132, 199, 0.08);
  color: var(--primary);
}

:global(.drawer-nav-item.active) {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25);
}

:global(.drawer-nav-item.active i) {
  color: #ffffff;
}

:global(.drawer-status-box) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  padding: 10px 12px;
  background: rgba(117, 186, 33, 0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(117, 186, 33, 0.2);
}

:global(.drawer-footer) {
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

@media (max-width: 900px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
  .app-navbar {
    padding: 10px 16px !important;
    border-radius: 20px !important;
  }
}

@media (max-width: 600px) {
  .app-navbar {
    padding: 8px 12px !important;
    border-radius: 14px !important;
  }
  .nav-tag {
    display: none !important;
  }
  .nav-title {
    font-size: 13px !important;
  }
  .nav-logo {
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
  }
}
</style>
