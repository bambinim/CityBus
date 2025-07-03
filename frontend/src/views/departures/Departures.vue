<template>
    <Toast />
    <AppMenu />
    <div class="grow h-full gap-4 w-full grid grid-cols-5 pt-4 pr-4 pl-4">
        <div v-if="!simulatorView || (simulatorView && !isMobile)" class="md:col-span-2 col-span-5">
            <div class="flex flex-wrap justify-start items-end gap-4 grid grid-cols-2">
                <AutoComplete
                    class="w-full col-span-1 custom-autocomplete"
                    inputClass="w-full"
                    v-model="selectedStop"
                    :suggestions="stopOptions"
                    @complete="loadOptions"
                    optionLabel="name"
                    placeholder="Da dove vuoi partire" />

                <InputText
                    class="col-span-1"
                    id="departure-time"
                    type="time"
                    v-model="dataPicker"
                    />


                <AutoComplete
                    class="w-full col-span-2 custom-autocomplete"
                    inputClass="w-full"
                    v-model="selectedLine"
                    :suggestions="lineOptions"
                    @complete="loadLines"
                    optionLabel="name"
                    placeholder="Linea da ricercare(Opzionale)" />
                
                <Button class="flex-1 col-span-1" label="Cerca corse" icon="pi pi-search" @click="viewDepartures()" />
                <Button 
                    class="flex-1 col-span-1"
                    icon="pi pi-times"
                    label="Interrompi monitoraggio"
                    variant="text"
                    severity="danger"
                    @click="stopFollowingLine()"
                />
            </div>
            <Card v-for="(departure, index) in departures" class="w-full sm:col-span-2 rounded-lg mt-4" :key="index">
                <template #title>
                    <div  class="grid grid-cols-5">
                        <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 text-center">
                            <span>{{ departure.name }}</span>
                        </div>
                        <p class="col-span-3">
                            {{ departure.direction.name }}
                        </p>
                        <Button class="col-span-1 justify-end" rounded variant="text" aria-label="Monitora corsa" @click="selectDeparture(index)">
                            <template #icon>
                                <font-awesome-icon :icon="faMagnifyingGlass"/>
                            </template>
                        </Button>      
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-4">
                        <p class="text-md col-span-1">
                            <font-awesome-icon :icon="faBus" class="text-blue-500"/> {{ getTimeFromTimestamp(departure.scheduledArrivalTimestamp, departure.delay)}}
                        </p>
                        <p class="text-md col-span-2" :class="departure.delay > 0 ? 'text-orange-500' : 'text-green-500'">
                            {{ departure.delay > 0 ? "Ritardo: ".concat(departure.delay.toString(), " minuti") : "In orario" }}
                        </p>
                        <p class="text-lg font-bold col-span-1 justify-end">
                            
                            {{ Math.floor((departure.scheduledArrivalTimestamp - Date.now())/60000 + ( departure.delay > 0 ? departure.delay : 0)) < 0 ?  'Già passato' : 'in ' + Math.floor((departure.scheduledArrivalTimestamp - Date.now())/60000 + ( departure.delay > 0 ? departure.delay : 0)) + ' minuti'  }}
                        </p>
                    </div>
                </template>
            </Card>
        </div>
        <div v-if="simulatorView" class="md:col-span-3 col-span-5 grid grid-cols-2 grid-rows-2 h-full overflow-y-auto">
            <div class="relative col-span-2 row-span-1 h-full">
                <RideMap class="z-0"/>
                <Button v-if="simulatorView && isMobile" rounded aria-label="Interrompi Monitoraggio" class="absolute bottom-14 left-4 z-10" size="large" @click="stopFollowingLine">
                    <font-awesome-icon :icon="faArrowLeft" />
                </Button>
            </div>
            <div class="col-span-2 flex flex-col text-lg mt-4 row-span-1 h-full overflow-y-auto">
                <div class="w-full grid grid-cols-4 ">
                    <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 text-center">
                        {{ ride.rideInfo.line.name }}
                    </div>
                    <p class="col-span-1">
                        {{ ride.rideInfo.line.direction.name }}
                    </p>
                    <span class="col-span-2" :class="ride.minutesLate > 0 ? 'text-orange-500' : 'text-green-500'">{{ ride.minutesLate > 0 ? 'Ritardo: ' + ride.minutesLate + ' minuti' : 'In orario' }}</span>
                </div>
                <div class="p-4 gap-x-8 grid grid-cols-4">
                    <span class="col-span-1">{{ lastStop?.name }}</span>
                    <ProgressBar 
                        :showValue="false"
                        :value="100 * (1 - (ride.timeToNextStop / getTimeDifference(
                                                            nextStop?.expectedArrivalTimestamp,
                                                            lastStop?.expectedArrivalTimestamp)))" 
                        class="col-span-2 mt-1"></ProgressBar>
                    <span class="col-span-1">{{ nextStop?.name }}</span>
                </div>
                <div class="mt-4 left-0">
                    <Timeline :value="ride.rideInfo.stops" align="alternate" class="customized-timeline">
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
import { BusLineService } from '@/service/BusLineService';
import { BusRideService } from '@/service/BusRideService';
import { faCircle, faBus, faArrowLeft, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
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
const selectedLine = ref(undefined)
const lineOptions = ref([])


const toast = useToast();

const currentTime = computed(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
})

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
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

const loadLines = async (event) => {
    try {
        lineOptions.value = await BusLineService.getBusLines({search: event.query})
        console.log(lineOptions.value)
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
}

const viewDepartures = async () => {

    if(!dataPicker.value){
        toast.add({severity: 'warn', summary: 'Inserisci un orario di partenza', life: 3000 });
        return
    }

    if(getTimeStampFromTime(dataPicker.value) < getTimeStampFromTime(currentTime.value)){
        toast.add({severity: 'warn', summary: 'Orario non valido: non puoi scegliere un orario già passato.', life: 3000 });
        return
    }

    if (!selectedStop.value) {
        toast.add({severity: 'warn', summary: 'Seleziona una fermata', life: 3000 });
        return
    }

    const departureTimestamp = getTimeStampFromTime(dataPicker.value)
    console.log(selectedLine.value)
    if(selectedLine.value){
        departures.value = await BusStopService.getDepartures({stopId: selectedStop.value.stopId, departureTimestamp: departureTimestamp, lineId: selectedLine.value.id})
    }else{
        departures.value = await BusStopService.getDepartures({stopId: selectedStop.value.stopId, departureTimestamp: departureTimestamp})
    }

    
    departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)

    lastStopSelected.value = selectedStop.value

    if (departures.value.length === 0) {
        toast.add({severity: 'info', summary: 'La fermata selezionata non ha corse attive', life: 3000 });
        return
    }


}


const selectDeparture = async (index) => {
    simulator.value.reset()
    await simulator.value.followBusRide(departures.value[index].rideId, (errorMessage) => {
        toast.add({severity: 'error', summary: errorMessage, life: 3000 });
        return
    })
    simulatorView.value = true
}

const stopFollowingLine = () => {
    simulator.value.reset()
    simulatorView.value = false
}

</script>

<style scoped>

.custom-autocomplete .p-inputtext,
.custom-autocomplete,
.custom-autocomplete .p-autocomplete {
  width: 100%;
  box-sizing: border-box;
}

</style>
