<template>
  <div class="app-container">
    <AppNavbar 
      v-if="isAuthenticated" 
      :user="user" 
      @logout="handleLogout" 
    />

    <main class="main-content">
      <LoginView 
        v-if="!isAuthenticated" 
        @login-success="handleLoginSuccess" 
      />

      <DashboardView 
        v-else 
        :user="user" 
        :token="token" 
        @logout="handleLogout" 
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppNavbar from './components/AppNavbar.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

const isAuthenticated = ref(false);
const user = ref(null);
const token = ref('');

onMounted(() => {
  const savedToken = sessionStorage.getItem('qms_token');
  const savedUser = sessionStorage.getItem('qms_user');
  if (savedToken && savedUser) {
    try {
      token.value = savedToken;
      user.value = JSON.parse(savedUser);
      isAuthenticated.value = true;
    } catch (e) {
      sessionStorage.removeItem('qms_token');
      sessionStorage.removeItem('qms_user');
    }
  }
});

function handleLoginSuccess(authData) {
  token.value = authData.token;
  user.value = authData.user;
  isAuthenticated.value = true;
  sessionStorage.setItem('qms_token', authData.token);
  sessionStorage.setItem('qms_user', JSON.stringify(authData.user));
}

function handleLogout() {
  isAuthenticated.value = false;
  user.value = null;
  token.value = '';
  sessionStorage.removeItem('qms_token');
  sessionStorage.removeItem('qms_user');
}
</script>
