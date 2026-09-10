<template>
  <section class="card glass-card shadow-lg">
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

      <div v-if="isDefaultClientId" class="alert alert-warning shadow-sm">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <div>
          <strong>Configuración requerida:</strong>
          <p>Configura tu <code>GOOGLE_CLIENT_ID</code> en el archivo <code>.env</code> para habilitar la autenticación real con Google Cloud.</p>
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

const emit = defineEmits(['google-success', 'google-error']);
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