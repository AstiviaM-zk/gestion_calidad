<template>
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
          :class="['pill-btn', { active: activeFilter === filter.value }]"
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
              <span :class="['status-pill', getStatusClass(doc.status)]">
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
import { ref, computed, onMounted } from "vue";
import { useDocumentStore } from "../stores/documents";

const props = defineProps({
  documents: { type: Array, default: null }
});

const documentStore = useDocumentStore();
const searchQuery = ref("");
const activeFilter = ref("all");

onMounted(() => {
  if (!props.documents || props.documents.length === 0) {
    documentStore.fetchDocuments();
  }
});

const documentList = computed(() => {
  return props.documents || documentStore.documents;
});

const filters = [
  { label: "Todos", value: "all" },
  { label: "Aprobados", value: "Aprobado" },
  { label: "En Revisión", value: "En Revisión" },
  { label: "Borradores", value: "Borrador" }
];

const filteredDocuments = computed(() => {
  return documentList.value.filter(doc => {
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
</script>

<style scoped>
.panel-section {
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-card);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-subtle);
  font-size: 13px;
}

.input-search {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-main);
  font-family: var(--font-primary);
  font-size: 12px;
  color: var(--text-main);
  outline: none;
  transition: var(--transition);
}

.input-search:focus {
  border-color: var(--primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--primary-light);
}

.filter-pills {
  display: flex;
  gap: 6px;
}

.pill-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.pill-btn:hover {
  background: #e2e8f0;
  color: var(--text-main);
}

.pill-btn.active {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

.table-container {
  flex: 1;
  overflow-y: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  min-height: 0;
  max-height: 100%;
}

.table-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.qms-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 13px;
}

.qms-table th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-secondary);
  padding: 12px 14px;
  font-weight: 700;
  color: var(--primary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.qms-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-body);
  vertical-align: middle;
}

.qms-table tbody tr:last-child td {
  border-bottom: none;
}

.qms-table tbody tr:hover {
  background: rgba(248, 250, 252, 0.95);
}

.doc-title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.doc-icon {
  font-size: 20px;
}

.doc-title {
  font-weight: 600;
  color: var(--text-main);
}

.doc-size {
  font-size: 11px;
  color: var(--text-subtle);
}

.category-badge {
  background: var(--bg-secondary);
  color: var(--text-body);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.version-badge {
  font-family: monospace;
  background: #f1f5f9;
  color: #475569;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

.text-center { text-align: center; }
.text-subtle { color: var(--text-subtle); }
.text-sm { font-size: 12px; }
</style>