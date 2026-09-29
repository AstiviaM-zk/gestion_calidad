<template>
  <section class="card glass-card shadow-lg login-card">
    <div class="brand-header">
      <div class="brand-logo shadow-gradient">
        <i class="fa-solid fa-shield-halved logo-icon"></i>
      </div>
      <h1 class="brand-title">Sistema de Gestión de Calidad</h1>
      <p class="brand-subtitle">Portal de Control Documental Institucional (QMS)</p>
    </div>

    <!-- Pestañas para cambiar entre Login y Registro -->
    <div class="auth-tabs">
      <button 
        type="button" 
        :class="['tab-btn', { active: !isRegisterMode }]" 
        @click="switchTab(false)"
      >
        <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
      </button>
      <button 
        type="button" 
        :class="['tab-btn', { active: isRegisterMode }]" 
        @click="switchTab(true)"
      >
        <i class="fa-solid fa-user-plus"></i> Regístrate
      </button>
    </div>

    <!-- Formulario de Iniciar Sesión -->
    <form v-if="!isRegisterMode" @submit.prevent="handleFormLogin" class="auth-form" novalidate>
      <div class="form-group">
        <label for="login-email">Correo Electrónico</label>
        <div class="input-icon-wrapper">
          <i class="fa-solid fa-envelope input-icon"></i>
          <input 
            id="login-email"
            v-model.trim="loginEmail"
            type="email"
            class="form-control"
            :class="{ 'is-invalid': loginEmailTouched && !isLoginEmailValid }"
            placeholder="ejemplo@institucion.gob.mx"
            @blur="loginEmailTouched = true"
            @input="loginEmailTouched = true"
            required
          />
        </div>
        <span v-if="loginEmailTouched && !isLoginEmailValid" class="field-error-msg">
          <i class="fa-solid fa-circle-exclamation"></i> Ingresa un correo electrónico válido (ejemplo@dominio.com)
        </span>
      </div>

      <div class="form-group">
        <label for="login-password">Contraseña</label>
        <div class="input-icon-wrapper">
          <i class="fa-solid fa-lock input-icon"></i>
          <input 
            id="login-password"
            v-model="loginPassword"
            :type="showLoginPassword ? 'text' : 'password'"
            class="form-control"
            placeholder="••••••••"
            required
          />
          <button 
            type="button" 
            class="toggle-password-btn"
            @click="showLoginPassword = !showLoginPassword"
            :title="showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-label="showLoginPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <i :class="showLoginPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        class="btn btn-primary btn-full submit-btn"
        :disabled="isLoading || (loginEmailTouched && !isLoginEmailValid) || !loginEmail || !loginPassword"
      >
        <span v-if="isLoading" class="spinner-sm"></span>
        <span v-else><i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión</span>
      </button>
    </form>

    <!-- Formulario de Registro -->
    <form v-else @submit.prevent="handleFormRegister" class="auth-form" novalidate>
      <div class="form-group">
        <label for="reg-name">Nombre Completo</label>
        <div class="input-icon-wrapper">
          <i class="fa-solid fa-user input-icon"></i>
          <input 
            id="reg-name"
            v-model="regName"
            type="text"
            class="form-control"
            placeholder="Ej. Ing. Carlos Mendoza"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="reg-email">Correo Electrónico</label>
        <div class="input-icon-wrapper">
          <i class="fa-solid fa-envelope input-icon"></i>
          <input 
            id="reg-email"
            v-model.trim="regEmail"
            type="email"
            class="form-control"
            :class="{ 'is-invalid': regEmailTouched && !isRegEmailValid }"
            placeholder="ejemplo@institucion.gob.mx"
            @blur="regEmailTouched = true"
            @input="regEmailTouched = true"
            required
          />
        </div>
        <span v-if="regEmailTouched && !isRegEmailValid" class="field-error-msg">
          <i class="fa-solid fa-circle-exclamation"></i> Ingresa un correo electrónico válido (ejemplo@dominio.com)
        </span>
      </div>

      <div class="form-group">
        <label for="reg-password">Contraseña (Mín. 6 caracteres)</label>
        <div class="input-icon-wrapper">
          <i class="fa-solid fa-key input-icon"></i>
          <input 
            id="reg-password"
            v-model="regPassword"
            :type="showRegPassword ? 'text' : 'password'"
            class="form-control"
            placeholder="••••••••"
            required
          />
          <button 
            type="button" 
            class="toggle-password-btn"
            @click="showRegPassword = !showRegPassword"
            :title="showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-label="showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <i :class="showRegPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        class="btn btn-success btn-full submit-btn"
        :disabled="isLoading || (regEmailTouched && !isRegEmailValid) || !regName || !regEmail || !regPassword"
      >
        <span v-if="isLoading" class="spinner-sm"></span>
        <span v-else><i class="fa-solid fa-user-check"></i> Crear Cuenta</span>
      </button>
    </form>

    <div class="divider">
      <span>O continúa con</span>
    </div>

    <!-- Google Login Container -->
    <div class="auth-box">
      <div class="google-btn-container">
        <div v-if="sdkLoading" class="skeleton-loader">
          <div class="spinner"></div>
          <span>Cargando autenticación de Google...</span>
        </div>

        <div id="google-signin-btn-vue" v-show="!sdkLoading"></div>
      </div>
       
      <!-- Alerta si Client ID es explícitamente el placeholder -->
      <div v-if="isDefaultClientId" class="alert alert-warning shadow-sm">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Configuración requerida:</strong>
          <p>Configura tu <code>GOOGLE_CLIENT_ID</code> en el archivo <code>backend/.env</code> para habilitar la autenticación real con Google Cloud.</p>
        </div>
      </div>
    </div>

    <footer class="card-footer">
      <p><i class="fa-solid fa-lock"></i> Autenticación cifrada mediante OAuth 2.0 & JWT</p>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const sdkLoading = ref(true);

const isRegisterMode = ref(false);

// Form Inputs
const loginEmail = ref('');
const loginPassword = ref('');
const showLoginPassword = ref(false);
const loginEmailTouched = ref(false);

const regName = ref('');
const regEmail = ref('');
const regPassword = ref('');
const showRegPassword = ref(false);
const regEmailTouched = ref(false);

// Email Regex Validation Pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isLoginEmailValid = computed(() => {
  if (!loginEmail.value) return false;
  return EMAIL_REGEX.test(loginEmail.value);
});

const isRegEmailValid = computed(() => {
  if (!regEmail.value) return false;
  return EMAIL_REGEX.test(regEmail.value);
});

const googleClientId = computed(() => authStore.googleClientId);
const statusMessage = computed(() => authStore.statusMessage);
const statusType = computed(() => authStore.statusType);
const isLoading = computed(() => authStore.isLoading);

const isDefaultClientId = computed(() => {
  return !googleClientId.value || googleClientId.value.includes('YOUR_GOOGLE_CLIENT_ID');
});

const statusIcon = computed(() => {
  if (statusType.value === 'error') return 'fa-solid fa-circle-xmark';
  if (statusType.value === 'success') return 'fa-solid fa-circle-check';
  return 'fa-solid fa-circle-info';
});

function switchTab(registerState) {
  isRegisterMode.value = registerState;
  authStore.statusMessage = '';
}

onMounted(() => {
  authStore.fetchAuthConfig().then(() => {
    initGoogleSdk();
  }).catch(() => {
    initGoogleSdk();
  });
});

watch(googleClientId, () => {
  initGoogleSdk();
});

function initGoogleSdk() {
  const targetClientId = googleClientId.value;
  if (!targetClientId) {
    sdkLoading.value = false;
    return;
  }
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (window.google && window.google.accounts) {
      clearInterval(interval);
      try {
        window.google.accounts.id.initialize({
          client_id: targetClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        sdkLoading.value = false;
        nextTick(() => {
          const btnTarget = document.getElementById('google-signin-btn-vue');
          if (btnTarget) {
            btnTarget.innerHTML = '';
            window.google.accounts.id.renderButton(
              btnTarget,
              { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', logo_alignment: 'left', width: 320 }
            );
          }
        });
      } catch (err) {
        console.error('Error inicializando SDK de Google:', err);
        sdkLoading.value = false;
      }
    } else if (attempts > 50) {
      clearInterval(interval);
      sdkLoading.value = false;
    }
  }, 100);
}

async function handleGoogleResponse(response) {
  if (response && response.credential) {
    const success = await authStore.loginWithGoogle(response.credential);
    if (success) {
      router.push('/dashboard/overview');
    }
  }
}

async function handleFormLogin() {
  loginEmailTouched.value = true;
  if (!isLoginEmailValid.value) {
    authStore.statusMessage = 'Por favor ingresa un correo electrónico válido.';
    authStore.statusType = 'error';
    return;
  }
  const success = await authStore.loginWithForm(loginEmail.value, loginPassword.value);
  if (success) {
    router.push('/dashboard/overview');
  }
}

async function handleFormRegister() {
  regEmailTouched.value = true;
  if (!isRegEmailValid.value) {
    authStore.statusMessage = 'Por favor ingresa un correo electrónico válido.';
    authStore.statusType = 'error';
    return;
  }
  const success = await authStore.registerWithForm(regName.value, regEmail.value, regPassword.value);
  if (success) {
    router.push('/dashboard/overview');
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  box-shadow: var(--shadow-lg);
  transition: var(--transition);
}

.login-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(30, 58, 138, 0.3);
}

.brand-header {
  text-align: center;
  margin-bottom: 20px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 14px auto;
  background: var(--primary-gradient);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-gradient);
}

.logo-icon {
  font-size: 28px;
  color: #ffffff;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
  margin-bottom: 4px;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

/* Auth Tabs */
.auth-tabs {
  display: flex;
  background: rgba(241, 245, 249, 0.8);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 22px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn.active {
  background: #ffffff;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-weight: 700;
}

.tab-btn:hover:not(.active) {
  color: var(--primary);
  background: rgba(255, 255, 255, 0.5);
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-heading, #1e293b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
}

.form-control {
  width: 100%;
  padding: 11px 40px 11px 38px;
  font-size: 14px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.toggle-password-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: color 0.2s ease;
}

.toggle-password-btn:hover {
  color: var(--primary, #1e3a8a);
}

.form-control:focus {
  outline: none;
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}

.form-control.is-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-control.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.field-error-msg {
  font-size: 12px;
  color: #dc2626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.submit-btn {
  margin-top: 6px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner-sm {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0 16px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-light);
}

.divider span {
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.auth-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.google-btn-container {
  width: 100%;
  display: flex;
  justify-content: center;
  min-height: 44px;
}

.skeleton-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: 13px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(30, 58, 138, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: var(--text-subtle);
}

.alert-warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-align: left;
}

.status-msg {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}

.status-msg.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-msg.info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}
</style>
