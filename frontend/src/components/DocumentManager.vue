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
</script>