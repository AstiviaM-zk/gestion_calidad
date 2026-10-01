<template>
  <div class="category-documents-container">
    <div class="breadcrumb">
      <router-link to="/dashboard/overview" class="breadcrumb-link"><i class="fa-solid fa-house"></i> Inicio</router-link>
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      
      <template v-if="departmentId && departmentId !== 'global'">
        <router-link to="/dashboard/departments" class="breadcrumb-link"><i class="fa-solid fa-building"></i> Departamentos</router-link>
        <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
        <router-link to="/dashboard/department-categories" @click="selectDepartment" class="breadcrumb-link">
          {{ departmentName }}
        </router-link>
      </template>
      <template v-else>
        <router-link to="/dashboard/categories" class="breadcrumb-link"><i class="fa-solid fa-layer-group"></i> Categorías</router-link>
      </template>
      
      <span class="breadcrumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current">{{ categoryName }}</span>
    </div>

    <DocumentManager 
      :documents="documents" 
      :hide-breadcrumb="true" 
      :custom-title="`Documentos: ${categoryName}`"
      :custom-subtitle="`Visualizando documentos de la categoría seleccionada en ${departmentName}`"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/users';
import { useDocumentStore } from '../stores/documents';
import api from '../services/api';
import DocumentManager from '../components/DocumentManager.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const documentStore = useDocumentStore();

const departmentId = computed(() => documentStore.selectedCategoryDepartmentId);
const categoryId = computed(() => documentStore.selectedCategoryId);

const department = computed(() => {
  if (departmentId.value === 'global') return null;
  return userStore.departments.find(d => d.id == departmentId.value);
});

const departmentName = computed(() => {
  if (departmentId.value === 'global') return 'Sistema (Global)';
  return department.value ? department.value.title : 'Cargando...';
});

const category = ref(null);
const categoryName = computed(() => category.value ? category.value.name : 'Cargando categoría...');

const documents = ref(null); // null tells DocumentManager to fetch all if we don't have them, but we will filter them
const isLoading = ref(true);

function selectDepartment() {
  if (departmentId.value && departmentId.value !== 'global') {
    userStore.selectDepartment(departmentId.value);
  }
}

async function loadData() {
  isLoading.value = true;
  
  if (userStore.departments.length === 0) {
    await userStore.fetchDepartments();
  }

  // 1. Fetch Category Info
  try {
    let cats = [];
    if (departmentId.value && departmentId.value !== 'global') {
      const { data } = await api.get(`/departments/${departmentId.value}/categories`);
      if (data.success) cats = data.categories;
    } else {
      const { data } = await api.get('/categories');
      if (data.success) cats = data.categories;
    }
    category.value = cats.find(c => c.id == categoryId.value);
  } catch (error) {
    console.error('Error fetching category:', error);
  }

  // 2. Fetch Documents for this category
  // Since the backend doesn't have a specific endpoint yet, we mock the filtering
  try {
    const { data } = await api.get('/documents');
    if (data.success) {
      if (category.value) {
        // En un escenario real, backend filtraría por category_id
        // Aquí filtramos por el string del mock (category name) o mostramos todos para la demo si no hay match
        const filtered = data.documents.filter(doc => doc.category.toLowerCase().includes(category.value.name.toLowerCase()));
        
        // Fallback para la demo: si no encuentra ninguno, le asignamos los mocks a esta categoría
        if (filtered.length === 0) {
           documents.value = data.documents.map(d => ({ ...d, category: category.value.name }));
        } else {
           documents.value = filtered;
        }
      } else {
        documents.value = data.documents;
      }
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  if (!categoryId.value) {
    router.replace('/dashboard/overview');
    return;
  }
  loadData();
});

// Remove watch on route.params since we don't use them anymore

</script>

<style scoped>
.category-documents-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
