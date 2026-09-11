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

    <!-- Desktop Actions -->
    <div class="nav-actions desktop-only">
      <div v-if="user" class="user-chip shadow-sm">
        <img :src="userAvatar" :alt="user.name" class="chip-avatar" @error="onAvatarError">
        <span class="chip-name">{{ user.givenName || user.name }}</span>
      </div>
      <div class="status-indicator shadow-sm" title="Servidor Backend Activo">
        <span class="dot green"></span>
        <span class="status-text">Sistema Operativo</span>
      </div>
    </div>

    <!-- Mobile Hamburger Toggle Button -->
    <button 
      type="button"
      class="mobile-toggle-btn mobile-only icon-btn" 
      @click="isMobileMenuOpen = !isMobileMenuOpen"
      aria-label="Menú Móvil"
    >
      <i :class="isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
    </button>

    <!-- Mobile Drawer Off-Canvas Overlay -->
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
