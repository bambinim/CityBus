<template>
    <div class="h-full relative">
        <l-map ref="map" v-model:zoom="zoom" :center="[44.136352, 12.242244]" :useGlobalLeaflet="false" @click="handleMapClick" :options="{zoomControl: false}">
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
            <template v-if="props.pathFiltered">
                <l-marker v-for="(mark, index) in markStops(props.pathFiltered)"
                    :lat-lng="[mark.coordinates[1], mark.coordinates[0]]">
                    <l-icon :iconSize="[0, 0]" :iconAnchor="[10, 10]">
                        <div v-if="index == 0">
                            <font-awesome-icon :icon="faPerson" style="width: 20px; height: 20px; color: orange;"/>
                        </div>
                        <div v-else-if="index == (props.pathFiltered.legs.length)">
                            <font-awesome-icon :icon="faLocationDot"  style="width: 20px; height: 20px; color: red;"/>
                        </div>
                        <div v-else class="rounded-full flex flex-col justify-center items-center"  style="width: 20px; height: 20px; background-color: blue;">
                        </div>
                    </l-icon>
                </l-marker>
                <l-polyline v-for="(leg, index) in props.pathToFollow.legs" :latLngs="routeSteps(leg)" :dash-array="leg.type == 'foot' ? '5, 10' : ''" color="blue">
                </l-polyline>
            </template>
        </l-map>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LPolyline, LControl, LControlZoom } from "@vue-leaflet/vue-leaflet";
import { faPerson, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { Steps } from 'primevue';
import LineEditMap from '../line/components/LineEditMap.vue';

const zoom = ref(13);
const departure = ref({ visible: false, latlng: null });
const arrival = ref({ visible: false, latlng: null });
const marker = ref({ visible: false, latlng: null })
const popup = ref({visible: false})
const options = ref(['Partenza', 'Arrivo']);
const markerSelected = ref('');
const props = defineProps(['pathToFollow', 'pathFiltered'])

const emit = defineEmits(['update:departure', 'update:arrival']);

watch( () => props.pathToFollow, (oldPath, newPath)=> {
   reset()
})

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

const markStops = (path) => {
    const mark = []
    path.legs.map((leg, index) => {
        if (leg.type == 'foot'){
            index == 0 ? mark.push({ coordinates: leg.steps.coordinates[0] }) : mark.push({coordinates: leg.steps.coordinates[leg.steps.coordinates.length - 1]})
        }else{
            index == path.legs.length - 2 ? leg.stops.flatMap(stop => 
                mark.push({
                    line: leg.line.name,
                    coordinates: stop.location.coordinates
                })
            ) : 
                mark.push({
                    line: leg.line.name,
                    coordinates: leg.stops[0].location.coordinates
                })
        }
    })
    return mark
}

const routeSteps = (leg) => {
    if(leg.type == 'foot'){
        return leg.steps.coordinates.map(coord => [coord[1], coord[0]])
    }else{
        return leg.stops.flatMap(stop => stop.routeToNext.coordinates.map(coord => [coord[1], coord[0]]))
    }
}

const reset = () => {
    departure.value = { visible: false, latlng: null }
    arrival.value = { visible: false, latlng: null }
}


</script>