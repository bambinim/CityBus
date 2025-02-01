import AppMenu from './components/AppMenu.vue'
import AppMap from './views/line/components/AppMap.vue'
import draggable from 'vuedraggable/src/vuedraggable'

export default (app) => {
    app.component('AppMenu', AppMenu);
    app.component('AppMap', AppMap);
    app.component('draggable', draggable)
}