<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-300">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-500 opacity-0 animate-fade-in">
      <div class="text-center mb-6">
        <div class="flex justify-center mb-4">
          <span class="text-4xl font-bold text-indigo-600 animate-spin-slow">VC</span>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Venta de Cartones</h2>
        <p class="text-gray-600">Inicia sesión para gestionar tus cartones</p>
      </div>
      <form @submit.prevent="login" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
            placeholder="master1@example.com"
            required
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
            placeholder="Sagu7.98"
            required
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 flex items-center justify-center"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </span>
          <span v-else>Iniciar Sesión</span>
        </button>
        <p v-if="error" class="text-red-500 text-sm text-center">{{ error }}</p>
      </form>
      <div class="mt-4 text-center">
        <p class="text-gray-600 text-sm">¿Olvidaste tu contraseña? <a href="#" class="text-indigo-600 hover:underline transition duration-300">Recupérala</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false
    };
  },
  methods: {
    async login() {
      this.loading = true;
      this.error = '';
      try {
        console.log('Intentando iniciar sesión con:', this.email, this.password);
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        console.log('Sesión iniciada con éxito:', userCredential.user);

        // Verificar el rol del usuario
        const user = userCredential.user;
        const isAdmin = user.email === 'master1@example.com';
        const sellerDoc = await getDoc(doc(db, 'vendedores', user.uid));
        const isSeller = sellerDoc.exists();

        if (isAdmin) {
          this.$router.push('/');
        } else if (isSeller) {
          this.$router.push('/vendedor');
        } else {
          throw new Error('Este usuario no tiene permisos para acceder.');
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error.code, error.message);
        this.error = `Error: ${error.message}`;
        // Cerrar sesión si el usuario no tiene permisos
        if (auth.currentUser) {
          await auth.signOut();
        }
      } finally {
        this.loading = false;
      }
    },
    async resetPassword() {
      if (!this.email) {
        this.error = 'Por favor ingresa tu correo electrónico para recuperar la contraseña.';
        return;
      }
      try {
        await sendPasswordResetEmail(auth, this.email);
        this.error = 'Se ha enviado un correo para restablecer tu contraseña.';
      } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        this.error = 'Error al enviar el correo de recuperación.';
      }
    }
  }
};
</script>

<style scoped>
/* Animación de fade-in para la tarjeta */
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animación de rotación lenta para el logo */
.animate-spin-slow {
  animation: spin 2s linear infinite;
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