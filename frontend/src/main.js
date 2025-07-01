import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import loadComponents from './components'

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { definePreset } from '@primevue/themes';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import "leaflet/dist/leaflet.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
const customPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        }
    }
});
app.use(PrimeVue, {
    theme: {
        preset: customPreset,
        options: {
            darkModeSelector: '.app-dark'
        },
    }
});
app.use(ToastService);
app.use(ConfirmationService);
loadComponents(app);

app.component('font-awesome-icon', FontAwesomeIcon)
app.directive('tooltip', Tooltip);
app.mount('#app');
