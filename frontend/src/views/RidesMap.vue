<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { LMap, LTileLayer, LControlZoom, LMarker, LIcon, LCircleMarker } from "@vue-leaflet/vue-leaflet";
import { faEye, faEyeSlash, faArrowRightArrowLeft, faBus, faRoute, faClock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { BusRideService } from '@/service/BusRideService';
import { WebSocket } from '@/lib/websocket'

const selectButtonValue = ref({ name: 'Tutte', value: 0 })
const selectButtonOptions = ref([
    { name: 'Tutte', value: 0 },
    { name: 'Solo Ritardi', value: 1 }
])

const rideToFollow = ref(null)
const cardInfo = ref({})
const mapCenter = ref([44.136352, 12.242244])
const mapZoom = ref(13)
const rides = ref([])
const realTimeData = ref({})
const hiddenKeys = ref(new Set())
const expandedKeys = ref({})
const socket = new WebSocket('/rides')



const convertRidesToLines = () => {
    const lines = {}
    rides.value.filter(ride => {
        if (selectButtonValue.value.value == 0) {
            return true
        }
        return realTimeData.value[ride.id] && realTimeData.value[ride.id].minutesLate > 0;
    }).forEach(ride => {
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
        lines[ride.line.id].directions[ride.line.direction.id].rides[ride.id] = {
            scheduledDepartureTimestamp: ride.scheduledDepartureTimestamp,
            minutesLate: realTimeData.value[ride.id] ? realTimeData.value[ride.id].minutesLate : undefined
        }
    })
    return lines
}

const updateRealTimeData = (ridesData) => {
    ridesData.forEach(ride => {
        realTimeData.value[ride.rideId] = ride;
    });
    if (rideToFollow.value) {
        rideToFollow.value.minutesLate = realTimeData.value[rideToFollow.value.key].minutesLate
    }
}

const linesNodes = computed(() => Object.entries(convertRidesToLines()).map(([lineId, line]) => {
    return {
        key: lineId,
        label: line.name,
        icon: faRoute,
        children: Object.entries(line.directions).map(([dirId, dir]) => {
            return {
                key: dirId,
                label: dir.name,
                icon: faArrowRightArrowLeft,
                children: Object.entries(dir.rides).map(([rideId, ride]) => {
                    const time = new Date(ride.scheduledDepartureTimestamp)
                    return {
                        key: rideId,
                        label: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
                        minutesLate: ride.minutesLate,
                        icon: faBus
                    };
                })
            }
        })
    };
}))

const ridesPositions = computed(() => rides.value.map(ride => {
    if (!realTimeData.value[ride.id] || hiddenKeys.value.has(ride.id)) {
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
        rides.value = await BusRideService.getBusRidesList();
        socket.emit('subscribe', rides.value.map(ride => ride.id));
    } catch {
        rides.value = [];
    }
}

onMounted(async () => {
    await retrieveRidesList()
    socket.emit('get-rides', rides.value.map(ride => ride.id), (ridesData) => {
        updateRealTimeData(ridesData);
    })
    socket.on('update', data => updateRealTimeData([data]));
    setInterval(retrieveRidesList, 5000);
})

const hide = (node) => {
    hiddenKeys.value.add(node.key);
    if (!node.children) {
        return;
    }
    node.children.forEach(ch => hide(ch));
}

const show = (node) => {
    hiddenKeys.value.delete(node.key)
    if (!node.children) {
        return;
    }
    node.children.forEach(ch => show(ch));
}

const hideAll = () => {
    linesNodes.value.forEach(hide);
}

const expand = (node) => {
    if (!node.children) {
        return;
    }
    expandedKeys.value[node.key] = true;
    node.children.forEach(expand);
}


watch(ridesPositions, (newRidesPosition) => {
    if (rideToFollow.value == null) {
        return;
    }
    const rides = newRidesPosition.find(ride => ride.id.toString() === rideToFollow.value.key)
    mapCenter.value = [rides.position[1], 
                        rides.position[0]];
    linesNodes.value.filter(line => {
        return line.children.map(dir => {
            return dir.children.map(ride => {
                if(ride.key == rideToFollow.value.key){
                    cardInfo.value = {
                        line: line.label,
                        direction: dir.label,
                        departureTime: rideToFollow.value.label,
                        delay: rideToFollow.value.minutesLate
                    }
                }
            })
        })
    })
});

const setRideToFollow = (rideId) => {
    const time = new Date(rides.value.filter(r => r.id == rideId)[0].scheduledDepartureTimestamp)
    rideToFollow.value = {
        key: rideId,
        minutesLate: realTimeData.value[rideId].minutesLate,
        label: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
    }
}

</script>
<template>
    <AppMenu />
    <div class="grid grid-cols-12 absolute bottom-0 w-full" style="top: 50px">
        <div class="col-span-6 md:col-span-9">
            <l-map ref="map" v-model:zoom="mapZoom" :center="mapCenter" :useGlobalLeaflet="false" :options="{zoomControl: false}" :zoomAnimation="true" :markerZoomAnimation="true">
                <l-control-zoom position="bottomright"></l-control-zoom>
                <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
                ></l-tile-layer>
                <!--<l-marker v-for="(ride, _) in ridesPositions"
                    :lat-lng="{lng: ride.position[0], lat: ride.position[1]}"
                    @click="_ => setRideToFollow(ride.id)">
                    <l-icon :iconSize="[0, 0]" :iconAnchor="[8, 8]">
                        <div v-if="rideToFollow && rideToFollow.key == ride.id" class="rounded-full" style="padding: 8px 8px; background-color: red;"></div>
                        <div v-else class="rounded-full" style="padding: 8px 8px; background-color: blue;"></div>
                    </l-icon>
                </l-marker>-->
                <l-circle-marker v-for="(ride, _) in ridesPositions"
                    :lat-lng="{lng: ride.position[0], lat: ride.position[1]}"
                    :radius="8"
                    :color="rideToFollow && rideToFollow.key == ride.id ? 'red' : 'blue'"
                    @click="_ => setRideToFollow(ride.id)">
                </l-circle-marker>
                <div v-if="rideToFollow" class="absolute top-2 right-2 z-[1000]">
                    <Card>
                        <template #title>
                            <div class="flex justify-between items-center cursor-pointer">
                                <span class="text-lg text-gray-800">{{ cardInfo.line }}</span>
                                <font-awesome-icon :icon="faArrowRight" class="text-lg text-gray-800 mx-2" />
                                <span class="text-lg font-semibold text-gray-800">{{ cardInfo.direction }}</span>
                            </div>
                        </template>
                        <template #content>
                            <div>
                                <div class="mt-1 text-gray-500 text-sm">
                                    Orario di partenza: <span class="font-semibold text-gray-700">{{cardInfo.departureTime}}</span>
                                </div>
                                <div class="mt-1 text-gray-500 text-sm">
                                    Ritardo: <span class="font-semibold" :class="cardInfo.delay > 0 ? 'text-red-500' : 'text-green-500'">{{cardInfo.delay}}</span>
                                </div>
                            </div>
                            <Button 
                                class="mt-2 w-full"
                                icon="pi pi-times"
                                label="Interrompi monitoraggio"
                                variant="text"
                                severity="danger"
                                @click="rideToFollow = null; cardInfo = {}"
                            />
                        </template>
                    </Card>
                </div>
            </l-map>
        </div>
        <div class="col-span-6 md:col-span-3 flex flex-col items-center">
            <h2 class="text-xl mt-3">
                Corse Attive
                <i class="pi pi-question-circle text-gray-400" v-tooltip.bottom="'Qui puoi monitorare in tempo reale le corse dei bus. Clicca sull’icona del bus per seguire la corsa sulla mappa.'"></i>
            </h2>
            <SelectButton v-model="selectButtonValue" :options="selectButtonOptions" optionLabel="name" class="mt-2" />
            <div class="text-right w-full mt-2 flex flex-row content-center justify-between">
                <div>
                    <Button v-if="Object.keys(expandedKeys).length == 0" label="Espandi tutti" severity="info" variant="text" @click="_ => linesNodes.forEach(expand)" />
                    <Button v-else label="Collassa tutti" severity="info" variant="text" @click="_ => expandedKeys = {}" />
                </div>
                <div>
                    <Button v-if="hiddenKeys.size == 0" label="Nascondi tutti" severity="info" variant="text" @click="_ => hideAll()"/>
                    <Button v-else label="Mostra tutti" severity="info" variant="text" @click="_ => hiddenKeys.clear()" />
                </div>
            </div>
            <Tree class="w-full" :value="linesNodes"
                v-model:expanded-keys="expandedKeys">
                <template #nodeicon="scope">
                    <Button v-if="!scope.node.children" rounded variant="text" aria-label="Monitora corsa" @click="_ => rideToFollow = scope.node">
                        <template #icon>
                            <font-awesome-icon :icon="scope.node.icon" />
                        </template>
                    </Button>
                    <font-awesome-icon v-else :icon="scope.node.icon" />
                </template>
                <template #default="scope">
                    <div class="flex flex-row items-center justify-between w-full">
                        <div>
                            <span v-if="scope.node.children">{{ scope.node.label }}</span>
                            <span v-else>{{ scope.node.label }}</span>
                        </div>
                        <div v-if="!scope.node.children && scope.node.minutesLate != undefined">
                            <font-awesome-icon v-tooltip="'In orario'" class="text-green-600" v-if="scope.node.minutesLate == 0" :icon="faClock" />
                            <span v-else class="font-bold text-red-600">+{{ scope.node.minutesLate }}</span>
                        </div>
                        <Button v-if="hiddenKeys.has(scope.node.key)" severity="contrast" variant="text" rounded aria-label="Mostra" @click="_ => show(scope.node)">
                            <font-awesome-icon :icon="faEyeSlash" />
                        </Button>
                        <Button v-else severity="contrast" variant="text" rounded aria-label="Nascondi" @click="_ => hide(scope.node)">
                            <font-awesome-icon :icon="faEye" />
                        </Button>
                    </div>
                </template>
            </Tree>
        </div>
    </div>
</template>
<style>
.p-tree-node-label {
    width: 100% !important;
}
</style>

