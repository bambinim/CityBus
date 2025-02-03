<template>
    <div class="h-full relative">
        <l-map ref="map" v-model:zoom="zoom" :center="center" :useGlobalLeaflet="false" @click="handleMapClick" :options="{zoomControl: false}">
            <l-control position="topleft" :disableClickPropagation="true" :disableScrollPropagation="true" >
                <AutoComplete placeholder="Cerca luogo..."
                    v-model="searchValue"
                    @complete="nominatimSearch"
                    :suggestions="searchSuggestions"
                    optionLabel="displayName"
                    @option-select="autoCompleteValueSelected">
                    <template #option="slotProps">
                        {{ slotProps.option.displayName }}
                    </template>
                </AutoComplete>
            </l-control>
            <l-control-zoom position="bottomright"></l-control-zoom>
            <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
            ></l-tile-layer>
            <l-marker v-for="(stop, stopIndex) in busLine.directions[directionIndex].stops"
                :lat-lng="{lng: stop.location.coordinates[0], lat: stop.location.coordinates[1]}"
                :name="stop.name">
                <l-icon :iconSize="[0, 0]" :iconAnchor="[10, 10]">
                    <div class="rounded-full flex flex-col justify-center items-center"  style="width: 20px; height: 20px; background-color: blue;">
                        <span style="color: white;">{{ stopIndex + 1 }}</span>
                    </div>
                </l-icon>
            </l-marker>
            <l-marker :lat-lng="marker.latlng" v-if="marker.visible" @update:visible="v => marker.visible = v" draggable @update:latLng="updateMarkerCoordinates" @update:lat-lng="updateMarkerCoordinates">
                <l-popup v-if="popup.visible">
                    <div class="flex flex-col">
                        <InputText placeholder="Nome fermata" v-model="stopName" />
                        <Button label="Aggiungi" icon="pi pi-plus" variant="text" @click="createStop" />
                    </div>
                </l-popup>
            </l-marker>
            <l-polyline :latLngs="routeSteps()" color="blue">
            </l-polyline>
        </l-map>
    </div>
</template>
<style>
.leaflet-popup-content {
    width: 350px!;
}
</style>
<script setup>
import { defineProps, ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LPolyline, LControl, LControlZoom } from "@vue-leaflet/vue-leaflet";
import { NominatimService } from '@/service/NominatimService';
import { useToast } from 'primevue/usetoast';

const props = defineProps(['directionIndex'])
const zoom = ref(13)
const center = ref([44.136352, 12.242244])
const popup = ref({visible: false})
const marker = ref({visible: false, latlng: null})
const busLine = defineModel()
const stopName = ref('')
const searchValue = ref({})
const searchSuggestions = ref([])
const toast = useToast();

async function createStop() {
    busLine.value.directions[props.directionIndex].stops.push({
        name: stopName.value,
        location: { type: 'Point', coordinates: [marker.value.latlng.lng, marker.value.latlng.lat] }
    })
    stopName.value = ''
    marker.value.visible = false
}

async function updateMarkerCoordinates(latLng) {
    marker.value.latlng = latLng;
}

async function handleMapClick(event){
    marker.value.latlng = event.latlng;
    popup.value.visible = true;
    marker.value.visible = true
}

const routeSteps = () => {
    console.log(busLine.value.directions[props.directionIndex].routeLegs)
    return busLine.value.directions[props.directionIndex].routeLegs.flatMap(leg => {
        return leg.steps.map(step => step.geometry.coordinates.map(coord => [coord[1], coord[0]]))
    });
}

const nominatimSearch = async (event) => {
    try {
        searchSuggestions.value = await NominatimService.search(event.query)
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
}

const autoCompleteValueSelected = (event) => {
    center.value = [searchValue.value.lat, searchValue.value.lon]
    marker.value = {
        visible: true,
        latlng: {lat: searchValue.value.lat, lng: searchValue.value.lon}
    }
}

</script>