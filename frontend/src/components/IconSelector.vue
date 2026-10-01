<template>
  <div class="icon-selector-container" ref="selectorRef">
    <div class="selected-icon-display" @click="toggleDropdown">
      <div class="icon-preview" v-if="modelValue">
        <i :class="modelValue"></i>
      </div>
      <div class="icon-preview placeholder" v-else>
        <i class="fa-solid fa-icons"></i>
      </div>
      <span class="icon-name">{{ modelValue ? 'Ícono seleccionado' : 'Seleccionar Ícono...' }}</span>
      <i class="fa-solid fa-chevron-down dropdown-arrow" :class="{ 'open': isOpen }"></i>
    </div>

    <div class="icon-dropdown" v-if="isOpen">
      <div class="dropdown-header">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Buscar ícono..." 
            class="search-input"
            @click.stop
          />
        </div>
      </div>
      
      <div class="icons-grid">
        <div 
          v-for="icon in filteredIcons" 
          :key="icon"
          class="icon-option"
          :class="{ 'active': modelValue === icon }"
          @click="selectIcon(icon)"
        >
          <i :class="icon"></i>
        </div>
        
        <div v-if="filteredIcons.length === 0" class="no-icons-msg">
          No se encontraron íconos.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const searchQuery = ref('');
const selectorRef = ref(null);

// Un diccionario de iconos comunes de FontAwesome (fa-solid)
const availableIcons = [
  'fa-solid fa-building', 'fa-solid fa-building-user', 'fa-solid fa-city',
  'fa-solid fa-house', 'fa-solid fa-folder', 'fa-solid fa-folder-open',
  'fa-solid fa-file', 'fa-solid fa-file-lines', 'fa-solid fa-file-pdf',
  'fa-solid fa-file-word', 'fa-solid fa-file-excel', 'fa-solid fa-users',
  'fa-solid fa-user', 'fa-solid fa-id-badge', 'fa-solid fa-user-tie',
  'fa-solid fa-chart-pie', 'fa-solid fa-chart-line', 'fa-solid fa-bullseye',
  'fa-solid fa-clipboard-check', 'fa-solid fa-list-check', 'fa-solid fa-check-double',
  'fa-solid fa-shield-halved', 'fa-solid fa-shield', 'fa-solid fa-lock',
  'fa-solid fa-unlock', 'fa-solid fa-key', 'fa-solid fa-gear',
  'fa-solid fa-gears', 'fa-solid fa-wrench', 'fa-solid fa-screwdriver-wrench',
  'fa-solid fa-briefcase', 'fa-solid fa-box', 'fa-solid fa-boxes-stacked',
  'fa-solid fa-truck', 'fa-solid fa-cart-shopping', 'fa-solid fa-globe',
  'fa-solid fa-earth-americas', 'fa-solid fa-map', 'fa-solid fa-location-dot',
  'fa-solid fa-heart-pulse', 'fa-solid fa-stethoscope', 'fa-solid fa-flask',
  'fa-solid fa-microscope', 'fa-solid fa-vial', 'fa-solid fa-laptop-code',
  'fa-solid fa-desktop', 'fa-solid fa-server', 'fa-solid fa-database',
  'fa-solid fa-cloud', 'fa-solid fa-bolt', 'fa-solid fa-lightbulb',
  'fa-solid fa-fire', 'fa-solid fa-droplet', 'fa-solid fa-leaf',
  'fa-solid fa-seedling', 'fa-solid fa-tree', 'fa-solid fa-star',
  'fa-solid fa-bookmark', 'fa-solid fa-tag', 'fa-solid fa-tags',
  'fa-solid fa-paperclip', 'fa-solid fa-link', 'fa-solid fa-camera',
  'fa-solid fa-video', 'fa-solid fa-image', 'fa-solid fa-music',
  'fa-solid fa-headphones', 'fa-solid fa-phone', 'fa-solid fa-envelope',
  'fa-solid fa-comments', 'fa-solid fa-message', 'fa-solid fa-bell',
  'fa-solid fa-calendar', 'fa-solid fa-calendar-days', 'fa-solid fa-clock',
  'fa-solid fa-stopwatch', 'fa-solid fa-hourglass-half', 'fa-solid fa-compass',
  'fa-solid fa-triangle-exclamation', 'fa-solid fa-circle-exclamation', 'fa-solid fa-circle-info',
  'fa-solid fa-circle-question', 'fa-solid fa-circle-xmark', 'fa-solid fa-circle-check',
  'fa-solid fa-ban', 'fa-solid fa-eye', 'fa-solid fa-eye-slash', 'fa-solid fa-pen', 'fa-solid fa-trash',
  'fa-solid fa-plus', 'fa-solid fa-minus', 'fa-solid fa-lock-open'
];

const filteredIcons = computed(() => {
  if (!searchQuery.value) return availableIcons;
  const q = searchQuery.value.toLowerCase();
  return availableIcons.filter(icon => icon.toLowerCase().includes(q));
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
  }
}

function selectIcon(icon) {
  emit('update:modelValue', icon);
  isOpen.value = false;
}

function handleClickOutside(event) {
  if (selectorRef.value && !selectorRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.icon-selector-container {
  position: relative;
  width: 100%;
}

.selected-icon-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--border-light, #cbd5e1);
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.selected-icon-display:hover {
  border-color: var(--primary);
}

.icon-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.icon-preview.placeholder {
  background: #f1f5f9;
  color: #94a3b8;
}

.icon-name {
  flex-grow: 1;
  font-size: 14px;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  color: #94a3b8;
  font-size: 12px;
  transition: transform 0.2s;
}
.dropdown-arrow.open {
  transform: rotate(180deg);
}

.icon-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-width: 300px;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #94a3b8;
  font-size: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 10px 8px 30px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--primary);
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.icon-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  background: #f1f5f9;
  color: var(--primary);
  transform: scale(1.1);
}

.icon-option.active {
  background: var(--primary);
  color: #ffffff;
}

.no-icons-msg {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px 0;
  color: #94a3b8;
  font-size: 13px;
}
</style>
