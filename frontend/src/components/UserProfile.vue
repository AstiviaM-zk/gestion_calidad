<template>
  <section class="user-profile-card">
    <div class="profile-hero">
      <div class="avatar-wrapper">
        <div class="avatar-ring">
          <img :src="avatarUrl" :alt="currentUser.name" class="user-avatar-lg" @error="handleAvatarError">
        </div>
        <span class="status-badge-online" title="Sesión activa en el sistema"></span>
      </div>
      
      <div class="profile-main-info">
        <span class="profile-role-pill">
          <i class="fa-solid fa-shield-check"></i> {{ currentUser.role || 'Usuario Autenticado (OAuth 2.0)' }}
        </span>
        <h2 class="profile-name">{{ currentUser.name || "Usuario Institucional" }}</h2>
        <p class="profile-email">
          <i class="fa-regular fa-envelope"></i> {{ currentUser.email || "email@dominio.com" }}
        </p>
      </div>
    </div>

    <div class="profile-details-grid">
      <div class="profile-detail-card">
        <div class="detail-label-box">
          <i class="fa-brands fa-google"></i>
          <span>Google Subject Identifier (Sub ID)</span>
        </div>
        <span class="detail-value-text">{{ currentUser.googleId || currentUser.id || "N/A" }}</span>
      </div>

      <div class="profile-detail-card">
        <div class="detail-label-box">
          <i class="fa-solid fa-key"></i>
          <span>Token de Sesión Activa (JWT)</span>
        </div>
        <div class="token-container">
          <code class="token-code">{{ currentToken || "Token no disponible" }}</code>
          <button 
            type="button" 
            :class="['btn-copy-token', { copied }]" 
            title="Copiar Token al portapapeles" 
            @click="copyToken"
          >
            <i :class="copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
            <span>{{ copied ? '¡Copiado!' : 'Copiar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="profile-actions">
      <button type="button" class="btn btn-secondary" @click="handleLogout">
        <i class="fa-solid fa-right-from-bracket text-red"></i>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const props = defineProps({
  user: { type: Object, default: null },
  token: { type: String, default: "" }
});

const router = useRouter();
const authStore = useAuthStore();
const copied = ref(false);

const currentUser = computed(() => props.user || authStore.user || {});
const currentToken = computed(() => props.token || authStore.token || "");

const avatarUrl = computed(() => {
  return currentUser.value?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.value?.name || "User") + "&background=1e3a8a&color=fff";
});

function handleAvatarError(e) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentUser.value?.name || "User") + "&background=1e3a8a&color=fff";
}

async function copyToken() {
  if (currentToken.value) {
    try {
      await navigator.clipboard.writeText(currentToken.value);
      copied.value = true;
      setTimeout(() => { copied.value = false; }, 1800);
    } catch (err) { console.error("Error al copiar el token:", err); }
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.user-profile-card {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  box-shadow: var(--shadow-card);
  transition: var(--transition);
}

.user-profile-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: rgba(30, 58, 138, 0.2);
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-light);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-ring {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  padding: 3px;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-gradient);
}

.user-avatar-lg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #ffffff;
  border: 2px solid #ffffff;
}

.status-badge-online {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background-color: var(--brand-green);
  border: 2.5px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(117, 186, 33, 0.6);
}

.profile-main-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-role-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(30, 58, 138, 0.08);
  border: 1px solid rgba(30, 58, 138, 0.15);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-name {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.4px;
  line-height: 1.2;
}

.profile-email {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-details-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-detail-card {
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-label-box i {
  color: var(--primary);
  font-size: 13px;
}

.detail-value-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  word-break: break-all;
}

.token-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

.token-code {
  flex: 1;
  font-family: monospace;
  font-size: 12px;
  color: var(--text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-copy-token {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.btn-copy-token:hover {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

.btn-copy-token.copied {
  background: rgba(117, 186, 33, 0.15);
  color: #558718;
  border-color: rgba(117, 186, 33, 0.4);
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

@media (max-width: 600px) {
  .user-profile-card {
    padding: 24px 18px;
  }
  .profile-hero {
    flex-direction: column;
    text-align: center;
    gap: 14px;
  }
  .profile-role-pill {
    align-self: center;
  }
  .profile-actions {
    justify-content: center;
  }
}
</style>