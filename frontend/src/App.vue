<template>
  <div class="app-root">
    <!-- Layout de Autenticación (Público) -->
    <AuthLayout v-if="!isAuthenticated">
      <LoginView 
        :google-client-id="googleClientId"
        :status-message="statusMessage"
        :status-type="statusType"
        :is-loading="isLoading"
        @google-success="handleGoogleSuccess"
        @demo-login="handleDemoLogin"
      />
    </AuthLayout>

    <!-- Layout del Sistema Interno (Privado) -->
    <AppLayout 
      v-else 
      :user="user" 
      :active-tab="activeTab"
      :documents-count="documents.length"
      :users-count="users.length"
      :roles-count="roles.length"
      @logout="handleLogout"
      @select-tab="activeTab = $event"
    >
      <DashboardView 
        :user="user" 
        :token="token" 
        :active-tab="activeTab"
        :documents="documents"
        :users="users"
        :roles="roles"
        @change-tab="activeTab = $event"
        @logout="handleLogout"
        @reload-data="fetchData"
      />
    </AppLayout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AuthLayout from './layouts/AuthLayout.vue';
import AppLayout from './layouts/AppLayout.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

const isAuthenticated = ref(false);
const user = ref(null);
const token = ref('');
const googleClientId = ref('');
const statusMessage = ref('');
const statusType = ref('info');
const isLoading = ref(false);
const activeTab = ref('overview');

const documents = ref([]);
const users = ref([]);
const roles = ref([]);

onMounted(async () => {
  // Restore session from sessionStorage
  const savedToken = sessionStorage.getItem('qms_token');
  const savedUser = sessionStorage.getItem('qms_user');
  if (savedToken && savedUser) {
    try {
      token.value = savedToken;
      user.value = JSON.parse(savedUser);
      isAuthenticated.value = true;
      fetchData();
    } catch (e) {
      sessionStorage.removeItem('qms_token');
      sessionStorage.removeItem('qms_user');
    }
  }

  // Fetch Google Client ID from backend
  try {
    const res = await fetch('/api/auth/config');
    const data = await res.json();
    if (data && data.googleClientId) {
      googleClientId.value = data.googleClientId;
    }
  } catch (err) {
    console.error('Error cargando configuración de autenticación:', err);
  }
});

async function fetchData() {
  try {
    const [docsRes, usersRes, rolesRes] = await Promise.all([
      fetch('/api/documents').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/roles').then(r => r.json())
    ]);
    if (docsRes.success) documents.value = docsRes.documents;
    if (usersRes.success) users.value = usersRes.users;
    if (rolesRes.success) roles.value = rolesRes.roles;
  } catch (err) {
    console.error('Error cargando datos del sistema:', err);
  }
}

async function handleGoogleSuccess(credential) {
  isLoading.value = true;
  statusMessage.value = 'Autenticando credencial con backend...';
  statusType.value = 'info';

  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();

    if (data.success) {
      token.value = data.token;
      user.value = data.user;
      isAuthenticated.value = true;
      sessionStorage.setItem('qms_token', data.token);
      sessionStorage.setItem('qms_user', JSON.stringify(data.user));
      statusMessage.value = '';
      fetchData();
    } else {
      statusMessage.value = data.message || 'Error durante la autenticación de Google';
      statusType.value = 'error';
    }
  } catch (err) {
    console.error('Error en login de Google:', err);
    statusMessage.value = 'Error de conexión con el servidor backend';
    statusType.value = 'error';
  } finally {
    isLoading.value = false;
  }
}

function handleDemoLogin() {
  const demoUser = {
    id: 'USR-001',
    googleId: '1098234710928374',
    name: 'Ing. Carlos Mendoza (Demostración)',
    email: 'carlos.mendoza@institucion.gob.mx',
    picture: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=1e3a8a&color=fff',
    role: 'Administrador',
    status: 'Activo',
    lastLogin: new Date().toISOString()
  };
  const demoToken = 'demo-jwt-token-vue3';

  token.value = demoToken;
  user.value = demoUser;
  isAuthenticated.value = true;
  sessionStorage.setItem('qms_token', demoToken);
  sessionStorage.setItem('qms_user', JSON.stringify(demoUser));
  fetchData();
}

function handleLogout() {
  isAuthenticated.value = false;
  user.value = null;
  token.value = '';
  sessionStorage.removeItem('qms_token');
  sessionStorage.removeItem('qms_user');
}
</script>
