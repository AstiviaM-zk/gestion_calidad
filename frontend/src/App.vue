<template>
  <div class="app-root">
    <AuthLayout v-if="!authStore.isAuthenticated">
      <router-view />
    </AuthLayout>
    <AppLayout v-else>
      <router-view />
    </AppLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import AuthLayout from './layouts/AuthLayout.vue';
import AppLayout from './layouts/AppLayout.vue';

const authStore = useAuthStore();

onMounted(() => {
  authStore.fetchAuthConfig();
});
</script>

<style>
.app-root {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
