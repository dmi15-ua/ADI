import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import { crearRouter } from './router/index.js'

const pinia = createPinia()

createApp(App)
  .use(pinia)
  .use(crearRouter(undefined, pinia))
  // Tema claro fijo: sin esta opción PrimeVue sigue el modo oscuro del sistema, y los textos quedan blancos sobre un fondo claro
  .use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: false } } })
  .use(ToastService)
  .use(ConfirmationService)
  .mount('#app')