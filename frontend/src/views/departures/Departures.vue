<template>
    <Toast />
    <AppMenu />
    <div class="grow h-full w-full p-4 grid grid-cols-4">
        <div v-if="!simulatorView || (simulatorView && !isMobile)" class="md:col-span-2 col-span-4">
            <div class="flex flex-wrap justify-start items-end gap-4">
                <AutoComplete
                    v-model="selectedStop"
                    :suggestions="stopOptions"
                    @complete="loadOptions"
                    optionLabel="name"
                    placeholder="Da dove vuoi partire" />


                <InputText
                    id="departure-time"
                    type="time"
                    v-model="dataPicker"
                    />
                <Button label="Search" icon="pi pi-search" @click="viewDepartures()" />
            </div>
            <Card v-for="(departure, index) in departures" class="w-full sm:w-3/4 rounded-lg mt-4" :key="index" @click="selectDeparture(index)">
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
                            <font-awesome-icon :icon="faBus" /> {{ getTimeFromTimestamp(departure.scheduledArrivalTimestamp, departure.delay)}}
                        </p>
                        <p class="text-sm col-span-2" :class="departure.delay > 0 ? 'text-orange-500' : 'text-green-500'">
                            {{ departure.delay > 0 ? "Ritardo: ".concat(departure.delay.toString(), " minuti") : "In orario" }}
                        </p>
                        <p class="text-lg font-bold col-span-1 justify-end">
                            in {{ Math.floor((departure.scheduledArrivalTimestamp - Date.now())/60000 + ( departure.delay > 0 ? departure.delay : 0)) }} min
                        </p>
                    </div>
                </template>
            </Card>
        </div>
        <div v-if="simulatorView" class="md:col-span-2 col-span-4 grid grid-cols-2 grid-rows-2 h-full flex flex-row">
            <div class="relative col-span-2">
                <RideMap class="z-0"/>
                <Button v-if="simulatorView && isMobile" rounded aria-label="Filter" class="absolute bottom-14 left-4 z-10" size="large" @click="handleBackButton">
                    <font-awesome-icon :icon="faArrowLeft" />
                </Button>
            </div>
            <div class="col-span-2 flex flex-col text-lg mt-4">
                <div class="w-full grid grid-cols-4 ">
                    <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 text-center">
                        {{ ride.rideInfo.line.name }}
                    </div>
                    <p class="col-span-1">
                        {{ ride.rideInfo.line.direction.name }}
                    </p>
                    <span class="col-span-2" :class="ride.minutesLate > 0 ? 'text-orange-500' : 'text-green-500'">{{ ride.minutesLate > 0 ? 'Ritardo: ' + ride.minutesLate + ' minuti' : 'In orario' }}</span>
                </div>
                <div class="p-4 flex gap-x-8">
                    <span class="flex-none">{{ lastStop?.name }}</span>
                    <ProgressBar 
                        :showValue="false"
                        :value="100 * (1 - (ride.timeToNextStop / getTimeDifference(
                                                            nextStop?.expectedArrivalTimestamp,
                                                            lastStop?.expectedArrivalTimestamp)))" 
                        class="grow mt-1"></ProgressBar>
                    <span class="flex-none">{{ nextStop?.name }}</span>
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
                            <span>{{ ride.stopPassed.indexOf(slotProps.item.stopId) === -1 ? 
                                                            getTimeFromTimestamp(slotProps.item.expectedArrivalTimestamp, ride.minutesLate) :
                                                            getTimeFromTimestamp(slotProps.item.expectedArrivalTimestamp) }}</span>
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
import { getTimeFromTimestamp, getTimeStampFromTime, getTimeDifference } from '@/utils/DateUtils';
import { BusSimulator } from '@/simulator/BusSimulator';
import { useBusRideStore } from '@/stores/ride';
import { computed } from 'vue';

const busRideStore = useBusRideStore();
const selectedStop = ref(undefined)
const stopOptions = ref([])
const dataPicker = ref()
const { isMobile } = useDevice();
const departures = ref([])
const ride = computed(() => busRideStore)
const lastStopSelected = ref()
const simulatorView = ref(false)
const simulator = ref(new BusSimulator())


const toast = useToast();
let interval

const lastStop = computed(() => {
    if (ride.value.stopPassed.length === 0) return undefined;
    return ride.value.rideInfo.stops.filter(stop => stop.stopId == ride.value.stopPassed[ride.value.stopPassed.length - 1])[0]
});

const nextStop = computed(() => {
    if (ride.value.nextStop === undefined) return undefined;
    return ride.value.rideInfo.stops.filter(stop => stop.stopId == ride.value.nextStop)[0]
});

const loadOptions = async (event) => {
    try {
        selectedStop.value = undefined
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

const viewDepartures = async () => {
    if(!dataPicker.value){
        toast.add({severity: 'warn', summary: 'Inserisci un orario di partenza', life: 3000 });
        return
    }

    if (!selectedStop.value) {
        toast.add({severity: 'warn', summary: 'Seleziona una fermata', life: 3000 });
        return
    }

    const departureTimestamp = getTimeStampFromTime(dataPicker.value)

    departures.value = await BusStopService.getDepartures({stopId: selectedStop.value.stopId, departureTimestamp: departureTimestamp})
    departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)

    lastStopSelected.value = selectedStop.value

    if (departures.value.length === 0) {
        toast.add({severity: 'info', summary: 'La fermata selezionata non ha corse attive', life: 3000 });
        return
    }

    clearInterval(interval)

    interval = setInterval(async () => {
        departures.value = await BusStopService.getDepartures({stopId: lastStopSelected.value.stopId, departureTimestamp: departureTimestamp})
        departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)
    }, 10000)
}

const selectDeparture = async (index) => {
    simulator.value.reset()
    await simulator.value.followBusRide(departures.value[index].rideId, (errorMessage) => {
        toast.add({severity: 'error', summary: errorMessage, life: 3000 });
        return
    })
    simulatorView.value = true
}

const handleBackButton = () => {
    simulator.value.reset()
    simulatorView.value = false
}

</script>