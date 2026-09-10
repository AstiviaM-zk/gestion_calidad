import fs from "fs";
import path from "path";

const compDir = "c:/Ti/develop/GestorDoctos/gestion_calidad/src/components";

const components = {
  "AppNavbar.vue": `<template>
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
</script>`,

  "LoginCard.vue": `<template>
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

      <div v-if="statusMessage" :class="["status-msg", statusType, "shadow-sm"]">
        <i :class="statusIcon"></i> {{ statusMessage }}
      </div>
    </div>

    <footer class="card-footer">
      <p><i class="fa-solid fa-lock"></i> Autenticación cifrada mediante OAuth 2.0 & JWT</p>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";

const props = defineProps({
  googleClientId: { type: String, default: "" },
  statusMessage: { type: String, default: "" },
  statusType: { type: String, default: "info" },
  isLoading: { type: Boolean, default: false }
});

const emit = defineEmits(["google-success", "google-error"]);
const sdkLoading = ref(true);

const isDefaultClientId = computed(() => {
  return !props.googleClientId || props.googleClientId.includes("YOUR_GOOGLE_CLIENT_ID");
});

const statusIcon = computed(() => {
  if (props.statusType === "error") return "fa-solid fa-circle-xmark";
  if (props.statusType === "success") return "fa-solid fa-circle-check";
  return "fa-solid fa-circle-info";
});

onMounted(() => { initGoogleSdk(); });
watch(() => props.googleClientId, () => { initGoogleSdk(); });

function initGoogleSdk() {
  const targetClientId = (!isDefaultClientId.value) ? props.googleClientId : "1000000000000-placeholder.apps.googleusercontent.com";
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
        const btnTarget = document.getElementById("google-signin-btn-vue");
        if (btnTarget) {
          btnTarget.innerHTML = "";
          window.google.accounts.id.renderButton(
            btnTarget,
            { type: "standard", theme: "outline", size: "large", text: "signin_with", shape: "pill", logo_alignment: "left", width: 320 }
          );
        }
      });
    }
  }, 100);
}

function handleGoogleResponse(response) {
  if (response && response.credential) {
    emit("google-success", response.credential);
  } else {
    emit("google-error", "Respuesta de credencial inválida de Google");
  }
}
</script>`,

  "UserProfile.vue": `<template>
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
            <i :class="copied ? "fa-solid fa-check text-emerald" : "fa-regular fa-copy""></i>
          </button>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="emit("logout")">
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
</script>`,

  "DocumentManager.vue": `<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-file-contract"></i> Gestor de Documentos QMS</h3>
        <p class="section-subtitle">Control de versiones, procedimientos e instructivos de calidad</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="createDocument">
        <i class="fa-solid fa-plus"></i> Nuevo Documento
      </button>
    </div>

    <div class="table-controls">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar por título, ID o autor..." 
          class="input-search"
        >
      </div>

      <div class="filter-pills">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          :class="["pill-btn", { active: activeFilter === filter.value }]"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div class="table-container shadow-card">
      <table class="qms-table">
        <thead>
          <tr>
            <th>Código ID</th>
            <th>Título del Documento</th>
            <th>Categoría</th>
            <th>Versión</th>
            <th>Estado</th>
            <th>Autor / Responsable</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td class="font-mono text-sm font-bold text-primary">{{ doc.id }}</td>
            <td>
              <div class="doc-title-cell">
                <i :class="getFileIcon(doc.type)" class="doc-icon"></i>
                <div>
                  <div class="doc-title">{{ doc.title }}</div>
                  <div class="doc-size">{{ doc.size }} • {{ doc.type }}</div>
                </div>
              </div>
            </td>
            <td><span class="category-badge">{{ doc.category }}</span></td>
            <td><span class="version-badge">{{ doc.version }}</span></td>
            <td>
              <span :class="["status-pill", getStatusClass(doc.status)]">
                <i :class="getStatusIcon(doc.status)"></i> {{ doc.status }}
              </span>
            </td>
            <td class="text-subtle text-sm">{{ doc.author }}</td>
            <td class="text-subtle text-sm">{{ doc.updatedAt }}</td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" title="Ver Documento" @click="viewDoc(doc)">
                  <i class="fa-regular fa-eye"></i>
                </button>
                <button class="action-btn" title="Descargar" @click="downloadDoc(doc)">
                  <i class="fa-solid fa-download"></i>
                </button>
                <button class="action-btn" title="Editar" @click="editDoc(doc)">
                  <i class="fa-regular fa-pen-to-square"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDocuments.length === 0">
            <td colspan="8" class="text-center empty-state">
              <i class="fa-solid fa-folder-open empty-icon"></i>
              <p>No se encontraron documentos con los criterios de búsqueda.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  documents: { type: Array, default: () => [] }
});

const searchQuery = ref("");
const activeFilter = ref("all");

const filters = [
  { label: "Todos", value: "all" },
  { label: "Aprobados", value: "Aprobado" },
  { label: "En Revisión", value: "En Revisión" },
  { label: "Borradores", value: "Borrador" }
];

const filteredDocuments = computed(() => {
  return props.documents.filter(doc => {
    const matchesFilter = activeFilter.value === "all" || doc.status === activeFilter.value;
    const query = searchQuery.value.toLowerCase();
    const matchesSearch = doc.title.toLowerCase().includes(query) ||
                          doc.id.toLowerCase().includes(query) ||
                          doc.author.toLowerCase().includes(query) ||
                          doc.category.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
});

function getFileIcon(type) {
  if (type === "PDF") return "fa-regular fa-file-pdf text-red";
  if (type === "DOCX") return "fa-regular fa-file-word text-blue";
  if (type === "XLSX") return "fa-regular fa-file-excel text-green";
  return "fa-regular fa-file";
}

function getStatusClass(status) {
  if (status === "Aprobado") return "status-approved";
  if (status === "En Revisión") return "status-pending";
  return "status-draft";
}

function getStatusIcon(status) {
  if (status === "Aprobado") return "fa-solid fa-circle-check";
  if (status === "En Revisión") return "fa-solid fa-clock";
  return "fa-solid fa-pen";
}

function viewDoc(doc) { alert("Visualizando: " + doc.title); }
function downloadDoc(doc) { alert("Descargando: " + doc.title); }
function editDoc(doc) { alert("Editando: " + doc.id); }
function createDocument() { alert("Alta de nuevo documento QMS"); }
</script>`,

  "UserList.vue": `<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-users-gear"></i> Usuarios Autenticados y Asignación de Roles</h3>
        <p class="section-subtitle">Asigna y modifica roles (Administrador, Usuario, Auditor) para los usuarios autenticados con Google</p>
      </div>
    </div>

    <div class="table-container shadow-card">
      <table class="qms-table">
        <thead>
          <tr>
            <th>ID Sistema</th>
            <th>Usuario Google</th>
            <th>Correo Electrónico</th>
            <th>Rol Asignado</th>
            <th>Último Acceso</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.email">
            <td class="font-mono text-sm font-bold text-primary">{{ user.id }}</td>
            <td>
              <div class="user-cell">
                <img :src="user.picture" :alt="user.name" class="user-cell-avatar" @error="onAvatarError($event, user.name)">
                <span class="user-cell-name">{{ user.name }}</span>
              </div>
            </td>
            <td class="text-subtle font-mono text-sm">{{ user.email }}</td>
            <td>
              <div class="role-select-wrapper">
                <select 
                  v-model="user.role" 
                  class="role-select" 
                  @change="onRoleChange(user)"
                >
                  <option v-for="r in roleOptions" :key="r.name" :value="r.name">
                    {{ r.name }}
                  </option>
                </select>
              </div>
            </td>
            <td class="text-subtle text-sm">{{ formatDate(user.lastLogin) }}</td>
            <td>
              <span :class="["status-pill", user.status === "Activo" ? "status-approved" : "status-pending"]">
                <i :class="user.status === "Activo" ? "fa-solid fa-circle-check" : "fa-solid fa-user-clock""></i> {{ user.status }}
              </span>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="text-center empty-state">
              <i class="fa-solid fa-user-xmark empty-icon"></i>
              <p>Aún no hay usuarios registrados en el sistema.</p>
              <span class="text-sm text-subtle">Los usuarios que inicien sesión mediante Google OAuth aparecerán aquí automáticamente.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] }
});

const emit = defineEmits(["user-updated"]);

const roleOptions = computed(() => {
  if (props.roles && props.roles.length > 0) return props.roles;
  return [{ name: "Administrador" }, { name: "Usuario" }, { name: "Auditor" }];
});

function formatDate(dateStr) {
  if (!dateStr) return "Reciente";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return dateStr; }
}

function onAvatarError(e, name) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(name || "User") + "&background=1e3a8a&color=fff";
}

async function onRoleChange(user) {
  try {
    const res = await fetch("/api/users/" + encodeURIComponent(user.email) + "/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role })
    });
    const data = await res.json();
    if (data.success) {
      emit("user-updated");
    } else {
      alert(data.message || "Error al actualizar el rol");
    }
  } catch (err) { console.error("Error enviando actualización de rol:", err); }
}
</script>`,

  "RoleManager.vue": `<template>
  <div class="panel-section">
    <div class="section-header">
      <div>
        <h3 class="section-title"><i class="fa-solid fa-user-gear"></i> Roles y Matriz de Permisos</h3>
        <p class="section-subtitle">Administra los roles predeterminados (Administrador, Usuario, Auditor) y crea perfiles personalizados</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreateModal = true">
        <i class="fa-solid fa-shield-plus"></i> Crear Nuevo Rol
      </button>
    </div>

    <div class="roles-grid">
      <div 
        v-for="role in roles" 
        :key="role.name" 
        :class="["role-card", "shadow-card", { "system-role": role.isSystem }]"
      >
        <div class="role-header">
          <div class="role-title-box">
            <i :class="getRoleIcon(role.name)" class="role-card-icon"></i>
            <h4 class="role-name">{{ role.name }}</h4>
          </div>
          <span :class="["type-badge", role.isSystem ? "badge-system" : "badge-custom"]">
            {{ role.isSystem ? "Sistema" : "Personalizado" }}
          </span>
        </div>

        <p class="role-desc">{{ role.description }}</p>

        <div class="role-meta">
          <span class="user-count">
            <i class="fa-solid fa-users"></i> {{ getUserCountForRole(role.name) }} usuario(s) asignado(s)
          </span>
        </div>

        <div class="permissions-container">
          <span class="perm-title">Permisos Habilitados:</span>
          <div class="perm-tags">
            <span 
              v-for="perm in role.permissions" 
              :key="perm.key || perm" 
              class="perm-tag"
            >
              <i class="fa-solid fa-check text-emerald"></i> {{ perm.label || perm }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card glass-card shadow-lg">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fa-solid fa-shield-plus"></i> Crear Nuevo Rol de Calidad</h3>
          <button class="icon-btn" @click="showCreateModal = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form @submit.prevent="submitCreateRole" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre del Rol *</label>
            <input 
              type="text" 
              v-model="newRole.name" 
              placeholder="ej: Supervisor de Calidad" 
              class="form-input" 
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea 
              v-model="newRole.description" 
              placeholder="Describe las responsabilidades de este rol..." 
              class="form-textarea" 
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Matriz de Permisos</label>
            <div class="checkbox-grid">
              <label v-for="opt in availablePermissions" :key="opt.key" class="checkbox-label">
                <input type="checkbox" :value="opt" v-model="newRole.selectedPermissions">
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="isSubmitting">
              <i class="fa-solid fa-floppy-disk"></i> Guardar Rol
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  roles: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] }
});

const emit = defineEmits(["role-created"]);
const showCreateModal = ref(false);
const isSubmitting = ref(false);
const newRole = ref({ name: "", description: "", selectedPermissions: [] });

const availablePermissions = [
  { key: "docs:read", label: "Lectura de Documentos" },
  { key: "docs:create", label: "Creación de Documentos" },
  { key: "docs:edit", label: "Edición de Documentos" },
  { key: "docs:delete", label: "Eliminación de Documentos" },
  { key: "docs:approve", label: "Aprobación de Calidad" },
  { key: "users:manage", label: "Gestión de Usuarios" },
  { key: "audit:export", label: "Exportación de Reportes" }
];

function getRoleIcon(roleName) {
  if (roleName === "Administrador") return "fa-solid fa-user-shield text-indigo";
  if (roleName === "Usuario") return "fa-solid fa-user text-blue";
  if (roleName === "Auditor") return "fa-solid fa-user-check text-emerald";
  return "fa-solid fa-user-gear text-purple";
}

function getUserCountForRole(roleName) {
  return props.users.filter(u => u.role === roleName).length;
}

async function submitCreateRole() {
  if (!newRole.value.name) return;
  isSubmitting.value = true;
  try {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRole.value.name,
        description: newRole.value.description,
        permissions: newRole.value.selectedPermissions
      })
    });
    const data = await res.json();
    if (data.success) {
      emit("role-created");
      showCreateModal.value = false;
      newRole.value = { name: "", description: "", selectedPermissions: [] };
    } else {
      alert(data.message || "Error al crear el rol");
    }
  } catch (err) { console.error("Error guardando rol:", err); }
  finally { isSubmitting.value = false; }
}
</script>`,

  "AdminDashboard.vue": `<template>
  <div class="admin-layout">
    <aside class="admin-sidebar glass-card">
      <div class="sidebar-user">
        <img :src="userAvatar" :alt="user.name" class="sidebar-avatar" @error="onAvatarError">
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">{{ user.name }}</div>
          <div class="sidebar-user-email">{{ user.email }}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button 
          :class="["nav-item", { active: activeTab === "overview" }]"
          @click="activeTab = "overview""
        >
          <i class="fa-solid fa-chart-pie"></i>
          <span>Resumen Dashboard</span>
        </button>

        <button 
          :class="["nav-item", { active: activeTab === "documents" }]"
          @click="activeTab = "documents""
        >
          <i class="fa-solid fa-folder-closed"></i>
          <span>Gestor de Documentos</span>
          <span class="badge-count">{{ documents.length }}</span>
        </button>

        <button 
          :class="["nav-item", { active: activeTab === "users" }]"
          @click="activeTab = "users""
        >
          <i class="fa-solid fa-users"></i>
          <span>Usuarios</span>
          <span class="badge-count light">{{ users.length }}</span>
        </button>

        <button 
          :class="["nav-item", { active: activeTab === "roles" }]"
          @click="activeTab = "roles""
        >
          <i class="fa-solid fa-user-gear"></i>
          <span>Roles y Permisos</span>
          <span class="badge-count light">{{ roles.length || 3 }}</span>
        </button>

        <button 
          :class="["nav-item", { active: activeTab === "profile" }]"
          @click="activeTab = "profile""
        >
          <i class="fa-solid fa-circle-user"></i>
          <span>Mi Perfil & Token</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-sm" @click="emit("logout")">
          <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <div v-if="activeTab === "overview"" class="dashboard-content">
        <div class="page-title-box">
          <h2 class="page-title">Panel de Control de Calidad (QMS)</h2>
          <p class="page-subtitle">Bienvenido de nuevo, {{ user.givenName || user.name }}. Aquí está el estado actual del sistema.</p>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-blue">
              <i class="fa-solid fa-files"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Total Documentos</span>
              <span class="kpi-value">{{ stats.totalDocuments || documents.length }}</span>
              <span class="kpi-subtext text-emerald"><i class="fa-solid fa-arrow-up"></i> +4 este mes</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-amber">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Revisiones Pendientes</span>
              <span class="kpi-value">{{ stats.pendingReviews || 3 }}</span>
              <span class="kpi-subtext text-amber"><i class="fa-solid fa-triangle-exclamation"></i> Requiere atención</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-emerald">
              <i class="fa-solid fa-shield-check"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Cumplimiento ISO 9001</span>
              <span class="kpi-value">{{ stats.qualityComplianceRate || "98.5%" }}</span>
              <span class="kpi-subtext text-emerald"><i class="fa-solid fa-circle-check"></i> Auditoría aprobada</span>
            </div>
          </div>

          <div class="kpi-card shadow-card">
            <div class="kpi-icon icon-purple">
              <i class="fa-solid fa-users"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-label">Usuarios Autenticados</span>
              <span class="kpi-value">{{ users.length }}</span>
              <span class="kpi-subtext text-purple"><i class="fa-solid fa-user-check"></i> Google OAuth</span>
            </div>
          </div>
        </div>

        <DocumentManager :documents="documents" />
      </div>

      <div v-else-if="activeTab === "documents"">
        <DocumentManager :documents="documents" />
      </div>

      <div v-else-if="activeTab === "users"">
        <UserList :users="users" :roles="roles" @user-updated="emit("reload-data")" />
      </div>

      <div v-else-if="activeTab === "roles"">
        <RoleManager :roles="roles" :users="users" @role-created="emit("reload-data")" />
      </div>

      <div v-else-if="activeTab === "profile"" class="profile-tab-wrapper">
        <UserProfile :user="user" :token="token" @logout="emit("logout")" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import DocumentManager from "./DocumentManager.vue";
import UserList from "./UserList.vue";
import RoleManager from "./RoleManager.vue";
import UserProfile from "./UserProfile.vue";

const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, default: "" },
  stats: { type: Object, default: () => ({}) },
  documents: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  roles: { type: Array, default: () => [] }
});

const emit = defineEmits(["logout", "reload-data"]);
const activeTab = ref("overview");

const userAvatar = computed(() => {
  return props.user?.picture || "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
});

function onAvatarError(e) {
  e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(props.user?.name || "User") + "&background=1e3a8a&color=fff";
}
</script>`
};

for (const [filename, code] of Object.entries(components)) {
  fs.writeFileSync(path.join(compDir, filename), code, "utf-8");
  console.log("Created: " + filename);
}

