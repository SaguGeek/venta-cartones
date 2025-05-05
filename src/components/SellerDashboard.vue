<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 animate-fade-in">
        Dashboard de {{ sellerName || 'Vendedor' }}
      </h1>
      <button
        @click="logout"
        class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
      >
        Cerrar Sesión
      </button>
    </div>

    <!-- Estadísticas -->
    <div class="bg-white p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 sm:grid-cols-4 gap-6">
      <div class="text-center p-4 bg-blue-50 rounded-lg transition-transform hover:scale-105">
        <p class="text-gray-600 font-medium">Cartones Asignados</p>
        <p class="text-3xl font-bold text-blue-600 mt-2">{{ allCartons.length }}</p>
      </div>
      <div class="text-center p-4 bg-blue-50 rounded-lg transition-transform hover:scale-105">
        <p class="text-gray-600 font-medium">Cartones Disponibles</p>
        <p class="text-3xl font-bold text-blue-600 mt-2">{{ availableCartons.length }}</p>
      </div>
      <div class="text-center p-4 bg-green-50 rounded-lg transition-transform hover:scale-105">
        <p class="text-gray-600 font-medium">Cartones Vendidos</p>
        <p class="text-3xl font-bold text-green-600 mt-2">{{ soldCartons.length }}</p>
      </div>
      <div class="text-center p-4 bg-purple-50 rounded-lg transition-transform hover:scale-105">
        <p class="text-gray-600 font-medium">Saldo Generado ($)</p>
        <p class="text-3xl font-bold text-purple-600 mt-2">{{ saldoGenerado }}</p>
      </div>
    </div>

    <!-- Controles para Vender -->
    <div class="bg-white p-6 rounded-xl shadow-lg mb-8">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">Vender Cartón</h2>
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          @click="startQRScanner"
          class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center w-full sm:w-auto"
          :disabled="scanning"
        >
          <span v-if="scanning" class="flex items-center">
            <svg class="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Escaneando...
          </span>
          <span v-else>Escanear QR</span>
        </button>
        <input
          v-model="manualSerial"
          type="text"
          placeholder="Ingresar Serial Manualmente"
          class="border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 w-full sm:w-1/2"
          @keyup.enter="checkCarton"
        />
      </div>

      <!-- Modal para Confirmación de Venta -->
      <div v-if="selectedCarton" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div class="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 hover:scale-105">
          <h3 class="text-2xl font-semibold text-gray-800 mb-4 text-center">Confirmar Venta</h3>
          <img :src="selectedCarton.imageUrl" :alt="'Cartón ' + selectedCarton.serial" class="w-full h-auto object-contain rounded-lg mb-4" @error="handleImageError(selectedCarton)" style="max-height: 200px;" />
          <p class="text-gray-800 font-medium text-center">Serial: {{ selectedCarton.serial }}</p>
          <div class="mt-6 flex justify-center space-x-6">
            <button @click="cancelSale" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
              Cancelar
            </button>
            <button @click="confirmSale" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-300">
              Vender
            </button>
          </div>
        </div>
      </div>

      <!-- Video para Escaneo QR (oculto por defecto) -->
      <div v-if="scanning" class="relative mt-6">
        <video ref="video" class="w-full max-w-md rounded-lg shadow-md" autoplay></video>
        <canvas ref="canvas" class="hidden"></canvas>
      </div>
    </div>

    <!-- Lista de Cartones -->
    <div class="bg-white p-6 rounded-xl shadow-lg">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">Todos los Cartones</h2>
      <div v-if="paginatedCartons.length === 0" class="text-gray-600 text-center py-4">No hay cartones asignados.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="carton in paginatedCartons" :key="carton.id" :class="['bg-white border-2 border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden', { 'bg-green-800 bg-opacity-30': carton.estado === 'vendido' }]">
          <img :src="carton.imageUrl" :alt="'Cartón ' + carton.serial" class="w-full h-auto object-contain" @error="handleImageError(carton)" style="max-height: 150px;" />
          <div class="p-2">
            <p class="text-gray-800 font-medium text-center text-sm">Serial: {{ carton.serial }}</p>
            <p class="text-gray-600 text-center text-xs">Estado: {{ carton.estado }}</p>
          </div>
        </div>
      </div>

      <!-- Controles de Paginación -->
      <div class="flex justify-between items-center mt-6">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition duration-300"
        >
          Anterior
        </button>
        <p class="text-gray-700">Página {{ currentPage }} de {{ totalPages }}</p>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition duration-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { auth } from '../firebase';

export default {
  data() {
    return {
      availableCartons: [],
      soldCartons: [],
      allCartons: [],
      saldoGenerado: 0,
      sellerName: '',
      selectedCarton: null,
      manualSerial: '',
      scanning: false,
      unsubscribeAvailable: null,
      unsubscribeSold: null,
      stream: null,
      inactivityTimeout: null,
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    paginatedCartons() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.allCartons.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.allCartons.length / this.itemsPerPage);
    }
  },
  async mounted() {
    await this.loadCartons();
    await this.loadUserData();
    this.setupInactivityTimer();
    this.resetInactivityTimer();

    // Escuchar eventos de interacción para resetear el temporizador
    ['click', 'mousemove', 'keydown', 'touchstart'].forEach(event => {
      window.addEventListener(event, this.resetInactivityTimer);
    });
  },
  beforeUnmount() {
    if (this.unsubscribeAvailable) this.unsubscribeAvailable();
    if (this.unsubscribeSold) this.unsubscribeSold();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    ['click', 'mousemove', 'keydown', 'touchstart'].forEach(event => {
      window.removeEventListener(event, this.resetInactivityTimer);
    });
  },
  methods: {
    async loadCartons() {
      const user = auth.currentUser;
      if (!user) return;

      // Cargar cartones asignados
      const assignedQuery = query(
        collection(db, 'cartones'),
        where('vendedorId', '==', user.uid),
        where('estado', '==', 'asignado')
      );
      this.unsubscribeAvailable = onSnapshot(assignedQuery, (snapshot) => {
        this.availableCartons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.updateAllCartons();
      }, (error) => console.error('Error al cargar cartones disponibles:', error));

      // Cargar cartones vendidos
      const soldQuery = query(
        collection(db, 'cartones'),
        where('vendedorId', '==', user.uid),
        where('estado', '==', 'vendido')
      );
      this.unsubscribeSold = onSnapshot(soldQuery, (snapshot) => {
        this.soldCartons = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.updateAllCartons();
      }, (error) => console.error('Error al cargar cartones vendidos:', error));
    },
    updateAllCartons() {
      this.allCartons = [...this.availableCartons, ...this.soldCartons].sort((a, b) => a.serial.localeCompare(b.serial));
      // Resetear a la primera página si cambian los cartones
      this.currentPage = 1;
    },
    async loadUserData() {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'vendedores', user.uid);
      onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          this.saldoGenerado = data.saldoGenerado || 0;
          this.sellerName = data.nombre || 'Vendedor';
        }
      }, (error) => console.error('Error al cargar datos del vendedor:', error));
    },
    setupInactivityTimer() {
      this.inactivityTimeout = setTimeout(() => this.logout(), 15 * 60 * 1000); // 15 minutos
    },
    resetInactivityTimer() {
      if (this.inactivityTimeout) {
        clearTimeout(this.inactivityTimeout);
      }
      this.inactivityTimeout = setTimeout(() => this.logout(), 15 * 60 * 1000);
    },
    async logout() {
      try {
        await auth.signOut();
        this.$router.push('/login');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
      }
    },
    async startQRScanner() {
      this.scanning = true;
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = this.stream;
        video.play();

        const tick = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              this.manualSerial = code.data;
              this.checkCarton();
              this.stopQRScanner();
            }
          }
          if (this.scanning) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.');
        this.scanning = false;
      }
    },
    stopQRScanner() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      this.scanning = false;
      this.$refs.video.srcObject = null;
    },
    async checkCarton() {
      const serial = this.manualSerial.trim();
      if (!serial) return;

      const cartonQuery = query(
        collection(db, 'cartones'),
        where('serial', '==', serial),
        where('vendedorId', '==', auth.currentUser.uid),
        where('estado', '==', 'asignado')
      );
      const snapshot = await getDocs(cartonQuery);
      if (!snapshot.empty) {
        this.selectedCarton = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        this.manualSerial = '';
      } else {
        alert('Cartón no encontrado o no disponible para este vendedor.');
        this.manualSerial = '';
      }
    },
    async confirmSale() {
      if (!this.selectedCarton) return;

      try {
        const cartonRef = doc(db, 'cartones', this.selectedCarton.id);
        await updateDoc(cartonRef, { estado: 'vendido' });

        const sellerRef = doc(db, 'vendedores', auth.currentUser.uid);
        const newSaldo = this.saldoGenerado + 5;
        await updateDoc(sellerRef, { saldoGenerado: newSaldo });

        this.saldoGenerado = newSaldo;
        this.selectedCarton = null;
        await this.loadCartons();
      } catch (error) {
        console.error('Error al vender el cartón:', error);
        alert('Error al vender el cartón: ' + error.message);
      }
    },
    cancelSale() {
      this.selectedCarton = null;
    },
    handleImageError(carton) {
      console.error(`Error al cargar la imagen del cartón ${carton.serial}:`, carton.imageUrl);
      carton.imageUrl = null;
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    }
  }
};
</script>

<style scoped>
/* Animación de fade-in */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Animación de rotación para el spinner */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>