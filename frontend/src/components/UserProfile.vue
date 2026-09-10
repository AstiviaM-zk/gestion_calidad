<template>
  <section class="card glass-card">
    <div class="user-header">
      <div class="avatar-container">
        <img :src="avatarUrl" :alt="user.name" class="user-avatar" @error="handleAvatarError">
        <span class="status-badge" title="Sesión activa"></span>
      </div>
      <div class="user-info">
        <span class="role-pill">
          <i class="fa-solid fa-circle-check"></i> Autenticado en Vue 3
        </span>
        <h2 class="user-name">{{ user.name || "Usuario Google" }}</h2>
        <p class="user-email">{{ user.email || "email@dominio.com" }}</p>
      </div>
    </div>

    <div class="session-details">
      <div class="detail-item">
        <span class="detail-label">
          <i class="fa-brands fa-google"></i> Google Sub ID
        </span>
        <span class="detail-value">{{ user.googleId || "N/A" }}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">
          <i class="fa-solid fa-key"></i> Token de Sesión JWT
        </span>
        <div class="token-box">
          <code>{{ token }}</code>
          <button class="icon-btn" title="Copiar Token" @click="copyToken">
            <i :class="copied ? 'fa-solid fa-check text-emerald' : 'fa-regular fa-copy'"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="emit('logout')">
        <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, default: "" }
});

const emit = defineEmits(["logout"]);
const copied = ref(false);

const avatarUrl = computed(() => {
  return props.user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
});

function handleAvatarError(e) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
}

async function copyToken() {
  if (props.token) {
    try {
      await navigator.clipboard.writeText(props.token);
      copied.value = true;
      setTimeout(() => { copied.value = false; }, 1800);
    } catch (err) { console.error("Error al copiar el token:", err); }
  }
}
</script>