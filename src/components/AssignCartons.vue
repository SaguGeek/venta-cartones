```vue
<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Asignar Cartones por Lote</h2>
    <form @submit.prevent="assignCartons" class="space-y-4">
      <!-- Selección de Vendedor -->
      <div>
        <label for="seller" class="block text-sm font-medium text-gray-700">Seleccionar Vendedor</label>
        <select
          v-model="selectedSeller"
          id="seller"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
        >
          <option value="" disabled>Selecciona un vendedor</option>
          <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.nombre || seller.id }}</option>
        </select>
      </div>

      <!-- Rango de Cartones Disponibles -->
      <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <div class="w-full sm:w-1/2">
          <label for="fromCarton" class="block text-sm font-medium text-gray-700">Desde</label>
          <select
            v-model="fromCarton"
            id="fromCarton"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
          >
            <option value="" disabled>Selecciona un cartón</option>
            <option v-for="carton in availableCartons" :key="carton.id" :value="carton.id">{{ carton.serial }}</option>
          </select>
        </div>
        <div class="w-full sm:w-1/2">
          <label for="toCarton" class="block text-sm font-medium text-gray-700">Hasta</label>
          <select
            v-model="toCarton"
            id="toCarton"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
          >
            <option value="" disabled>Selecciona un cartón</option>
            <option v-for="carton in availableCartons" :key="carton.id" :value="carton.id">{{ carton.serial }}</option>
          </select>
        </div>
      </div>

      <!-- Botón de Asignar -->
      <button
        type="submit"
        class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300"
        :disabled="!selectedSeller || !fromCarton || !toCarton"
      >
        Asignar Seleccionados
      </button>

      <!-- Mensaje de Advertencia -->
      <p v-if="!selectedSeller || !fromCarton || !toCarton" class="text-yellow-600 text-sm text-center">
        Por favor, selecciona un vendedor y un rango de cartones.
      </p>
    </form>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      sellers: [],
      availableCartons: [],
      selectedSeller: '',
      fromCarton: '',
      toCarton: ''
    };
  },
  async mounted() {
    await this.loadSellers();
    await this.loadAvailableCartons();
  },
  methods: {
    async loadSellers() {
      try {
        console.log('Cargando vendedores...');
        const querySnapshot = await getDocs(collection(db, 'vendedores'));
        this.sellers = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            ...data,
            vendedorId: data.vendedorId || docSnapshot.id
          };
        });
        console.log('Vendedores cargados:', this.sellers);
      } catch (error) {
        console.error('Error al cargar los vendedores:', error);
        alert('Error al cargar los vendedores: ' + error.message);
      }
    },
    async loadAvailableCartons() {
      try {
        console.log('Cargando cartones disponibles...');
        const q = query(
          collection(db, 'cartones'),
          where('vendedorId', '==', null),
          where('estado', '==', 'disponible')
        );
        const querySnapshot = await getDocs(q);
        this.availableCartons = querySnapshot.docs.map(doc => ({
          id: doc.id,
          serial: doc.data().serial
        }));
        // Ordenar los cartones por serial para facilitar la selección de rangos
        this.availableCartons.sort((a, b) => a.serial.localeCompare(b.serial));
        console.log('Cartones disponibles:', this.availableCartons);
      } catch (error) {
        console.error('Error al cargar cartones disponibles:', error);
        alert('Error al cargar cartones disponibles: ' + error.message);
      }
    },
    async assignCartons() {
      if (!this.selectedSeller || !this.fromCarton || !this.toCarton) return;

      try {
        console.log('Asignando cartones a vendedor:', this.selectedSeller, 'Desde:', this.fromCarton, 'Hasta:', this.toCarton);
        const fromIndex = this.availableCartons.findIndex(carton => carton.id === this.fromCarton);
        const toIndex = this.availableCartons.findIndex(carton => carton.id === this.toCarton);

        if (fromIndex === -1 || toIndex === -1) {
          throw new Error('Cartón inicial o final no encontrado');
        }

        const startIndex = Math.min(fromIndex, toIndex);
        const endIndex = Math.max(fromIndex, toIndex);

        const selectedCartons = this.availableCartons.slice(startIndex, endIndex + 1).map(carton => carton.id);
        console.log('Cartones seleccionados en el rango:', selectedCartons);

        const batch = [];
        for (const cartonId of selectedCartons) {
          const cartonRef = doc(db, 'cartones', cartonId);
          batch.push(updateDoc(cartonRef, {
            vendedorId: this.selectedSeller,
            estado: 'asignado'
          }));
        }
        await Promise.all(batch);
        console.log('Cartones asignados exitosamente');
        alert('Cartones asignados exitosamente');

        this.fromCarton = '';
        this.toCarton = '';
        await this.loadAvailableCartons();
        this.$emit('cartons-asignados'); // Emitir evento para actualizar en tiempo real
      } catch (error) {
        console.error('Error al asignar cartones:', error);
        alert('Error al asignar cartones: ' + error.message);
      }
    }
  }
};
</script>

<style scoped>
/* Tailwind maneja los estilos */
</style>
```