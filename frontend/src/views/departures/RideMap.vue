<template>
    <div class="h-full relative">
        <l-map ref="map" v-model:zoom="zoom" :center="center" :useGlobalLeaflet="false" @click="handleMapClick" :options="{zoomControl: false}">
            <l-control-zoom position="bottomright"></l-control-zoom>
            <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
            ></l-tile-layer>
        </l-map>
    </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LPolyline, LControl, LControlZoom } from "@vue-leaflet/vue-leaflet";

const zoom = ref(13)
const center = ref([44.136352, 12.242244])
</script>