import fs from "fs";

const appVueCode = `<template>
  <div id="app">
    <!-- Navbar Component (Visible únicamente tras iniciar sesión) -->
    <AppNavbar 
      v-if="isAuthenticated"
      :is-authenticated="isAuthenticated" 
      :user="currentUser"
    />

    <div :class="["app-layout-wrapper", { "authenticated-layout": isAuthenticated }]">
      <!-- Vue Transition for smooth view switching -->
      <transition name="fade-slide" mode="out-in">
        <!-- View 1: Login Card Component (Unauthenticated) -->
        <main v-if="!isAuthenticated" key="login" class="login-wrapper">
          <LoginCard
            :google-client-id="googleClientId"
            :status-message="statusMessage"
            :status-type="statusType"
            :is-loading="isLoading"
            @google-success="onGoogleSuccess"
            @google-error="onGoogleError"
          />
        </main>

        <!-- View 2: Admin Dashboard Component (Authenticated) -->
        <div v-else key="admin" class="admin-wrapper">
          <AdminDashboard
            :user="currentUser"
            :token="jwtToken"
            :stats="stats"
            :documents="documents"
            :users="users"
            :roles="roles"
            @reload-data="loadDashboardData"
            @logout="handleLogout"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AppNavbar from "./components/AppNavbar.vue";
import LoginCard from "./components/LoginCard.vue";
import AdminDashboard from "./components/AdminDashboard.vue";

const isAuthenticated = ref(false);
const currentUser = ref(null);
const jwtToken = ref("");
const googleClientId = ref("");
const statusMessage = ref("");
const statusType = ref("info");
const isLoading = ref(false);

const documents = ref([]);
const stats = ref({});
const users = ref([]);
const roles = ref([]);

onMounted(async () => {
  const savedToken = localStorage.getItem("qms_token");
  if (savedToken) {
    const valid = await verifySession(savedToken);
    if (valid) {
      await loadDashboardData();
      return;
    }
  }
  await fetchConfig();
});

async function fetchConfig() {
  try {
    const response = await fetch("/api/auth/config");
    const data = await response.json();
    googleClientId.value = data.googleClientId || "";
  } catch (err) {
    console.error("Error cargando configuración:", err);
    setStatus("Error de conexión con el servidor backend", "error");
  }
}

async function loadDashboardData() {
  try {
    const [docsRes, statsRes, usersRes, rolesRes] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/stats"),
      fetch("/api/users"),
      fetch("/api/roles")
    ]);
    const docsData = await docsRes.json();
    const statsData = await statsRes.json();
    const usersData = await usersRes.json();
    const rolesData = await rolesRes.json();

    if (docsData.success) documents.value = docsData.documents;
    if (statsData.success) stats.value = statsData.stats;
    if (usersData.success) users.value = usersData.users;
    if (rolesData.success) roles.value = rolesData.roles;
  } catch (err) {
    console.error("Error al cargar datos del dashboard:", err);
  }
}

async function onGoogleSuccess(credential) {
  isLoading.value = true;
  setStatus("Verificando credencial de Google...", "info");
  try {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("qms_token", data.token);
      jwtToken.value = data.token;
      currentUser.value = data.user;
      setStatus("¡Autenticación exitosa! Accediendo...", "success");
      await loadDashboardData();
      setTimeout(() => {
        isAuthenticated.value = true;
        isLoading.value = false;
        clearStatus();
      }, 600);
    } else {
      isLoading.value = false;
      setStatus(data.message || "Fallo en la autenticación con Google", "error");
    }
  } catch (err) {
    console.error("Error enviando credenciales a la API:", err);
    isLoading.value = false;
    setStatus("Error al conectar con la API de autenticación", "error");
  }
}

function onGoogleError(errMsg) { setStatus(errMsg, "error"); }

async function verifySession(token) {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    if (data.success && data.user) {
      jwtToken.value = token;
      currentUser.value = data.user;
      isAuthenticated.value = true;
      return true;
    } else {
      localStorage.removeItem("qms_token");
      return false;
    }
  } catch (err) {
    localStorage.removeItem("qms_token");
    return false;
  }
}

function handleLogout() {
  localStorage.removeItem("qms_token");
  jwtToken.value = "";
  currentUser.value = null;
  isAuthenticated.value = false;
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  clearStatus();
  fetchConfig();
}

function setStatus(msg, type = "info") {
  statusMessage.value = msg;
  statusType.value = type;
}

function clearStatus() {
  statusMessage.value = "";
  statusType.value = "info";
}
</script>`;

fs.writeFileSync("c:/Ti/develop/GestorDoctos/gestion_calidad/src/App.vue", appVueCode, "utf-8");
console.log("App.vue created successfully");

