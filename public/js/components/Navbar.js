/**
 * Vue 3 Navbar Component (Light Mode)
 */
const AppNavbar = {
  name: 'AppNavbar',
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: () => null
    }
  },
  template: `
    <header class="app-navbar glass-nav shadow-soft">
      <div class="nav-brand">
        <div class="nav-logo shadow-gradient">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div class="nav-title-box">
          <span class="nav-title">Sistema de Gestión de Calidad</span>
          <span class="nav-tag">Control Documental & ISO 9001</span>
        </div>
      </div>

      <div class="nav-actions">
        <div v-if="isAuthenticated && user" class="user-chip shadow-sm">
          <img :src="userAvatar" :alt="user.name" class="chip-avatar" @error="onAvatarError">
          <span class="chip-name">{{ user.givenName || user.name }}</span>
        </div>
        <div class="status-indicator shadow-sm" title="Servidor Backend Activo">
          <span class="dot green"></span>
          <span class="status-text">Sistema Operativo</span>
        </div>
      </div>
    </header>
  `,
  computed: {
    userAvatar() {
      return this.user?.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.user?.name || 'User') + '&background=4f46e5&color=fff';
    }
  },
  methods: {
    onAvatarError(e) {
      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.user?.name || 'User') + '&background=4f46e5&color=fff';
    }
  }
};
