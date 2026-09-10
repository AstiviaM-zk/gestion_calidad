/**
 * Vue 3 AdminDashboard Component (With Roles & Permissions Management)
 */
const AdminDashboard = {
  name: 'AdminDashboard',
  components: {
    DocumentManager,
    UserList,
    RoleManager,
    UserProfile
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    token: {
      type: String,
      default: ''
    },
    stats: {
      type: Object,
      default: () => ({})
    },
    documents: {
      type: Array,
      default: () => []
    },
    users: {
      type: Array,
      default: () => []
    },
    roles: {
      type: Array,
      default: () => []
    }
  },
  emits: ['logout', 'reload-data'],
  template: `
    <div class="admin-layout">
      <!-- Sidebar Navigation -->
      <aside class="admin-sidebar glass-card">
        <div class="sidebar-user">
          <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">{{ user.name }}</div>
            <div class="sidebar-user-email">{{ user.email }}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <button 
            :class="['nav-item', { active: activeTab === 'overview' }]"
            @click="activeTab = 'overview'"
          >
            <i class="fa-solid fa-chart-pie"></i>
            <span>Resumen Dashboard</span>
          </button>

          <button 
            :class="['nav-item', { active: activeTab === 'documents' }]"
            @click="activeTab = 'documents'"
          >
            <i class="fa-solid fa-folder-closed"></i>
            <span>Gestor de Documentos</span>
            <span class="badge-count">{{ documents.length }}</span>
          </button>

          <button 
            :class="['nav-item', { active: activeTab === 'users' }]"
            @click="activeTab = 'users'"
          >
            <i class="fa-solid fa-users"></i>
            <span>Usuarios</span>
            <span class="badge-count light">{{ users.length }}</span>
          </button>

          <button 
            :class="['nav-item', { active: activeTab === 'roles' }]"
            @click="activeTab = 'roles'"
          >
            <i class="fa-solid fa-user-gear"></i>
            <span>Roles y Permisos</span>
            <span class="badge-count light">{{ roles.length || 3 }}</span>
          </button>

          <button 
            :class="['nav-item', { active: activeTab === 'profile' }]"
            @click="activeTab = 'profile'"
          >
            <i class="fa-solid fa-circle-user"></i>
            <span>Mi Perfil & Token</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="btn btn-secondary btn-sm" @click="$emit('logout')">
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- Main Dashboard Content Area -->
      <main class="admin-main">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="dashboard-content">
          <div class="page-title-box">
            <h2 class="page-title">Panel de Control de Calidad (QMS)</h2>
            <p class="page-subtitle">Bienvenido de nuevo, {{ user.givenName || user.name }}. Aquí está el estado actual del sistema.</p>
          </div>

          <!-- KPI Metric Cards Grid -->
          <div class="kpi-grid">
            <div class="kpi-card shadow-card">
              <div class="kpi-icon icon-blue">
                <i class="fa-solid fa-files"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Total Documentos</span>
                <span class="kpi-value">{{ stats.totalDocuments || documents.length }}</span>
                <span class="kpi-subtext text-emerald"><i class="fa-solid fa-arrow-up"></i> +4 este mes</span>
              </div>
            </div>

            <div class="kpi-card shadow-card">
              <div class="kpi-icon icon-amber">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Revisiones Pendientes</span>
                <span class="kpi-value">{{ stats.pendingReviews || 3 }}</span>
                <span class="kpi-subtext text-amber"><i class="fa-solid fa-triangle-exclamation"></i> Requiere atención</span>
              </div>
            </div>

            <div class="kpi-card shadow-card">
              <div class="kpi-icon icon-emerald">
                <i class="fa-solid fa-shield-check"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Cumplimiento ISO 9001</span>
                <span class="kpi-value">{{ stats.qualityComplianceRate || '98.5%' }}</span>
                <span class="kpi-subtext text-emerald"><i class="fa-solid fa-circle-check"></i> Auditoría aprobada</span>
              </div>
            </div>

            <div class="kpi-card shadow-card">
              <div class="kpi-icon icon-purple">
                <i class="fa-solid fa-users"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Usuarios Autenticados</span>
                <span class="kpi-value">{{ users.length }}</span>
                <span class="kpi-subtext text-purple"><i class="fa-solid fa-user-check"></i> Google OAuth</span>
              </div>
            </div>
          </div>

          <!-- Document Manager embedded in Overview -->
          <document-manager :documents="documents"></document-manager>
        </div>

        <!-- Documents Tab -->
        <div v-else-if="activeTab === 'documents'">
          <document-manager :documents="documents"></document-manager>
        </div>

        <!-- Users Tab -->
        <div v-else-if="activeTab === 'users'">
          <user-list :users="users" :roles="roles" @user-updated="$emit('reload-data')"></user-list>
        </div>

        <!-- Roles Tab -->
        <div v-else-if="activeTab === 'roles'">
          <role-manager :roles="roles" :users="users" @role-created="$emit('reload-data')"></role-manager>
        </div>

        <!-- Profile Tab -->
        <div v-else-if="activeTab === 'profile'" class="profile-tab-wrapper">
          <user-profile :user="user" :token="token" @logout="$emit('logout')"></user-profile>
        </div>
      </main>
    </div>
  `,
  data() {
    return {
      activeTab: 'overview'
    };
  },
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
