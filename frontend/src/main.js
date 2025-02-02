import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import loadComponents from './components'

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import "leaflet/dist/leaflet.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
loadComponents(app);

app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app');
