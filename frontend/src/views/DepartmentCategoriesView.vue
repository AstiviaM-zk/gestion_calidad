<template>
  <div class="categories-view-container">
    <div class="breadcrumb">
      <router-link to="/dashboard/overview" class="breadcrumb-link"><i class="fa-solid fa-house"></i> Inicio</router-link>
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current">{{ department ? department.title : 'Cargando...' }}</span>
    </div>

    <div class="page-title-box">
      <div class="title-with-actions">
        <div>
          <h2 class="page-title">
            <i :class="department?.icon || 'fa-solid fa-building'"></i> 
            Categorías de {{ department ? department.title : 'Departamento' }}
          </h2>
          <p class="page-subtitle">Explora los formatos, instructivos y evidencias del área.</p>
        </div>
        
        <button v-if="canManage" class="btn btn-primary btn-sm" @click="createCategory">
          <i class="fa-solid fa-plus"></i> Nueva
        </button>
      </div>
    </div>

    <CategoryManager 
      :categories="categories"
      :isLoading="isLoading"
      :canManage="canManage"
      :cols="3"
      :rows="6"
      @open="openCategory"
      @edit="editCategory"
      @delete="deleteCategory"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import CategoryManager from '../components/categories/CategoryManager.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const canManage = computed(() => authStore.hasPermission('categories:manage') || authStore.user?.role === 'admin_sgc');

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

function createCategory() {
  console.log('Crear categoría (TODO)');
}

function editCategory(cat) {
  console.log('Editar categoría (TODO):', cat);
}

function deleteCategory(cat) {
  console.log('Eliminar categoría (TODO):', cat);
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

.title-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
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
</style>
