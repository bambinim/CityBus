import AppMenu from './components/AppMenu.vue'
import AppMap from './components/AppMap.vue'

export default (app) => {
    app.component('AppMenu', AppMenu);
    app.component('AppMap', AppMap);
}