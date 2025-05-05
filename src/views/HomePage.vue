<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
    <!-- Barra de Navegación -->
    <header class="bg-gray-800 bg-opacity-90 shadow-xl sticky top-0 z-50 backdrop-blur-md">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <span class="text-3xl font-extrabold text-purple-400 animate-pulse">VC</span>
          <h1 class="text-2xl font-bold text-white tracking-wide">Dashboard Admin</h1>
        </div>
        <button
          @click="logout"
          class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2 rounded-full hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="container mx-auto px-6 py-10">
      <div class="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        <!-- Sección de Subir Cartones -->
        <div class="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-2">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6 tracking-tight">Subir Cartones</h2>
          <UploadCarton @check-duplicates="checkDuplicates" @images-uploaded="handleImagesUploaded" />
        </div>

        <!-- Sección de Asignar Cartones -->
        <div class="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-2">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6 tracking-tight">Asignar Cartones</h2>
          <AssignCartons @cartones-asignados="refreshCartones" />
        </div>

        <!-- Sección de Lista de Cartones -->
        <div class="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-2">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6 tracking-tight">Lista de Cartones</h2>
          <CartonList ref="cartonList" />
        </div>

        <!-- Sección de Lista de Vendedores -->
        <div class="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl transition-all duration-500 hover:shadow-3xl hover:-translate-y-2">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6 tracking-tight">Lista de Vendedores</h2>
          <SellerList />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import UploadCarton from '../components/UploadCarton.vue';
import AssignCartons from '../components/AssignCartons.vue';
import CartonList from '../components/CartonList.vue';
import SellerList from '../components/SellerList.vue';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default {
  name: 'HomePage',
  components: {
    UploadCarton,
    AssignCartons,
    CartonList,
    SellerList
  },
  data() {
    return {
      inactivityTimeout: null,
      inactivityLimit: 15 * 60 * 1000 // 15 minutos en milisegundos
    };
  },
  mounted() {
    this.setupInactivityTimer();
  },
  beforeUnmount() {
    this.clearInactivityTimer();
  },
  methods: {
    async checkDuplicates({ serials, files }, callback) {
      try {
        const cartonesRef = collection(db, 'cartones');
        const q = query(cartonesRef, where('serial', 'in', serials));
        const querySnapshot = await getDocs(q);
        const existingSerials = querySnapshot.docs.map(doc => doc.data().serial);
        const nonDuplicates = files.filter(file => !existingSerials.includes(file.name.split('.')[0]));
        callback(nonDuplicates);
      } catch (error) {
        console.error('Error al verificar duplicados:', error);
        alert('Error al verificar duplicados: ' + error.message);
        callback([]);
      }
    },
    async handleImagesUploaded(images) {
      let successCount = 0;
      try {
        for (const image of images) {
          if (image.serial && image.imageUrl) {
            const docRef = await addDoc(collection(db, 'cartones'), {
              serial: image.serial,
              imageUrl: image.imageUrl,
              estado: 'disponible',
              createdAt: new Date(),
              vendedorId: null
            });
            console.log(`Cartón ${image.serial} guardado con ID:`, docRef.id);
            successCount++;
          } else if (typeof image === 'string') {
            const serial = this.selectedFiles.find(file => file.name.includes(image.split('/').pop().split('.')[0]))?.name.split('.')[0];
            if (serial) {
              const docRef = await addDoc(collection(db, 'cartones'), {
                serial: serial,
                imageUrl: image,
                estado: 'disponible',
                createdAt: new Date(),
                vendedorId: null
              });
              console.log(`Cartón ${serial} guardado con ID:`, docRef.id);
              successCount++;
            }
          }
        }
        alert(`${successCount} de ${images.length} cartones se guardaron exitosamente en Firestore`);
      } catch (error) {
        console.error('Error al guardar los cartones:', error);
        alert(`Error al guardar los cartones: ${error.message}. Se guardaron ${successCount} de ${images.length} cartones.`);
      }
    },
    async refreshCartones() {
      if (this.$refs.cartonList && typeof this.$refs.cartonList.loadCartones === 'function') {
        await this.$refs.cartonList.loadCartones();
      } else {
        console.warn('loadCartones no está disponible en CartonList');
      }
    },
    async logout() {
      try {
        await signOut(auth);
        this.$router.push('/login');
        console.log('Sesión cerrada con éxito');
        this.clearInactivityTimer();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
      }
    },
    setupInactivityTimer() {
      // Eventos que indican actividad del usuario
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      const resetTimer = () => {
        this.clearInactivityTimer();
        this.inactivityTimeout = setTimeout(() => {
          this.logout();
          alert('Sesión cerrada por inactividad de 15 minutos.');
        }, this.inactivityLimit);
      };

      // Añadir listeners para los eventos
      events.forEach(event => {
        window.addEventListener(event, resetTimer);
      });

      // Iniciar el temporizador al montar el componente
      resetTimer();
    },
    clearInactivityTimer() {
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      events.forEach(event => {
        window.removeEventListener(event, () => {});
      });
      if (this.inactivityTimeout) {
        clearTimeout(this.inactivityTimeout);
        this.inactivityTimeout = null;
      }
    }
  }
};
</script>

<style scoped>
/* Animación de pulso para el logo */
.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Sombras personalizadas */
.shadow-3xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>