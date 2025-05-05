import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/tailwind.css';
import { auth } from './firebase';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Crear la aplicación
const app = createApp(App);

// Configurar persistencia de sesión antes de montar la aplicación
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Persistencia de sesión configurada correctamente');
    // Montar la aplicación después de configurar la persistencia
    app.use(router);
    app.use(Toast, {
      transition: 'Vue-Toastification__bounce',
      maxToasts: 20,
      newestOnTop: true,
      position: 'top-right',
      timeout: 3000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false
    });
    app.mount('#app');
  })
  .catch((error) => {
    console.error('Error al configurar persistencia:', error);
    // Montar la aplicación incluso si falla la persistencia (como fallback)
    app.use(router);
    app.use(Toast, {
      transition: 'Vue-Toastification__bounce',
      maxToasts: 20,
      newestOnTop: true,
      position: 'top-right',
      timeout: 3000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false
    });
    app.mount('#app');
  });