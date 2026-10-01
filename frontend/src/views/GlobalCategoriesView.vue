<template>
  <div class="global-categories-container">
    <div class="breadcrumb">
      <router-link to="/dashboard/overview" class="breadcrumb-link"><i class="fa-solid fa-house"></i> Inicio</router-link>
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current">Categorías de Sistema</span>
    </div>

    <div class="page-title-box">
      <h2 class="page-title">
        <i class="fa-solid fa-layer-group"></i> 
        Categorías de Sistema
      </h2>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <p class="page-subtitle">Explora y filtra las categorías configuradas en todos los departamentos.</p>
        <button class="btn btn-primary btn-sm" @click="createCategory" v-if="canManage">
          <i class="fa-solid fa-plus"></i> Nueva Categoría
        </button>
      </div>
    </div>

    <div class="filters-card glass-card">
      <div class="filter-group">
        <label>Filtrar por Departamento:</label>
        <select v-model="selectedDepartment" class="filter-select">
          <option value="">Todos los departamentos</option>
          <option v-for="dep in departments" :key="dep.id" :value="dep.id">
            {{ dep.title }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Buscar Categoría:</label>
        <input type="text" v-model="searchQuery" class="filter-input" placeholder="Nombre o clave...">
      </div>
    </div>
    
    <div class="grouped-categories" v-if="!isLoading">
      
      <div v-if="groupedFilteredCategories['global']" class="department-group">
        <h3 class="department-header global-header">
          <i class="fa-solid fa-globe"></i> Categorías Base (Globales)
        </h3>
        <CategoryManager 
          :categories="groupedFilteredCategories['global']"
          :isLoading="false"
          :canManage="canManage"
          :cols="4"
          :rows="2"
          @open="openCategory"
          @edit="editCategory"
        />
      </div>

      <div v-for="(cats, depId) in departmentGroupsOnly" :key="depId" class="department-group">
        <h3 class="department-header">
          <i class="fa-solid fa-building"></i> {{ getDepartmentName(depId) }}
        </h3>
        <CategoryManager 
          :categories="cats"
          :isLoading="false"
          :canManage="canManage"
          :cols="4"
          :rows="2"
          @open="openCategory"
          @edit="editCategory"
        />
      </div>
      
      <div v-if="Object.keys(groupedFilteredCategories).length === 0" class="empty-state">
        <i class="fa-solid fa-magnifying-glass empty-icon"></i>
        <p>No se encontraron categorías que coincidan con tu búsqueda.</p>
      </div>
    </div>

    <div v-else class="loading-state">
      <i class="fa-solid fa-spinner fa-spin loading-icon"></i>
      <p>Cargando categorías...</p>
    </div>

    <CategoryModal 
      v-model="isCategoryModalOpen"
      :initialData="editingCategory"
      @saved="fetchAllCategories"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import CategoryManager from '../components/categories/CategoryManager.vue';
import CategoryModal from '../components/categories/CategoryModal.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const allCategories = ref([]);
const isLoading = ref(true);

const selectedDepartment = ref('');
const searchQuery = ref('');

const departments = computed(() => userStore.departments);
const canManage = computed(() => authStore.hasPermission('categories:manage'));

const isCategoryModalOpen = ref(false);
const editingCategory = ref(null);

onMounted(async () => {
  if (departments.value.length === 0) {
    await userStore.fetchDepartments();
  }
  await fetchAllCategories();
});

async function fetchAllCategories() {
  isLoading.value = true;
  try {
    const { data } = await api.get('/categories');
    if (data.success) {
      allCategories.value = data.categories;
    }
  } catch (err) {
    console.error('Error al cargar categorías globales', err);
  } finally {
    isLoading.value = false;
  }
}

const filteredCategories = computed(() => {
  return allCategories.value.filter(cat => {
    if (selectedDepartment.value && cat.department_id !== selectedDepartment.value) return false;
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchCode = cat.code && cat.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });
});

const groupedFilteredCategories = computed(() => {
  const groups = {};
  filteredCategories.value.forEach(cat => {
    if (cat.is_base && (!cat.department_id || cat.department_id === 0)) {
      if (!groups['global']) groups['global'] = [];
      groups['global'].push(cat);
    } else if (cat.department_id) {
      if (!groups[cat.department_id]) groups[cat.department_id] = [];
      groups[cat.department_id].push(cat);
    }
  });
  return groups;
});

const departmentGroupsOnly = computed(() => {
  const { global, ...rest } = groupedFilteredCategories.value;
  return rest;
});

function getDepartmentName(id) {
  const dep = departments.value.find(d => d.id == id);
  return dep ? dep.title : 'Departamento Desconocido';
}

function openCategory(cat) {
  const depId = cat.department_id || 'global';
  router.push(`/dashboard/departments/${depId}/categories/${cat.id}/documents`);
}

function createCategory() {
  editingCategory.value = { id: null, name: '', code: '', is_restricted: false, department_id: null };
  isCategoryModalOpen.value = true;
}

function editCategory(cat) {
  editingCategory.value = { ...cat };
  isCategoryModalOpen.value = true;
}
</script>

<style scoped>
.global-categories-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-title-box {
  margin-bottom: 24px;
}
.page-title {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.filters-card {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  margin-bottom: 24px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  max-width: 300px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.filter-select, .filter-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  outline: none;
  background-color: #f8fafc;
  transition: all 0.2s;
}
.filter-select:focus, .filter-input:focus {
  border-color: var(--primary);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.grouped-categories {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 40px;
}

.department-group {
  margin-bottom: 32px;
}

.department-header {
  font-size: 15px;
  font-weight: 800;
  color: #334155;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.global-header {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  padding: 60px 0;
}
.loading-icon {
  font-size: 40px;
  color: var(--primary);
  margin-bottom: 20px;
}
.empty-icon {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 20px;
}
</style>
