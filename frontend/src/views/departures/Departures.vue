<template>
    <Toast />
    <AppMenu />
    <div class="grow h-full w-full p-4 grid grid-cols-4">
        <div v-if="!simulator.isReady || (simulator.isReady && !isMobile)" class="md:col-span-2 col-span-4">
            <AutoComplete
                v-model="selectedStop"
                :suggestions="stopOptions"
                @complete="loadOptions"
                @option-select="stopSelected()"
                optionLabel="name"
                placeholder="Da dove vuoi partire" />

            <div class="mt-4 grid grid-cols-3 sm:w-1/2">
                <h2 for="departure-time" class="col-span-1 text-lg">Quando: </h2>
                <InputText
                    id="departure-time"
                    type="time"
                    v-model="dataPicker"
                    class="col-span-2 rounded-lg"
                />
            </div>

            <Card v-for="(departure, index) in departures" class="w-full sm:w-1/2 rounded-lg mt-4" :key="index" @click="selectDeparture(index)">
                <template #title>
                    <div  class="grid grid-cols-4">
                        <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 text-center">
                            {{ departure.name }}
                        </div>
                        <p class="col-span-3">
                            {{ departure.direction.name }}
                        </p>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-4">
                        <p class="text-sm col-span-1">
                            <font-awesome-icon :icon="faBus" /> {{ getTimeFromTimestamp(departure.scheduledArrivalTimestamp) }}
                        </p>
                        <p class="text-sm col-span-2" :class="departure.delay > 0 ? 'text-orange-500' : 'text-green-500'">
                            {{ departure.delay > 0 ? "Ritardo: ".concat(departure.delay.toString(), " minuti") : "In orario" }}
                        </p>
                        <p class="text-lg font-bold col-span-1 justify-end">
                            in {{ Math.floor((departure.scheduledArrivalTimestamp - Date.now())/60000) }} min
                        </p>
                    </div>
                </template>
            </Card>
        </div>
        <div v-if="simulator.isReady" class="md:col-span-2 col-span-4 grid grid-cols-2 grid-rows-2 h-full flex flex-row">
            <div class="relative col-span-2 2xl:col-span-1">
                <RideMap class="z-0"/>
                <Button v-if="simulator.isReady && isMobile" rounded aria-label="Filter" class="absolute bottom-14 left-4 z-10" size="large" @click="handleBackButton">
                    <font-awesome-icon :icon="faArrowLeft" />
                </Button>
            </div>
            <div class="col-span-2 2xl:col-span-1 flex flex-col text-lg mt-4">
                <div class="w-full grid grid-cols-6 ">
                    <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 col-start-3 text-center">
                        {{ ride.rideInfo.line.name }}
                    </div>
                    <p class="col-span-3 justify-start">
                        {{ ride.rideInfo.line.direction.name }}
                    </p>
                </div>
                <div class="mt-4 left-0">
                    <Timeline :value="ride.rideInfo.stops" align="alternate">
                        <template #marker="slotProps">
                            <font-awesome-icon :icon="faCircle" :class="ride.stopPassed.indexOf(slotProps.item.stopId) === -1 ? 'fa-lg' : 'fa-sm'" :style="{ color: ride.stopPassed.indexOf(slotProps.item.stopId) === -1 ? 'green' : 'red' }"/>
                        </template>
                        <template #content="slotProps">
                            <span class="font-bold">{{ slotProps.item.name }}</span>
                        </template>
                        <template #opposite="slotProps">
                            <span>{{ getTimeFromTimestamp(slotProps.item.expectedArrivalTimestamp) }}</span>
                        </template>
                    </Timeline>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import RideMap from './RideMap.vue';
import { useToast } from 'primevue';
import { BusStopService } from '@/service/BusStopService';
import { faCircle, faBus, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue';
import { useDevice } from '@/utils/useDevice';
import { getTimeFromTimestamp, getTimeStampFromTime } from '@/utils/DateUtils';
import { BusSimulator } from '@/utils/BusSimulator';
import { useBusRideStore } from '@/stores/ride';
import { computed } from 'vue';

const busRideStore = useBusRideStore();
const selectedStop = ref(undefined)
const stopOptions = ref([])
const dataPicker = ref()
const { isMobile } = useDevice();
const departures = ref([])
const ride = computed(() => busRideStore)

const simulator = ref(new BusSimulator())


const toast = useToast();

const loadOptions = async (event) => {
    try {
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

const stopSelected = async () => {
    if(!dataPicker.value){
        toast.add({severity: 'warn', summary: 'Inserisci un orario di partenza', life: 3000 });
        return
    }

    const departureTimestamp = getTimeStampFromTime(dataPicker.value)

    departures.value = await simulator.value.init({stopId: selectedStop.value.stopId, departureTimestamp: departureTimestamp})
    departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)

    setInterval(async () => {
        departures.value = await simulator.value.init({stopId: selectedStop.value.stopId, departureTimestamp: departureTimestamp})
        departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)
    }, 10000)
}

const selectDeparture = async (index) => {
    await simulator.value.followBusRide(departures.value[index].rideId, (errorMessage) => {
        toast.add({severity: 'error', summary: errorMessage, life: 3000 });
        return
    })
}

const handleBackButton = () => {
    simulator.value.reset()
}

</script>