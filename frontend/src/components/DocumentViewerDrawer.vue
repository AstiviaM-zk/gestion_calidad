<template>
  <Teleport to="body">
    <transition name="drawer-fade">
      <div v-if="isOpen && document" class="viewer-backdrop" @click="handleBackdropClick">
        <transition name="drawer-slide">
          <div 
            v-if="isOpen && document" 
            class="viewer-drawer" 
            :class="{ 'is-expanded': isExpanded }"
            @click.stop
          >
            <!-- Drawer Header -->
            <div class="drawer-header">
              <div class="header-left">
                <div class="header-badges">
                  <span class="badge-code font-mono">{{ document.id }}</span>
                  <span class="category-badge">{{ document.category }}</span>
                  <span class="version-badge">v{{ activeVersionNumber || document.version }}</span>
                  <span :class="['status-pill', getStatusClass(document.status)]">
                    <i :class="getStatusIcon(document.status)"></i> {{ getStatusLabel(document.status) }}
                  </span>
                </div>
                <h3 class="header-title" :title="document.title">
                  <i :class="getFileIcon(document.type)" class="title-file-icon"></i>
                  {{ document.title }}
                </h3>
              </div>

              <div class="header-actions">
                <button 
                  class="action-btn" 
                  :title="isExpanded ? 'Reducir tamaño' : 'Maximizar visor'"
                  @click="isExpanded = !isExpanded"
                >
                  <i :class="isExpanded ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
                </button>

                <button 
                  v-if="document.type === 'PDF' && fileBlobUrl"
                  class="action-btn" 
                  title="Abrir en pestaña nueva"
                  @click="openInNewTab"
                >
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>

                <!-- Botón de Descarga condicionado a permiso -->
                <button 
                  v-if="canDownload"
                  class="action-btn btn-download-header" 
                  title="Descargar documento"
                  @click="downloadDocument"
                  :disabled="isDownloading"
                >
                  <i class="fa-solid fa-download" :class="{ 'fa-bounce': isDownloading }"></i>
                </button>
                <div v-else class="download-restricted-badge" title="Descarga restringida por rol (Sólo lectura)">
                  <i class="fa-solid fa-lock"></i>
                </div>

                <button class="action-btn btn-close" title="Cerrar visor" @click="closeDrawer">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <!-- Approval / Quality Banner (Solo administradores / documents:approve) -->
            <div v-if="canApprove" class="approval-bar" :class="'bar-' + document.status">
              <div class="approval-status-info">
                <i :class="getStatusIcon(document.status)"></i>
                <div class="approval-texts">
                  <span class="approval-title">Control de Calidad: Estado {{ getStatusLabel(document.status) }}</span>
                  <span class="approval-subtitle">
                    {{ document.status === 'pending' ? 'Requiere validación para autorizar su uso oficial' : 'Documento gestionado bajo norma ISO 9001' }}
                  </span>
                </div>
              </div>

              <div class="approval-actions">
                <template v-if="document.status === 'pending'">
                  <button 
                    class="btn btn-approve btn-sm" 
                    @click="updateDocumentStatus('approved')" 
                    :disabled="isUpdatingStatus"
                  >
                    <i class="fa-solid fa-check"></i> Aprobar
                  </button>
                  <button 
                    class="btn btn-reject btn-sm" 
                    @click="updateDocumentStatus('rejected')" 
                    :disabled="isUpdatingStatus"
                  >
                    <i class="fa-solid fa-xmark"></i> Rechazar
                  </button>
                </template>

                <template v-else-if="document.status === 'approved'">
                  <button 
                    class="btn btn-obsolete btn-sm" 
                    @click="updateDocumentStatus('obsolete')" 
                    :disabled="isUpdatingStatus"
                    title="Pasar a histórico obsoleto"
                  >
                    <i class="fa-solid fa-box-archive"></i> Marcar Obsoleto
                  </button>
                  <button 
                    class="btn btn-outline-danger btn-sm" 
                    @click="updateDocumentStatus('rejected')" 
                    :disabled="isUpdatingStatus"
                  >
                    <i class="fa-solid fa-ban"></i> Rechazar
                  </button>
                </template>

                <template v-else>
                  <button 
                    class="btn btn-approve btn-sm" 
                    @click="updateDocumentStatus('approved')" 
                    :disabled="isUpdatingStatus"
                  >
                    <i class="fa-solid fa-rotate-left"></i> Reactivar y Aprobar
                  </button>
                </template>
              </div>
            </div>

            <!-- Tabs de navegación en Drawer -->
            <div class="drawer-tabs">
              <button 
                class="drawer-tab-btn" 
                :class="{ active: currentTab === 'reader' }"
                @click="switchTab('reader')"
              >
                <i class="fa-regular fa-file-lines"></i>
                Visualizador de Archivo
              </button>
              <button 
                class="drawer-tab-btn" 
                :class="{ active: currentTab === 'versions' }"
                @click="switchTab('versions')"
              >
                <i class="fa-solid fa-code-branch"></i>
                Historial de Versiones
                <span class="tab-badge" v-if="versions.length">{{ versions.length }}</span>
              </button>
            </div>

            <!-- Meta Information Bar -->
            <div class="drawer-meta-bar">
              <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-user"></i> Responsable:</span>
                <span class="meta-value">{{ document.author || 'Sistema' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-calendar"></i> Fecha:</span>
                <span class="meta-value">{{ document.updatedAt }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label"><i class="fa-regular fa-file"></i> Tipo / Tamaño:</span>
                <span class="meta-value">{{ document.type }} • {{ document.size }}</span>
              </div>
              <div class="meta-item meta-desc" v-if="document.description">
                <span class="meta-label"><i class="fa-solid fa-circle-info"></i> Propósito:</span>
                <span class="meta-value desc-text">{{ document.description }}</span>
              </div>
            </div>

            <!-- Drawer Body / Content Area -->
            <div class="drawer-body">
              <!-- TAB 1: VISOR DE DOCUMENTO -->
              <div v-show="currentTab === 'reader'" class="tab-pane-full">
                <!-- Loading State -->
                <div v-if="isLoading" class="state-container">
                  <div class="spinner-pulse"></div>
                  <p class="state-text">Cargando documento...</p>
                  <span class="state-subtext">Obteniendo archivo seguro desde el servidor QMS</span>
                </div>

                <!-- Error State -->
                <div v-else-if="hasError" class="state-container error-state">
                  <div class="error-icon-box">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <h4 class="error-title">No se pudo cargar el archivo</h4>
                  <p class="error-desc">{{ errorMessage }}</p>
                  <div class="error-actions">
                    <button class="btn btn-secondary btn-sm" @click="loadFile">
                      <i class="fa-solid fa-rotate-right"></i> Reintentar
                    </button>
                    <button v-if="canDownload" class="btn btn-primary btn-sm" @click="downloadDocument">
                      <i class="fa-solid fa-download"></i> Descargar directo
                    </button>
                  </div>
                </div>

                <!-- PDF Viewer (iframe) -->
                <div v-else-if="document.type === 'PDF' && fileBlobUrl" class="pdf-viewer-wrapper">
                  <iframe 
                    :src="`${fileBlobUrl}#toolbar=1&navpanes=0&scrollbar=1`" 
                    class="pdf-frame"
                    title="Visor de Documentos PDF"
                  ></iframe>
                </div>

                <!-- Office / Other Formats Preview Card -->
                <div v-else class="office-preview-container">
                  <div class="office-card shadow-card">
                    <div class="office-icon-wrapper" :class="getOfficeThemeClass(document.type)">
                      <i :class="getFileIcon(document.type)"></i>
                    </div>
                    <h4 class="office-doc-title">{{ document.title }}</h4>
                    <p class="office-doc-meta font-mono">{{ document.file_name || `${document.id}.${document.type.toLowerCase()}` }}</p>

                    <div class="office-features-list">
                      <div class="feature-item">
                        <i class="fa-solid fa-shield-halved text-primary"></i>
                        <span>Archivo autenticado y protegido por el Sistema de Gestión de Calidad</span>
                      </div>
                      <div class="feature-item">
                        <i class="fa-solid fa-code-branch text-primary"></i>
                        <span>Versión en visualización: <strong>{{ activeVersionNumber || document.version }}</strong></span>
                      </div>
                      <div class="feature-item">
                        <i class="fa-solid fa-database text-primary"></i>
                        <span>Tamaño registrado en disco: <strong>{{ document.size }}</strong></span>
                      </div>
                    </div>

                    <p class="office-notice">
                      Los archivos de tipo <strong>{{ document.type }}</strong> están optimizados para su apertura y edición en su suite de productividad local.
                    </p>

                    <div class="office-actions" v-if="canDownload">
                      <button class="btn btn-primary btn-lg" @click="downloadDocument" :disabled="isDownloading">
                        <i class="fa-solid fa-download" :class="{ 'fa-spin': isDownloading }"></i>
                        Descargar archivo para visualizar
                      </button>
                    </div>
                    <div v-else class="download-restricted-notice">
                      <i class="fa-solid fa-lock text-muted"></i>
                      <span>La descarga directa está restringida para tu rol. Contacta al SGC si necesitas una copia local.</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TAB 2: HISTORIAL DE VERSIONES -->
              <div v-show="currentTab === 'versions'" class="tab-pane-versions">
                <div class="versions-header-box">
                  <div>
                    <h4 class="versions-title">Trazabilidad de Revisiones y Cambios</h4>
                    <p class="versions-subtitle">Historial cronológico de versiones registradas bajo la norma ISO 9001</p>
                  </div>
                  <button class="btn btn-secondary btn-sm" @click="fetchVersions" :disabled="isLoadingVersions">
                    <i class="fa-solid fa-rotate" :class="{ 'fa-spin': isLoadingVersions }"></i> Refrescar
                  </button>
                </div>

                <div v-if="isLoadingVersions" class="state-container">
                  <div class="spinner-pulse"></div>
                  <p class="state-text">Consultando historial de versiones...</p>
                </div>

                <div v-else-if="versions.length === 0" class="empty-versions">
                  <i class="fa-solid fa-clock-rotate-left empty-icon"></i>
                  <p>No se encontraron registros de versiones adicionales.</p>
                </div>

                <div v-else class="versions-list">
                  <div 
                    v-for="(ver, index) in versions" 
                    :key="ver.id" 
                    class="version-card shadow-sm"
                    :class="{ 'is-current-version': index === 0, 'is-active-version': selectedVersionId === ver.id }"
                  >
                    <div class="version-left">
                      <div class="version-badge-box">
                        <span class="v-number">v{{ ver.version }}</span>
                        <span v-if="index === 0" class="v-tag-current">Vigente</span>
                      </div>
                      <div class="version-details">
                        <div class="version-filename font-mono">
                          <i :class="getFileIcon(document.type)"></i>
                          {{ ver.file_name }}
                        </div>
                        <div class="version-meta">
                          <span><i class="fa-regular fa-user"></i> {{ ver.author || 'Sistema' }}</span>
                          <span>•</span>
                          <span><i class="fa-regular fa-clock"></i> {{ ver.createdAt }}</span>
                          <span>•</span>
                          <span><i class="fa-solid fa-hard-drive"></i> {{ ver.size }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="version-actions">
                      <button 
                        class="btn btn-secondary btn-xs" 
                        title="Ver esta versión en el visor"
                        @click="viewHistoricalVersion(ver)"
                      >
                        <i class="fa-regular fa-eye"></i> Ver versión
                      </button>
                      <button 
                        v-if="canDownload"
                        class="btn btn-secondary btn-xs" 
                        title="Descargar esta versión"
                        @click="downloadHistoricalVersion(ver)"
                      >
                        <i class="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div class="drawer-footer">
              <div class="footer-left">
                <span class="doc-security-note">
                  <i class="fa-solid fa-shield-halved text-primary"></i> Control documental SGC • ISO 9001:2015
                </span>
              </div>
              <div class="footer-right">
                <button class="btn btn-secondary btn-sm" @click="closeDrawer">
                  Cerrar
                </button>
                <button 
                  v-if="canDownload"
                  class="btn btn-primary btn-sm" 
                  @click="downloadDocument" 
                  :disabled="isDownloading"
                >
                  <i class="fa-solid fa-download"></i> Descargar
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import { showToast } from '../utils/toast';

const props = defineProps({
  document: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'status-updated']);

const authStore = useAuthStore();

const isExpanded = ref(false);
const currentTab = ref('reader'); // 'reader' | 'versions'
const isLoading = ref(false);
const isDownloading = ref(false);
const isUpdatingStatus = ref(false);
const hasError = ref(false);
const errorMessage = ref('');
const fileBlobUrl = ref(null);

// Historial de versiones
const versions = ref([]);
const isLoadingVersions = ref(false);
const selectedVersionId = ref(null);
const activeVersionNumber = ref(null);

// Permisos
const canApprove = computed(() => {
  return authStore.hasPermission('documents:approve') || authStore.user?.role === 'admin_sgc';
});

const canDownload = computed(() => {
  return authStore.hasPermission('documents:download') || authStore.user?.role === 'admin_sgc';
});

watch(() => [props.isOpen, props.document?.db_id], ([open, docId]) => {
  if (open && docId) {
    currentTab.value = 'reader';
    selectedVersionId.value = null;
    activeVersionNumber.value = props.document.version;
    loadFile();
    fetchVersions();
  } else {
    cleanupBlob();
    versions.value = [];
  }
});

function cleanupBlob() {
  if (fileBlobUrl.value) {
    URL.revokeObjectURL(fileBlobUrl.value);
    fileBlobUrl.value = null;
  }
}

onBeforeUnmount(() => {
  cleanupBlob();
});

function switchTab(tab) {
  currentTab.value = tab;
  if (tab === 'versions' && versions.value.length === 0) {
    fetchVersions();
  }
}

async function loadFile(customUrl = null) {
  if (!props.document?.db_id) return;
  
  cleanupBlob();
  isLoading.value = true;
  hasError.value = false;
  errorMessage.value = '';

  const endpoint = customUrl || `/documents/${props.document.db_id}/file`;

  try {
    const res = await api.get(endpoint, {
      responseType: 'blob'
    });

    const mime = props.document.mime_type || (props.document.type === 'PDF' ? 'application/pdf' : 'application/octet-stream');
    const blob = new Blob([res.data], { type: mime });
    fileBlobUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error al cargar documento:', error);
    hasError.value = true;
    errorMessage.value = error.response?.data?.message || 'Error al conectar con el servidor para visualizar el documento.';
  } finally {
    isLoading.value = false;
  }
}

async function fetchVersions() {
  if (!props.document?.db_id) return;
  isLoadingVersions.value = true;
  try {
    const res = await api.get(`/documents/${props.document.db_id}/versions`);
    if (res.data.success) {
      versions.value = res.data.versions;
    }
  } catch (err) {
    console.error('Error cargando versiones:', err);
  } finally {
    isLoadingVersions.value = false;
  }
}

function viewHistoricalVersion(ver) {
  selectedVersionId.value = ver.id;
  activeVersionNumber.value = ver.version;
  currentTab.value = 'reader';
  loadFile(`/documents/versions/${ver.id}/file`);
  showToast.info(`Visualizando versión histórica v${ver.version}`);
}

async function downloadHistoricalVersion(ver) {
  if (!canDownload.value) return;
  try {
    const res = await api.get(`/documents/versions/${ver.id}/file`, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = ver.file_name || `${props.document.id}_v${ver.version}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    showToast.success(`Descargando versión v${ver.version}`);
  } catch (err) {
    showToast.error('Error al descargar versión');
  }
}

async function updateDocumentStatus(newStatus) {
  if (!props.document?.db_id) return;
  isUpdatingStatus.value = true;

  try {
    const res = await api.patch(`/documents/${props.document.db_id}/status`, {
      status: newStatus
    });

    if (res.data.success) {
      showToast.success(res.data.message || 'Estado actualizado exitosamente');
      emit('status-updated', { docId: props.document.db_id, status: newStatus });
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    showToast.error(error.response?.data?.message || 'Error al actualizar el estado del documento');
  } finally {
    isUpdatingStatus.value = false;
  }
}

async function downloadDocument() {
  if (!props.document?.db_id || !canDownload.value) return;
  isDownloading.value = true;

  try {
    const res = await api.get(`/documents/${props.document.db_id}/file`, {
      responseType: 'blob'
    });

    const blobUrl = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    
    const defaultName = `${props.document.id}_${props.document.title}.${(props.document.type || 'pdf').toLowerCase()}`;
    link.download = props.document.file_name || defaultName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    showToast.success('Descarga iniciada exitosamente');
  } catch (error) {
    console.error('Error al descargar:', error);
    showToast.error('No se pudo descargar el archivo');
  } finally {
    isDownloading.value = false;
  }
}

function openInNewTab() {
  if (!fileBlobUrl.value) return;
  window.open(fileBlobUrl.value, '_blank');
}

function closeDrawer() {
  cleanupBlob();
  emit('close');
}

function handleBackdropClick() {
  closeDrawer();
}

function getFileIcon(type) {
  if (type === 'PDF') return 'fa-regular fa-file-pdf text-red';
  if (type === 'DOCX') return 'fa-regular fa-file-word text-blue';
  if (type === 'XLSX') return 'fa-regular fa-file-excel text-green';
  return 'fa-regular fa-file text-primary';
}

function getOfficeThemeClass(type) {
  if (type === 'DOCX') return 'theme-word';
  if (type === 'XLSX') return 'theme-excel';
  return 'theme-general';
}

function getStatusClass(status) {
  if (status === 'approved') return 'status-approved';
  if (status === 'pending') return 'status-pending';
  if (status === 'rejected') return 'status-rejected';
  return 'status-draft';
}

function getStatusIcon(status) {
  if (status === 'approved') return 'fa-solid fa-circle-check';
  if (status === 'pending') return 'fa-solid fa-clock';
  if (status === 'rejected') return 'fa-solid fa-circle-xmark';
  return 'fa-solid fa-box-archive';
}

function getStatusLabel(status) {
  const map = {
    'approved': 'Aprobado',
    'pending': 'Pendiente',
    'rejected': 'Rechazado',
    'obsolete': 'Obsoleto'
  };
  return map[status] || status;
}
</script>

<style scoped>
/* Backdrop */
.viewer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

/* Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* Drawer Container */
.viewer-drawer {
  width: 740px;
  max-width: 95vw;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  position: relative;
}

.viewer-drawer.is-expanded {
  width: 92vw;
  max-width: 96vw;
}

/* Header */
.drawer-header {
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.header-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-code {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  background: rgba(30, 58, 138, 0.08);
  padding: 2px 8px;
  border-radius: var(--radius-sm, 4px);
  border: 1px solid rgba(30, 58, 138, 0.15);
}

.category-badge {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: var(--radius-sm, 4px);
}

.version-badge {
  font-size: 11px;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  padding: 2px 7px;
  border-radius: var(--radius-sm, 4px);
}

.status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-pending {
  background: #fef3c7;
  color: #b45309;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.header-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-file-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-light, #e2e8f0);
  background: #ffffff;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8fafc;
  color: var(--primary);
  border-color: #cbd5e1;
}

.btn-download-header:hover {
  background: #eff6ff;
  color: var(--primary);
  border-color: #bfdbfe;
}

.btn-close:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.download-restricted-badge {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md, 8px);
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  cursor: not-allowed;
}

/* Approval Bar */
.approval-bar {
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.bar-pending {
  background: #fffbeb;
  border-color: #fef08a;
}

.bar-approved {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.bar-rejected {
  background: #fef2f2;
  border-color: #fecaca;
}

.bar-obsolete {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.approval-status-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar-pending .approval-status-info i { color: #d97706; font-size: 18px; }
.bar-approved .approval-status-info i { color: #16a34a; font-size: 18px; }
.bar-rejected .approval-status-info i { color: #dc2626; font-size: 18px; }

.approval-texts {
  display: flex;
  flex-direction: column;
}

.approval-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
}

.approval-subtitle {
  font-size: 11px;
  color: #64748b;
}

.approval-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-approve {
  background: #16a34a;
  color: #ffffff;
  border: none;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-approve:hover {
  background: #15803d;
}

.btn-reject {
  background: #dc2626;
  color: #ffffff;
  border: none;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-reject:hover {
  background: #b91c1c;
}

.btn-obsolete {
  background: #64748b;
  color: #ffffff;
  border: none;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}

.btn-outline-danger {
  background: transparent;
  color: #dc2626;
  border: 1px solid #dc2626;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}

/* Tabs */
.drawer-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  background: #ffffff;
  padding: 0 24px;
  gap: 20px;
  flex-shrink: 0;
}

.drawer-tab-btn {
  background: none;
  border: none;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.drawer-tab-btn:hover {
  color: var(--primary);
}

.drawer-tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.tab-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}

.drawer-tab-btn.active .tab-badge {
  background: #dbeafe;
  color: #1e40af;
}

/* Meta Bar */
.drawer-meta-bar {
  background: #f8fafc;
  padding: 8px 24px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  font-size: 11px;
  flex-shrink: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
}

.meta-label {
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-value {
  color: #0f172a;
  font-weight: 500;
}

.meta-desc {
  width: 100%;
}

.desc-text {
  font-style: italic;
  color: #334155;
}

/* Body / Viewer */
.drawer-body {
  flex: 1;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-pane-full {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}

/* Versions Tab Pane */
.tab-pane-versions {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.versions-header-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.versions-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.versions-subtitle {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #64748b;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-card {
  background: #ffffff;
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s;
}

.version-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.version-card.is-current-version {
  border-color: #93c5fd;
  background: #f0f7ff;
}

.version-card.is-active-version {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.2);
}

.version-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.version-badge-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.v-number {
  font-family: monospace;
  font-weight: 700;
  font-size: 14px;
  color: #0369a1;
  background: #e0f2fe;
  padding: 4px 10px;
  border-radius: 6px;
}

.v-tag-current {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #15803d;
  background: #dcfce7;
  padding: 2px 6px;
  border-radius: 4px;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.version-filename {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
}

.version-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-xs {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
}

.empty-versions {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

/* Loading & States */
.state-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner-pulse {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--primary, #1e3a8a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-text {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.state-subtext {
  font-size: 12px;
  color: #64748b;
}

/* Error State */
.error-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 16px;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 8px 0;
}

.error-desc {
  font-size: 13px;
  color: #64748b;
  max-width: 400px;
  margin: 0 0 20px 0;
}

.error-actions {
  display: flex;
  gap: 12px;
}

/* Office Preview Card */
.office-preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  overflow-y: auto;
}

.office-card {
  background: #ffffff;
  border-radius: var(--radius-xl, 16px);
  padding: 36px 32px;
  max-width: 480px;
  width: 100%;
  text-align: center;
  border: 1px solid var(--border-light, #e2e8f0);
}

.office-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin: 0 auto 20px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
}

.theme-word {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.theme-excel {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.theme-general {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.office-doc-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.office-doc-meta {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 24px;
}

.office-features-list {
  text-align: left;
  background: #f8fafc;
  border-radius: var(--radius-md, 8px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #334155;
}

.office-notice {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
}

.office-actions {
  display: flex;
  justify-content: center;
}

.download-restricted-notice {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 14px;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

/* Footer */
.drawer-footer {
  padding: 12px 24px;
  background: #ffffff;
  border-top: 1px solid var(--border-light, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.doc-security-note {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-right {
  display: flex;
  gap: 10px;
}

.text-red { color: #dc2626; }
.text-blue { color: #2563eb; }
.text-green { color: #16a34a; }
</style>
