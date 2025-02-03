<script setup>
import { ref } from 'vue';
import { LMap, LTileLayer, LControlZoom } from "@vue-leaflet/vue-leaflet";
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const selectButtonValue = ref({ name: 'Tutte', value: 0 })
const selectButtonOptions = ref([
    { name: 'Tutte', value: 0 },
    { name: 'Solo Ritardi', value: 1 }
])

const mapCenter = ref([44.136352, 12.242244])
const mapZoom = ref(13)
const linesData = ref()

</script>
<template>
    <AppMenu />
    <div class="grid grid-cols-12 absolute bottom-0 w-full" style="top: 50px">
        <div class="col-span-6 md:col-span-9">
            <l-map ref="map" v-model:zoom="mapZoom" :center="mapCenter" :useGlobalLeaflet="false" :options="{zoomControl: false}">
                <l-control-zoom position="bottomright"></l-control-zoom>
                <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
            ></l-tile-layer>
            </l-map>
        </div>
        <div class="col-span-6 md:col-span-3 flex flex-col items-center">
            <h2 class="text-xl mt-3">Corse Attive</h2>
            <SelectButton v-model="selectButtonValue" :options="selectButtonOptions" optionLabel="name" class="mt-2" />
            <div class="text-right w-full">
                <Button label="Nascondi tutti" severity="info" variant="text" />
            </div>
            <Tree class="w-full" :value="linesData">
                <template #icon="scope">
                    <font-awesome-icon v-if="scope.node.icon" :icon="scope.node.icon" />
                </template>
                <template #checkboxicon="scope">
                    <font-awesome-icon :icon="scope.checked ? faEye : faEyeSlash" />
                </template>
            </Tree>
        </div>
    </div>
</template>