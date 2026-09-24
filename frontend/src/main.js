import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vue3Toastify from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import App from './App.vue';
import router from './router';
import './assets/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Vue3Toastify, {
  autoClose: 3500,
  position: 'top-right',
  transition: 'slide',
  clearOnUrlChange: false
});

app.mount('#app');
