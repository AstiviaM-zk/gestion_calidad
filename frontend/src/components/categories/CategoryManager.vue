<template>
  <div class="categories-grid" :style="gridStyle" v-if="!isLoading && categories.length > 0">
    <div 
      v-for="cat in categories" 
      :key="cat.id" 
      class="category-card"
      @click="$emit('open', cat)"
    >
      <div class="cat-icon">
        <i class="fa-solid fa-folder-open"></i>
      </div>
      <div class="cat-content">
        <h4 class="cat-title">{{ cat.name }}</h4>
        <div class="cat-meta">
          <span class="cat-code" v-if="cat.code">{{ cat.code }}</span>
          <span class="cat-docs-count"><i class="fa-regular fa-file-lines"></i> Documentos: {{ cat.documents_count || 0 }}</span>
        </div>
      </div>
      <div class="cat-badges">
        <span v-if="cat.is_restricted" class="badge-restricted" title="Acceso Restringido">
          <i class="fa-solid fa-lock"></i>
        </span>
        <span v-if="cat.is_base" class="badge-base" title="Categoría Base del Sistema">
          <i class="fa-solid fa-star"></i>
        </span>
      </div>
      <div v-if="canManage" class="card-actions" @click.stop>
        <button class="icon-btn edit-btn" @click="$emit('edit', cat)" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="icon-btn delete-btn" @click="$emit('delete', cat)" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  </div>

  <div v-else-if="!isLoading && categories.length === 0" class="empty-state">
    <i class="fa-solid fa-folder-open empty-icon"></i>
    <p>No hay categorías configuradas.</p>
  </div>

  <div v-else class="loading-state">
    <i class="fa-solid fa-spinner fa-spin loading-icon"></i>
    <p>Cargando categorías...</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  canManage: {
    type: Boolean,
    default: false
  },
  cols: {
    type: Number,
    default: 3
  },
  rows: {
    type: Number,
    default: 6
  }
});

defineEmits(['open', 'edit', 'delete']);

const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${props.rows}, auto)`
  };
});
</script>

<style scoped>
.categories-grid {
  display: grid;
  gap: 16px;
  padding-bottom: 20px;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  align-items: flex-start;
  align-content: flex-start;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
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
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cat-meta {
  display: flex;
  align-items: center;
  gap: 8px;
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

.cat-docs-count {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-badges {
  display: flex;
  flex-direction: row;
  align-items: center;
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

.card-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.edit-btn {
  color: var(--primary, #1e3a8a);
}

.edit-btn:hover {
  background: rgba(30, 58, 138, 0.08);
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fef2f2;
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
