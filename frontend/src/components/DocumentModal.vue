<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-card shadow-card">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fa-solid fa-file-circle-plus"></i>
          Nuevo Documento
        </h3>
        <button class="icon-btn" @click="close" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="modal-body">
        <div class="form-group">
          <label class="form-label">Nombre del Documento</label>
          <input 
            type="text" 
            v-model="form.name" 
            class="form-input" 
            placeholder="Ej. Procedimiento de Seguridad" 
            required 
            maxlength="200"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">Código</label>
          <input 
            type="text" 
            v-model="form.code" 
            class="form-input font-mono" 
            placeholder="Ej. DOC-SGC-001" 
            required 
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea 
            v-model="form.description" 
            class="form-textarea" 
            placeholder="Breve descripción del propósito de este documento..."
            rows="3"
            maxlength="1000"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Archivo adjunto (.pdf, .docx, .xlsx)</label>
          <div class="file-upload-box" @click="triggerFileInput" :class="{ 'has-file': selectedFile }">
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden-file-input" 
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              @change="handleFileSelect"
              required
            />
            <div v-if="!selectedFile" class="file-upload-placeholder">
              <i class="fa-solid fa-cloud-arrow-up"></i>
              <p>Haz clic para seleccionar el archivo</p>
            </div>
            <div v-else class="file-selected">
              <i class="fa-solid fa-file-check text-primary"></i>
              <div class="file-info">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close" :disabled="isSubmitting">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <i class="fa-solid fa-spinner fa-spin" v-if="isSubmitting"></i>
            <i class="fa-solid fa-upload" v-else></i>
            Cargar y Guardar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  isSubmitting: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'submit']);

const form = ref({
  name: '',
  code: '',
  description: ''
});

const fileInput = ref(null);
const selectedFile = ref(null);

watch(() => props.show, (newVal) => {
  if (newVal) {
    form.value = { name: '', code: '', description: '' };
    selectedFile.value = null;
  }
});

function close() {
  emit('close');
}

function triggerFileInput() {
  fileInput.value.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  
  if (!validExtensions.includes(ext)) {
    alert("Formato de archivo no soportado.");
    event.target.value = '';
    return;
  }
  
  selectedFile.value = file;
}

function submitForm() {
  if (!selectedFile.value) {
    alert('Por favor selecciona un archivo.');
    return;
  }
  
  emit('submit', {
    ...form.value,
    file: selectedFile.value
  });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border-radius: var(--radius-xl);
  padding: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  font-family: var(--font-primary);
  font-size: 13px;
  color: var(--text-main);
  outline: none;
  transition: var(--transition);
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.font-mono {
  font-family: monospace;
  font-weight: 600;
}

.file-upload-box {
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-main);
  transition: all 0.2s;
}

.file-upload-box:hover {
  border-color: var(--primary);
  background: #f1f5f9;
}

.file-upload-box.has-file {
  border-style: solid;
  border-color: var(--brand-green);
  background: rgba(117, 186, 33, 0.05);
}

.hidden-file-input {
  display: none;
}

.file-upload-placeholder i {
  font-size: 28px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.file-upload-placeholder p {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  margin: 0;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.file-selected i {
  font-size: 24px;
  color: var(--brand-green);
}

.file-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.file-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.file-size {
  font-size: 11px;
  color: var(--text-muted);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.icon-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
}
.icon-btn:hover { color: #dc2626; }
</style>
