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

createApp(App)
  .use(createPinia())
  .use(crearRouter())
  .use(PrimeVue, { theme: { preset: Aura } })
  .use(ToastService)
  .use(ConfirmationService)
  .mount('#app')
