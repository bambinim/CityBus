<template>
    <div class="h-full relative">
        <l-map ref="map" v-model:zoom="zoom" :center="center" :useGlobalLeaflet="false" :options="{zoomControl: false}">
            <l-control-zoom position="bottomright"></l-control-zoom>
            <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
            ></l-tile-layer>
            <l-circle-marker
                :radius="8"
                :lat-lng="center"
                :name="name"
                :color="'red'">
            </l-circle-marker>
        </l-map>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LCircleMarker, LPolyline, LControl, LControlZoom } from "@vue-leaflet/vue-leaflet";
import { useBusRideStore } from '@/stores/ride'

const busRideStore = useBusRideStore();
const position = computed(() => busRideStore.position);
const name = computed(() => busRideStore.rideInfo.line.name)
const zoom = ref(13)
const center = ref([position[1] || 44.136352, position[0] || 12.242244]);

watch(position, (newPos) => {
    center.value = [newPos[1], newPos[0]];
});
</script>