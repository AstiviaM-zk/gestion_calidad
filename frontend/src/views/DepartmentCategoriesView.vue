<template>
  <div class="categories-view-container">
    <div class="breadcrumb">
      <router-link to="/dashboard/overview" class="breadcrumb-link"><i class="fa-solid fa-house"></i> Inicio</router-link>
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current">{{ department ? department.title : 'Cargando...' }}</span>
    </div>

    <div class="page-title-box">
      <h2 class="page-title">
        <i :class="department?.icon || 'fa-solid fa-building'"></i> 
        Categorías de {{ department ? department.title : 'Departamento' }}
      </h2>
      <p class="page-subtitle">Explora los formatos, instructivos y evidencias del área.</p>
    </div>

    <div class="categories-grid" v-if="!isLoading && categories.length > 0">
      <div 
        v-for="cat in categories" 
        :key="cat.id" 
        class="category-card"
        @click="openCategory(cat)"
      >
        <div class="cat-icon">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <div class="cat-content">
          <h4 class="cat-title">{{ cat.name }}</h4>
          <span class="cat-code" v-if="cat.code">{{ cat.code }}</span>
        </div>
        <div class="cat-badges">
          <span v-if="cat.is_restricted" class="badge-restricted" title="Acceso Restringido">
            <i class="fa-solid fa-lock"></i>
          </span>
          <span v-if="cat.is_base" class="badge-base" title="Categoría Base del Sistema">
            <i class="fa-solid fa-star"></i>
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading && categories.length === 0" class="empty-state">
      <i class="fa-solid fa-folder-open empty-icon"></i>
      <p>Este departamento no tiene categorías configuradas.</p>
    </div>

    <div v-else class="loading-state">
      <i class="fa-solid fa-spinner fa-spin loading-icon"></i>
      <p>Cargando categorías...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/users';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const departmentId = computed(() => userStore.selectedDepartmentId);
const department = computed(() => userStore.departments.find(d => d.id === departmentId.value));

const categories = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  if (userStore.departments.length === 0) {
    await userStore.fetchDepartments();
  }
  
  if (!departmentId.value || !department.value) {
    // Si no existe el departamento (ej. recargó la página), regresar al inicio
    router.replace('/dashboard/overview');
    return;
  }

  await fetchCategories();
});

async function fetchCategories() {
  isLoading.value = true;
  try {
    const { data } = await api.get(`/departments/${departmentId.value}/categories`);
    if (data.success) {
      categories.value = data.categories;
    }
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  } finally {
    isLoading.value = false;
  }
}

function openCategory(cat) {
  // TODO: Navigate to category documents view
  // router.push(`/dashboard/departments/${departmentId.value}/categories/${cat.id}`);
  console.log('Open category:', cat);
}
</script>

<style scoped>
.categories-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 20px;
  color: var(--text-muted);
}

.breadcrumb-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #1e3a8a;
  text-decoration: underline;
}

.breadcrumb-separator {
  font-size: 10px;
  color: #cbd5e1;
}

.breadcrumb-current {
  font-weight: 500;
  color: var(--text-main);
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

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding-bottom: 20px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.cat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.category-card:hover .cat-icon {
  background: rgba(30, 58, 138, 0.08);
}

.cat-content {
  flex-grow: 1;
  overflow: hidden;
}

.cat-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-code {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.cat-badges {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge-restricted {
  color: #eab308;
  background: #fefce8;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.badge-base {
  color: #3b82f6;
  background: #eff6ff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.empty-state, .loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.empty-icon {
  font-size: 64px;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.loading-icon {
  font-size: 40px;
  color: var(--primary);
  margin-bottom: 20px;
}
</style>
