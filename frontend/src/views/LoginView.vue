<template>
  <section class="card glass-card shadow-lg login-card">
    <div class="brand-header">
      <div class="brand-logo shadow-gradient">
        <i class="fa-solid fa-shield-halved logo-icon"></i>
      </div>
      <h1 class="brand-title">Sistema de Gestión de Calidad</h1>
      <p class="brand-subtitle">Portal de Control Documental Institucional (QMS)</p>
    </div>

    <div class="divider">
      <span>Acceso Institucional</span>
    </div>

    <div class="auth-box">
      <div class="google-btn-container">
        <div v-if="sdkLoading" class="skeleton-loader">
          <div class="spinner"></div>
          <span>Cargando autenticación de Google...</span>
        </div>

        <div id="google-signin-btn-vue" v-show="!sdkLoading"></div>
      </div>

      <div class="demo-section">
        <button type="button" class="btn btn-secondary btn-full" @click="emit('demo-login')">
          <i class="fa-solid fa-flask"></i> Demostración (Modo Pruebas)
        </button>
      </div>
       
      <!-- Si el archivo env esta mal o no esta configurado correctamente, se muestra este mensaje -->
      <div v-if="isDefaultClientId" class="alert alert-warning shadow-sm">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Configuración requerida:</strong>
          <p>Configura tu <code>GOOGLE_CLIENT_ID</code> en el archivo <code>backend/.env</code> para habilitar la autenticación real con Google Cloud.</p>
        </div>
      </div>

      <div v-if="statusMessage" :class="['status-msg', statusType, 'shadow-sm']">
        <i :class="statusIcon"></i> {{ statusMessage }}
      </div>
    </div>

    <footer class="card-footer">
      <p><i class="fa-solid fa-lock"></i> Autenticación cifrada mediante OAuth 2.0 & JWT</p>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  googleClientId: { type: String, default: '' },
  statusMessage: { type: String, default: '' },
  statusType: { type: String, default: 'info' },
  isLoading: { type: Boolean, default: false }
});

const emit = defineEmits(['google-success', 'google-error', 'demo-login']);
const sdkLoading = ref(true);

const isDefaultClientId = computed(() => {
  return !props.googleClientId || props.googleClientId.includes('YOUR_GOOGLE_CLIENT_ID');
});

const statusIcon = computed(() => {
  if (props.statusType === 'error') return 'fa-solid fa-circle-xmark';
  if (props.statusType === 'success') return 'fa-solid fa-circle-check';
  return 'fa-solid fa-circle-info';
});

onMounted(() => { initGoogleSdk(); });
watch(() => props.googleClientId, () => { initGoogleSdk(); });

function initGoogleSdk() {
  const targetClientId = (!isDefaultClientId.value) ? props.googleClientId : '1000000000000-placeholder.apps.googleusercontent.com';
  const interval = setInterval(() => {
    if (window.google && window.google.accounts) {
      clearInterval(interval);
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
    }
  }, 100);
}

function handleGoogleResponse(response) {
  if (response && response.credential) {
    emit('google-success', response.credential);
  } else {
    emit('google-error', 'Respuesta de credencial inválida de Google');
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

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
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
  color: var(--brand-green);
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

.demo-section {
  width: 100%;
  margin-top: 6px;
  margin-bottom: 6px;
}

.card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 11px;
  color: var(--text-subtle);
}
</style>
