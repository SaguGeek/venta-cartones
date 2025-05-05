<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Lista de Vendedores</h2>
      <button
        @click="showAddModal = true"
        class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        Agregar Vendedor
      </button>
    </div>
    <div v-if="loading" class="text-center text-gray-600">Cargando vendedores...</div>
    <div v-else-if="sellers.length === 0" class="text-gray-600">No hay vendedores registrados.</div>
    <div v-else class="space-y-4">
      <div v-for="seller in sellers" :key="seller.id" class="border p-4 rounded-md flex justify-between items-center">
        <div>
          <p class="text-lg font-medium text-gray-700">{{ seller.nombre || seller.id || 'Sin nombre' }}</p>
          <p class="text-sm text-gray-500">Saldo Generado: ${{ seller.saldoGenerado || 0 }}</p>
          <p class="text-sm text-gray-500">Cartones Asignados: {{ seller.assignedCartons }}</p>
        </div>
        <button
          @click="showSellerDetails(seller)"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Ver Detalles
        </button>
      </div>
    </div>

    <!-- Modal para mostrar detalles del vendedor -->
    <div v-if="selectedSeller" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">{{ selectedSeller.nombre || selectedSeller.id || 'Sin nombre' }}</h3>
        <div class="space-y-2">
          <p><strong>Cartones Asignados:</strong> {{ assignedCartons.length }}</p>
          <p v-if="assignedCartons.length === 0">No hay cartones asignados.</p>
          <div v-else>
            <ul class="list-disc pl-5">
              <li v-for="carton in assignedCartons" :key="carton.id">
                {{ carton.serial }}
                <button
                  @click="sellCarton(carton.id)"
                  class="ml-2 bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition"
                >
                  Vender
                </button>
              </li>
            </ul>
          </div>
          <p><strong>Cartones Vendidos:</strong> {{ soldCartons.length }}</p>
          <p><strong>Cartones Disponibles (Global):</strong> {{ availableCartons.length }}</p>
          <p><strong>Saldo Generado:</strong> ${{ selectedSeller.saldoGenerado || 0 }}</p>
        </div>
        <button
          @click="selectedSeller = null"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md mt-4 hover:bg-indigo-700 transition"
        >
          Cerrar
        </button>
      </div>
    </div>

    <!-- Modal para Agregar Vendedor -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Agregar Nuevo Vendedor</h3>
        <form @submit.prevent="addSeller" class="space-y-4">
          <div>
            <label for="sellerEmail" class="block text-sm font-medium text-gray-700">Correo</label>
            <input
              v-model="newSellerEmail"
              id="sellerEmail"
              type="email"
              required
              class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              placeholder="vendedor1@example.com"
            />
          </div>
          <div>
            <label for="sellerPassword" class="block text-sm font-medium text-gray-700">Clave</label>
            <input
              v-model="newSellerPassword"
              id="sellerPassword"
              type="password"
              required
              class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              placeholder="Ingrese la clave"
            />
          </div>
          <div>
            <label for="sellerUsername" class="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              v-model="newSellerUsername"
              id="sellerUsername"
              type="text"
              required
              class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
              placeholder="Nombre del vendedor"
            />
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showAddModal = false"
              class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default {
  data() {
    return {
      sellers: [],
      selectedSeller: null,
      assignedCartons: [],
      soldCartons: [],
      availableCartons: [],
      loading: false,
      showAddModal: false,
      newSellerEmail: '',
      newSellerPassword: '',
      newSellerUsername: '',
      unsubscribeSellers: null,
      unsubscribeAssigned: null,
      unsubscribeSold: null,
      unsubscribeAvailable: null
    };
  },
  async mounted() {
    await this.loadSellers();
  },
  beforeUnmount() {
    if (this.unsubscribeSellers) {
      this.unsubscribeSellers();
    }
    if (this.unsubscribeAssigned) {
      this.unsubscribeAssigned();
    }
    if (this.unsubscribeSold) {
      this.unsubscribeSold();
    }
    if (this.unsubscribeAvailable) {
      this.unsubscribeAvailable();
    }
  },
  methods: {
    async loadSellers() {
      this.loading = true;
      try {
        console.log('Cargando vendedores...');
        const sellersRef = collection(db, 'vendedores');
        this.unsubscribeSellers = onSnapshot(sellersRef, async (querySnapshot) => {
          this.sellers = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            console.log('Vendedor cargado (ID: ', docSnapshot.id, '):', data);
            const sellerData = {
              id: docSnapshot.id,
              ...data,
              vendedorId: data.vendedorId || docSnapshot.id
            };
            const assignedQuery = query(
              collection(db, 'cartones'),
              where('vendedorId', '==', sellerData.id),
              where('estado', '==', 'asignado')
            );
            const assignedSnapshot = await getDocs(assignedQuery);
            sellerData.assignedCartons = assignedSnapshot.size;
            return sellerData;
          }));
          console.log('Vendedores cargados con estadísticas:', this.sellers);
          this.loading = false;
        }, (error) => {
          console.error('Error al escuchar vendedores:', error);
          alert('Error al cargar vendedores: ' + error.message);
          this.loading = false;
        });
      } catch (error) {
        console.error('Error al cargar los vendedores:', error);
        alert('Error al cargar vendedores: ' + error.message);
        this.loading = false;
      }
    },
    async showSellerDetails(seller) {
      console.log('Mostrando detalles del vendedor:', seller);
      this.selectedSeller = seller;
      if (!seller.vendedorId) {
        console.error('Error: vendedorId no está definido para este vendedor:', seller);
        this.assignedCartons = [];
        this.soldCartons = [];
        this.availableCartons = [];
        return;
      }
      await this.loadSellerCartons(seller.vendedorId);
    },
    async loadSellerCartons(vendedorId) {
      try {
        console.log(`Cargando cartones para el vendedor ${vendedorId}...`);
        const assignedQuery = query(
          collection(db, 'cartones'),
          where('vendedorId', '==', vendedorId),
          where('estado', '==', 'asignado')
        );
        const soldQuery = query(
          collection(db, 'cartones'),
          where('vendedorId', '==', vendedorId),
          where('estado', '==', 'vendido')
        );
        const availableQuery = query(
          collection(db, 'cartones'),
          where('vendedorId', '==', null),
          where('estado', '==', 'disponible')
        );

        // Escuchar cambios en tiempo real para cartones asignados
        this.unsubscribeAssigned = onSnapshot(assignedQuery, (assignedSnapshot) => {
          this.assignedCartons = assignedSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`Cartón asignado encontrado (ID: ${doc.id}):`, data);
            return {
              id: doc.id,
              serial: data.serial
            };
          });
          this.assignedCartons.sort((a, b) => {
            const serialA = parseInt(a.serial.replace('LM', ''), 10);
            const serialB = parseInt(b.serial.replace('LM', ''), 10);
            return serialA - serialB;
          });
          console.log('Cartones asignados:', this.assignedCartons);
        }, (error) => {
          console.error('Error al escuchar cartones asignados:', error);
        });

        // Escuchar cambios en tiempo real para cartones vendidos
        this.unsubscribeSold = onSnapshot(soldQuery, (soldSnapshot) => {
          this.soldCartons = soldSnapshot.docs.map(doc => ({
            id: doc.id,
            serial: doc.data().serial
          }));
          this.soldCartons.sort((a, b) => {
            const serialA = parseInt(a.serial.replace('LM', ''), 10);
            const serialB = parseInt(b.serial.replace('LM', ''), 10);
            return serialA - serialB;
          });
          console.log('Cartones vendidos:', this.soldCartons);
        }, (error) => {
          console.error('Error al escuchar cartones vendidos:', error);
        });

        // Escuchar cambios en tiempo real para cartones disponibles
        this.unsubscribeAvailable = onSnapshot(availableQuery, (availableSnapshot) => {
          this.availableCartons = availableSnapshot.docs.map(doc => ({
            id: doc.id,
            serial: doc.data().serial
          }));
          this.availableCartons.sort((a, b) => {
            const serialA = parseInt(a.serial.replace('LM', ''), 10);
            const serialB = parseInt(b.serial.replace('LM', ''), 10);
            return serialA - serialB;
          });
          console.log('Cartones disponibles (global):', this.availableCartons);
        }, (error) => {
          console.error('Error al escuchar cartones disponibles:', error);
        });
      } catch (error) {
        console.error('Error al cargar los cartones del vendedor:', error);
        this.assignedCartons = [];
        this.soldCartons = [];
        this.availableCartons = [];
      }
    },
    async sellCarton(cartonId) {
      try {
        console.log(`Vendiendo cartón ${cartonId} para el vendedor ${this.selectedSeller.vendedorId}...`);
        const cartonRef = doc(db, 'cartones', cartonId);
        await updateDoc(cartonRef, {
          estado: 'vendido'
        });

        const sellerRef = doc(db, 'vendedores', this.selectedSeller.id);
        const currentSaldo = this.selectedSeller.saldoGenerado || 0;
        await updateDoc(sellerRef, {
          saldoGenerado: currentSaldo + 5
        });

        console.log(`Cartón ${cartonId} marcado como vendido`);
        alert(`Cartón ${cartonId} vendido exitosamente`);

        this.selectedSeller.saldoGenerado = currentSaldo + 5;
        await this.loadSellerCartons(this.selectedSeller.vendedorId);
      } catch (error) {
        console.error('Error al vender el cartón:', error);
        alert('Error al vender el cartón: ' + error.message);
      }
    },
    async addSeller() {
      if (!this.newSellerEmail || !this.newSellerPassword || !this.newSellerUsername) {
        alert('Por favor, complete todos los campos: Correo, Clave y Nombre de Usuario.');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.newSellerEmail, this.newSellerPassword);
        const user = userCredential.user;
        await setDoc(doc(db, 'vendedores', user.uid), {
          email: this.newSellerEmail,
          nombre: this.newSellerUsername,
          saldoGenerado: 0
        });
        console.log('Vendedor agregado exitosamente');
        alert('Vendedor agregado exitosamente');
        this.newSellerEmail = '';
        this.newSellerPassword = '';
        this.newSellerUsername = '';
        this.showAddModal = false;
        await this.loadSellers();
      } catch (error) {
        console.error('Error al agregar vendedor:', error);
        alert('Error al agregar vendedor: ' + error.message);
      }
    }
  }
};
</script>

<style scoped>
/* Tailwind maneja los estilos */
</style>