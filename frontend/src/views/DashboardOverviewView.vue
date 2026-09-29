<template>
  <div class="dashboard-content">
    <div class="page-title-box">
      <h2 class="page-title">Departamentos del Sistema</h2>
      <p class="page-subtitle">Selecciona un departamento para explorar sus documentos, formatos y evidencias.</p>
    </div>

    <div class="search-box-container">
      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar departamento por título o código..." 
          class="search-input"
        />
        <button 
          v-if="searchQuery" 
          type="button" 
          class="clear-search-btn" 
          @click="searchQuery = ''"
          title="Limpiar búsqueda"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>

    <div class="departments-grid" v-if="filteredDepartments.length > 0">
      <div 
        v-for="dept in filteredDepartments" 
        :key="dept.id" 
        class="dept-card" 
        :class="{ 'inactive-card': !dept.status }" 
        @click="openDepartment(dept)"
      >
        <div class="dept-card-header">
          <div class="dept-icon-wrapper" :class="{ 'inactive': !dept.status }">
            <i :class="dept.icon || 'fa-solid fa-building'"></i>
          </div>
        </div>
        
        <div class="dept-card-body">
          <h4 class="dept-title">{{ dept.title }}</h4>
          <p class="dept-description" v-if="dept.description">{{ dept.description }}</p>
          <p class="dept-description empty-desc" v-else>Sin descripción</p>
        </div>
        
        <div class="dept-card-footer">
          <span class="badge-code" v-if="dept.code">{{ dept.code }}</span>
          <span v-else></span>
          <span v-if="dept.status === true" class="badge-active">Activo</span>
          <span v-else class="badge-inactive">Inactivo</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="fa-solid fa-building-circle-xmark empty-icon" v-if="!searchQuery"></i>
      <i class="fa-solid fa-magnifying-glass empty-icon" v-else></i>
      <p v-if="!searchQuery">No hay departamentos disponibles.</p>
      <p v-else>No se encontraron departamentos con la búsqueda "{{ searchQuery }}".</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/users';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const searchQuery = ref('');
const departments = computed(() => userStore.departments);

const filteredDepartments = computed(() => {
  if (!searchQuery.value) return departments.value.filter(d => d.status); // Only active by default? We'll show all or active. Let's show all.
  const lowerQ = searchQuery.value.toLowerCase();
  return departments.value.filter(d => 
    (d.title && d.title.toLowerCase().includes(lowerQ)) || 
    (d.code && d.code.toLowerCase().includes(lowerQ))
  );
});

onMounted(() => {
  if (departments.value.length === 0) {
    userStore.fetchDepartments();
  }
});

function openDepartment(dept) {
  if (!dept.status) return;
  userStore.selectDepartment(dept.id);
  router.push('/dashboard/department-categories');
}
</script>

<style scoped>
.dashboard-content {
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
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.search-box-container {
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted, #94a3b8);
  font-size: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 38px;
  font-size: 14px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-main, #1e293b);
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-input:focus {
  border-color: var(--primary, #1e3a8a);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: var(--primary, #1e3a8a);
  background: #f1f5f9;
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding-bottom: 20px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px; /* For scrollbar */
}

.dept-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid var(--border-light, #e2e8f0);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.dept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--primary);
}

.inactive-card {
  background: #f8fafc;
  border-color: #e2e8f0;
  opacity: 0.7;
  cursor: not-allowed;
}
.inactive-card:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.dept-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.dept-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary, #1e3a8a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.dept-icon-wrapper.inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.dept-card-body {
  flex-grow: 1;
  margin-bottom: 20px;
}

.dept-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dept-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-desc {
  font-style: italic;
  opacity: 0.7;
}

.dept-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.badge-code {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.badge-active {
  background: #75ba21;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-inactive {
  background: #fee2e2;
  color: #991b1b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  flex: 1;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  overflow-y: auto;
}

.empty-icon {
  font-size: 64px;
  color: #cbd5e1;
  margin-bottom: 20px;
}
</style>
