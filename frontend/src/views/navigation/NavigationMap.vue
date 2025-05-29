<template>
    <div class="h-full relative">
        <l-map ref="map" v-model:zoom="zoom" :center="[44.136352, 12.242244]" :useGlobalLeaflet="false" @click="handleMapClick">
            <l-control-zoom position="bottomright"></l-control-zoom>
            <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
            ></l-tile-layer>
            <l-marker :lat-lng="marker.latlng" v-if="marker.visible">
                <l-popup v-if="popup.visible">
                     <SelectButton v-model="markerSelected" :options="options" @click="selectMarker"/>
                </l-popup>
            </l-marker>
            <l-marker :lat-lng="departure.latlng" v-if="departure.visible">
            </l-marker>
            <l-marker :lat-lng="arrival.latlng" v-if="arrival.visible">
            </l-marker>
        </l-map>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LPolyline, LControl, LControlZoom } from "@vue-leaflet/vue-leaflet";

const zoom = ref(13);
const departure = ref({ visible: false, latlng: null });
const arrival = ref({ visible: false, latlng: null });
const marker = ref({ visible: false, latlng: null })
const popup = ref({visible: false})
const options = ref(['Partenza', 'Arrivo']);
const markerSelected = ref('');

const emit = defineEmits(['update:departure', 'update:arrival']);

const handleMapClick = (event) => {
    const latlng = event.latlng;
    popup.value.visible = true;
    marker.value = { visible: true, latlng: latlng };
}

const selectMarker = (event) => {
    if(markerSelected.value === 'Partenza') {   
        emit('update:departure', marker.value.latlng);
        departure.value = { visible: true, latlng: marker.value.latlng };
    } else if (markerSelected.value === 'Arrivo') {
        emit('update:arrival', marker.value.latlng);
        arrival.value = { visible: true, latlng: marker.value.latlng };
    }
    popup.value.visible = false;
    marker.value.visible = false;
    markerSelected.value = '';
}


</script>