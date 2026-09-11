<template>
  <div class="auth-layout-wrapper">
    <main class="auth-layout-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-layout-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  padding: 24px;
  background: var(--bg-main, #f8fafc);
  overflow-y: auto;
}

.auth-layout-content {
  width: 100%;
  max-width: 440px;
  display: flex;
  justify-content: center;
}
</style>
