<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Lista de Cartones</h2>
      <div>
        <button
          @click="loadData"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition mr-2 flex items-center"
          :disabled="loading"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </span>
          <span v-else>Refrescar</span>
        </button>
        <button
          @click="downloadReport"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
        >
          Descargar Reporte
        </button>
      </div>
    </div>
    <!-- Estadísticas -->
    <div v-if="!loading" class="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 class="text-xl font-medium text-gray-700 mb-2">Estadísticas</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="text-center">
          <p class="text-gray-600">Cartones Disponibles</p>
          <p class="text-2xl font-bold text-blue-600">{{ availableCartons }}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Cartones Vendidos</p>
          <p class="text-2xl font-bold text-green-600">{{ soldCartons }}</p>
        </div>
        <div class="text-center">
          <p class="text-gray-600">Vendedores</p>
          <p class="text-2xl font-bold text-purple-600">{{ sellerCount }}</p>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-gray-600">Total de Cartones: {{ totalCartons }}</p>
        <p class="text-gray-600">Cartones Asignados: {{ assignedCartons }}</p>
      </div>
    </div>
    <!-- Lista de Cartones -->
    <div v-if="loading" class="text-center text-gray-600">Cargando cartones...</div>
    <div v-else>
      <p v-if="cartones.length === 0" class="text-gray-600">No hay cartones disponibles.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="carton in paginatedCartons"
          :key="carton.id"
          class="carton-item bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
          @click="openModal(carton)"
        >
          <img
            :src="carton.imageUrl"
            :alt="'Cartón ' + carton.serial"
            class="carton-image w-full h-48 object-cover rounded-md mb-2"
            @error="handleImageError(carton)"
          />
          <p class="text-gray-800 font-medium"><strong>Serial:</strong> {{ carton.serial }}</p>
          <p class="text-gray-600"><strong>Estado:</strong> {{ carton.estado }}</p>
        </div>
      </div>
      <!-- Controles de Paginación -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-center items-center space-x-4">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
          :class="{ 'cursor-not-allowed opacity-50': currentPage === 1 }"
        >
          Anterior
        </button>
        <span class="text-gray-700">Página {{ currentPage }} de {{ totalPages }}</span>
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
          :class="{ 'cursor-not-allowed opacity-50': currentPage === totalPages }"
        >
          Siguiente
        </button>
      </div>
    </div>
    <!-- Modal de Detalles -->
    <div v-if="selectedCarton" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Detalles del Cartón</h3>
        <img
          :src="selectedCarton.imageUrl"
          :alt="'Cartón ' + selectedCarton.serial"
          class="w-full h-auto rounded-md mb-4"
          @error="handleImageError(selectedCarton)"
        />
        <p class="text-gray-800 font-medium"><strong>Serial:</strong> {{ selectedCarton.serial }}</p>
        <p class="text-gray-600"><strong>Estado:</strong> {{ selectedCarton.estado }}</p>
        <div class="mt-4 flex justify-end space-x-4">
          <button
            v-if="selectedCarton.estado === 'asignado'"
            @click="confirmMakeAvailable"
            class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
          >
            Devolver a Disponible
          </button>
          <button
            @click="closeModal"
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
    <!-- Modal de Confirmación -->
    <div v-if="showConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Confirmar Acción</h3>
        <p class="text-gray-600">¿Estás seguro de que deseas devolver el cartón con serial {{ selectedCarton.serial }} a disponible? Esto permitirá asignarlo a otro vendedor.</p>
        <div class="mt-4 flex justify-end space-x-4">
          <button
            @click="cancelMakeAvailable"
            class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            @click="makeAvailable"
            class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      cartones: [],
      selectedCarton: null,
      availableCartons: 0,
      soldCartons: 0,
      assignedCartons: 0,
      totalCartons: 0,
      sellerCount: 0,
      loading: false,
      showConfirm: false,
      currentPage: 1,
      itemsPerPage: 8,
      unsubscribeCartons: null,
      unsubscribeSellers: null
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.cartones.length / this.itemsPerPage);
    },
    paginatedCartons() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.cartones.slice(start, end);
    }
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    if (this.unsubscribeCartons) {
      this.unsubscribeCartons();
    }
    if (this.unsubscribeSellers) {
      this.unsubscribeSellers();
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        await this.loadCartones();
        await this.loadSellers();
      } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar datos: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    async loadCartones() {
      try {
        const cartonesRef = collection(db, 'cartones');
        this.unsubscribeCartons = onSnapshot(cartonesRef, (querySnapshot) => {
          this.cartones = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          this.cartones.sort((a, b) => {
            const serialA = parseInt(a.serial.replace('LM', ''), 10);
            const serialB = parseInt(b.serial.replace('LM', ''), 10);
            return serialA - serialB;
          });
          this.availableCartons = this.cartones.filter(c => c.estado === 'disponible').length;
          this.soldCartons = this.cartones.filter(c => c.estado === 'vendido').length;
          this.assignedCartons = this.cartones.filter(c => c.estado === 'asignado').length;
          this.totalCartons = this.cartones.length;
          console.log('Cartones cargados:', this.cartones);
          this.loading = false;
        }, (error) => {
          console.error('Error al escuchar cartones:', error);
          throw error;
        });
      } catch (error) {
        console.error('Error al cargar los cartones:', error);
        throw error;
      }
    },
    async loadSellers() {
      try {
        const sellersRef = collection(db, 'vendedores');
        this.unsubscribeSellers = onSnapshot(sellersRef, (querySnapshot) => {
          this.sellerCount = querySnapshot.docs.length;
        }, (error) => {
          console.error('Error al escuchar vendedores:', error);
          throw error;
        });
      } catch (error) {
        console.error('Error al cargar los vendedores:', error);
        throw error;
      }
    },
    openModal(carton) {
      this.selectedCarton = carton;
    },
    closeModal() {
      this.selectedCarton = null;
      this.showConfirm = false;
    },
    handleImageError(carton) {
      console.error(`Error al cargar la imagen del cartón ${carton.serial}:`, carton.imageUrl);
      carton.imageUrl = null;
    },
    confirmMakeAvailable() {
      this.showConfirm = true;
    },
    cancelMakeAvailable() {
      this.showConfirm = false;
    },
    async makeAvailable() {
      if (!this.selectedCarton) return;

      try {
        console.log('Devolviendo cartón a disponible:', this.selectedCarton.id);
        const cartonRef = doc(db, 'cartones', this.selectedCarton.id);
        await updateDoc(cartonRef, {
          vendedorId: null,
          estado: 'disponible'
        });
        console.log('Cartón devuelto a disponible exitosamente');
        alert('Cartón devuelto a disponible exitosamente');
        this.showConfirm = false;
        this.selectedCarton = null;
        await this.loadData();
      } catch (error) {
        console.error('Error al devolver cartón a disponible:', error);
        alert('Error al devolver cartón a disponible: ' + error.message);
      }
    },
    previousPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    downloadReport() {
      const report = `
        Reporte de Cartones - ${new Date().toLocaleDateString()}
        ======================================
        Total de Cartones: ${this.totalCartons}
        Cartones Disponibles: ${this.availableCartons}
        Cartones Vendidos: ${this.soldCartons}
        Cartones Asignados: ${this.assignedCartons}
        Total de Vendedores: ${this.sellerCount}
        ======================================
        Detalle de Cartones:
        ${this.cartones.map(c => `Serial: ${c.serial}, Estado: ${c.estado}`).join('\n')}
      `;
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_cartones_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
/* Tailwind maneja los estilos */
</style>