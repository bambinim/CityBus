<script setup>
import { ref, onMounted, computed } from 'vue';
import { LMap, LTileLayer, LControlZoom, LMarker, LIcon } from "@vue-leaflet/vue-leaflet";
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { BusRideService } from '@/service/BusRideService';
import { WebSocket } from '@/lib/websocket'

const selectButtonValue = ref({ name: 'Tutte', value: 0 })
const selectButtonOptions = ref([
    { name: 'Tutte', value: 0 },
    { name: 'Solo Ritardi', value: 1 }
])

const mapCenter = ref([44.136352, 12.242244])
const mapZoom = ref(13)
const rides = ref([])
const realTimeData = ref({})
const socket = new WebSocket('/rides')

const convertRidesToLines = () => {
    const lines = {}
    rides.value.forEach(ride => {
        if (!lines[ride.line.id]) {
            lines[ride.line.id] = {
                name: ride.line.name,
                directions: {}
            }
        }
        if (!lines[ride.line.id].directions[ride.line.direction.id]) {
            lines[ride.line.id].directions[ride.line.direction.id] = {
                name: ride.line.direction.name,
                rides: {}
            }
        }
        lines[ride.line.id].directions[ride.line.direction.id].rides[ride.id] = {}
    })
    return lines
}

const updateRealTimeData = (ridesData) => {
    ridesData.forEach(ride => {
        realTimeData.value[ride.rideId] = ride
    });
}

const linesNodes = computed(() => Object.entries(convertRidesToLines()).map(([lineId, line]) => {
    return {
        key: lineId,
        label: line.name,
        children: Object.entries(line.directions).map(([dirId, dir]) => {
            return {
                key: dirId,
                label: dir.name,
                children: Object.entries(dir.rides).map(([rideId, ride]) => ({key: rideId, label: rideId}))
            }
        })
    }
}))

const ridesPositions = computed(() => rides.value.map(ride => {
    if (!realTimeData.value[ride.id]) {
        return;
    }
    return {
        id: ride.id,
        line: ride.line.name,
        position: realTimeData.value[ride.id].position
    };
}).filter(ride => ride));

const retrieveRidesList = async () => {
    try {
        rides.value = await BusRideService.getBusRidesList()
        socket.emit('subscribe', rides.value.map(ride => ride.id))
    } catch {
        rides.value = []
    }
}

onMounted(async () => {
    await retrieveRidesList()
    socket.emit('get-rides', rides.value.map(ride => ride.id), (ridesData) => {
        updateRealTimeData(ridesData)
    })
    socket.on('update', data => updateRealTimeData([data]))
    setInterval(retrieveRidesList, 5000)
})

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
            <l-marker v-for="ride in ridesPositions"
                :lat-lng="{lng: ride.position[0], lat: ride.position[1]}">
                <l-icon :iconSize="[0, 0]" :iconAnchor="[10, 10]">
                    <div class="rounded-full flex flex-col justify-center items-center"  style="width: 20px; height: 20px; background-color: blue;">
                        <span style="color: white;">{{ ride.line }}</span>
                    </div>
                </l-icon>
            </l-marker>
            </l-map>
        </div>
        <div class="col-span-6 md:col-span-3 flex flex-col items-center">
            <h2 class="text-xl mt-3">Corse Attive</h2>
            <SelectButton v-model="selectButtonValue" :options="selectButtonOptions" optionLabel="name" class="mt-2" />
            <div class="text-right w-full">
                <Button label="Nascondi tutti" severity="info" variant="text" />
            </div>
            <Tree class="w-full" :value="linesNodes">
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