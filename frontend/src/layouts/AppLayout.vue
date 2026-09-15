<template>
  <div class="app-layout-wrapper">
    <header class="app-layout-header">
      <AppNavbar />
    </header>

    <main class="app-layout-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppNavbar from '../components/AppNavbar.vue';
</script>

<style scoped>
.app-layout-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-main, #f8fafc);
  scrollbar-gutter: stable;
}

.app-layout-header {
  width: 100%;
  flex-shrink: 0;
  padding: 12px 24px 0 24px;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
  z-index: 20;
}

.app-layout-content {
  flex: 1;
  height: calc(100vh - 80px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 20px 24px;
  box-sizing: border-box;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}
</style>
