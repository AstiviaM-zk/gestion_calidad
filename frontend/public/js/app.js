/**
 * QMS Vue 3 Application Main Script (With Roles & Permissions)
 */

const { createApp, ref, onMounted } = Vue;

const app = createApp({
  components: {
    AppNavbar,
    LoginCard,
    UserProfile,
    DocumentManager,
    UserList,
    RoleManager,
    AdminDashboard
  },
  setup() {
    // Reactive State
    const isAuthenticated = ref(false);
    const currentUser = ref(null);
    const jwtToken = ref('');
    const googleClientId = ref('');
    const statusMessage = ref('');
    const statusType = ref('info');
    const isLoading = ref(false);

    // Dashboard Data
    const documents = ref([]);
    const stats = ref({});
    const users = ref([]);
    const roles = ref([]);

    // Lifecycle Hook
    onMounted(async () => {
      // 1. Check for saved JWT token in localStorage
      const savedToken = localStorage.getItem('qms_token');
      if (savedToken) {
        const valid = await verifySession(savedToken);
        if (valid) {
          await loadDashboardData();
          return;
        }
      }

      // 2. Fetch backend configuration
      await fetchConfig();
    });

    /**
     * Fetch API Configuration from Express Backend
     */
    async function fetchConfig() {
      try {
        const response = await fetch('/api/auth/config');
        const data = await response.json();
        googleClientId.value = data.googleClientId || '';
      } catch (err) {
        console.error('Error al cargar la configuración de la API:', err);
        setStatus('Error de conexión con el servidor backend', 'error');
      }
    }

    /**
     * Load Documents, Stats, Users and Roles data from API
     */
    async function loadDashboardData() {
      try {
        const [docsRes, statsRes, usersRes, rolesRes] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/stats'),
          fetch('/api/users'),
          fetch('/api/roles')
        ]);

        const docsData = await docsRes.json();
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();

        if (docsData.success) documents.value = docsData.documents;
        if (statsData.success) stats.value = statsData.stats;
        if (usersData.success) users.value = usersData.users;
        if (rolesData.success) roles.value = rolesData.roles;
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      }
    }

    /**
     * Handles Google Credential response from LoginCard component
     */
    async function onGoogleSuccess(credential) {
      isLoading.value = true;
      setStatus('Verificando credencial de Google...', 'info');

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ credential })
        });

        const data = await res.json();

        if (data.success && data.token) {
          localStorage.setItem('qms_token', data.token);
          jwtToken.value = data.token;
          currentUser.value = data.user;
          
          setStatus('¡Autenticación exitosa! Accediendo al Panel Admin...', 'success');
          
          await loadDashboardData();

          setTimeout(() => {
            isAuthenticated.value = true;
            isLoading.value = false;
            clearStatus();
          }, 600);
        } else {
          isLoading.value = false;
          setStatus(data.message || 'Fallo en la autenticación con Google', 'error');
        }
      } catch (err) {
        console.error('Error enviando credenciales a la API:', err);
        isLoading.value = false;
        setStatus('Error al conectar con la API de autenticación', 'error');
      }
    }

    function onGoogleError(errMsg) {
      setStatus(errMsg, 'error');
    }

    /**
     * Verifies stored JWT token with Express backend
     */
    async function verifySession(token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success && data.user) {
          jwtToken.value = token;
          currentUser.value = data.user;
          isAuthenticated.value = true;
          return true;
        } else {
          localStorage.removeItem('qms_token');
          return false;
        }
      } catch (err) {
        console.error('Error verificando la sesión:', err);
        localStorage.removeItem('qms_token');
        return false;
      }
    }

    /**
     * Log out user
     */
    function handleLogout() {
      localStorage.removeItem('qms_token');
      jwtToken.value = '';
      currentUser.value = null;
      isAuthenticated.value = false;

      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }

      clearStatus();
      fetchConfig();
    }

    /**
     * Helpers for Status Messages
     */
    function setStatus(msg, type = 'info') {
      statusMessage.value = msg;
      statusType.value = type;
    }

    function clearStatus() {
      statusMessage.value = '';
      statusType.value = 'info';
    }

    return {
      isAuthenticated,
      currentUser,
      jwtToken,
      googleClientId,
      statusMessage,
      statusType,
      isLoading,
      documents,
      stats,
      users,
      roles,
      loadDashboardData,
      onGoogleSuccess,
      onGoogleError,
      handleLogout
    };
  }
});

app.mount('#app');
