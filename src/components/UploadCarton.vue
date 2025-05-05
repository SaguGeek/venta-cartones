<template>
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Subir Cartones</h2>
    <div class="flex flex-col items-center">
      <input
        type="file"
        @change="onFileChange"
        accept="image/*"
        multiple
        class="mb-4 p-2 border rounded-md w-full max-w-md"
      />
      <button
        @click="checkAndUploadImages"
        class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
        :disabled="uploading || !selectedFiles.length"
      >
        <span v-if="uploading" class="flex items-center">
          <svg class="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Subiendo...
        </span>
        <span v-else>Subir Imágenes</span>
      </button>
    </div>
    <div v-if="duplicates.length > 0" class="mt-4">
      <h3 class="text-lg font-medium text-red-600">Archivos ya existentes:</h3>
      <ul class="mt-2">
        <li v-for="duplicate in duplicates" :key="duplicate" class="text-red-600">{{ duplicate }}</li>
      </ul>
    </div>
    <!-- Modal de Progreso -->
    <div v-if="showProgressModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Subiendo Imágenes</h3>
        <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            class="bg-blue-600 h-4 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <p class="text-center text-gray-700">{{ uploadedCount }} de {{ totalFiles }} subidas</p>
        <button
          @click="closeProgressModal"
          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          :disabled="uploading"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedFiles: [],
      uploadedUrls: [],
      duplicates: [],
      uploadErrors: [],
      uploading: false,
      uploadedCount: 0,
      totalFiles: 0,
      progress: 0,
      showProgressModal: false,
      cloudinaryUrl: 'https://api.cloudinary.com/v1_1/dardyvsja/image/upload',
      uploadPreset: 'cartones_upload'
    };
  },
  methods: {
    onFileChange(event) {
      this.selectedFiles = Array.from(event.target.files);
      this.uploadedUrls = [];
      this.duplicates = [];
      this.uploadErrors = [];
      this.showProgressModal = false;
    },
    async checkAndUploadImages() {
      if (this.selectedFiles.length === 0) {
        alert('Por favor, selecciona al menos una imagen.');
        return;
      }

      this.uploading = true;
      this.totalFiles = this.selectedFiles.length;
      this.uploadedCount = 0;
      this.progress = 0;
      this.showProgressModal = true;

      const serials = this.selectedFiles.map(file => file.name.split('.')[0]);
      const self = this; // Guardamos el contexto de 'this'

      this.$emit('check-duplicates', { serials, files: this.selectedFiles }, async (nonDuplicates) => {
        try {
          if (!Array.isArray(nonDuplicates)) {
            throw new Error('La respuesta de duplicados no es válida.');
          }

          if (nonDuplicates.length === 0) {
            alert('Todos los archivos seleccionados ya existen.');
            self.uploading = false;
            self.showProgressModal = false;
            return;
          }

          self.duplicates = self.selectedFiles
            .filter(file => !nonDuplicates.some(nd => nd.name === file.name))
            .map(file => file.name);

          const uploadPromises = nonDuplicates.map(async (file) => {
            const serial = file.name.split('.')[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', self.uploadPreset);

            try {
              const response = await fetch(self.cloudinaryUrl, {
                method: 'POST',
                body: formData
              });
              const data = await response.json();
              if (data.secure_url) {
                self.uploadedUrls.push(data.secure_url);
                self.uploadedCount++;
                self.progress = Math.round((self.uploadedCount / self.totalFiles) * 100);
                return { serial, imageUrl: data.secure_url };
              } else {
                throw new Error(`Error al subir ${file.name}: ${JSON.stringify(data)}`);
              }
            } catch (error) {
              console.error(`Error al subir ${file.name}:`, error);
              return null;
            }
          });

          const results = await Promise.all(uploadPromises);
          const validResults = results.filter(result => result !== null);
          if (validResults.length > 0) {
            self.$emit('images-uploaded', validResults);
            alert(`${validResults.length} de ${nonDuplicates.length} imágenes subidas correctamente.`);
          } else {
            alert('No se subieron imágenes correctamente.');
          }
        } catch (error) {
          console.error('Error en el proceso de subida:', error);
          alert('Error en el proceso de subida: ' + error.message);
        } finally {
          self.uploading = false;
          self.progress = 100;
          setTimeout(() => {
            self.showProgressModal = false;
          }, 1000); // Mantener el modal visible por 1 segundo al terminar
        }
      });
    },
    closeProgressModal() {
      if (!this.uploading) {
        this.showProgressModal = false;
      }
    }
  }
};
</script>

<style scoped>
/* Tailwind maneja los estilos */
</style>