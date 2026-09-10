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
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  user: { type: Object, default: () => null }
});

const userAvatar = computed(() => {
  return props.user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
});

function onAvatarError(e) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
}
</script>