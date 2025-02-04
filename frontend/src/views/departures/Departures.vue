<template>
    <Toast />
    <AppMenu />
    <div class="grow h-full w-full p-4">
        <div v-if="!isSingleRunView">
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
                            Ritardo: {{ departure.delay }}
                        </p>
                        <p class="text-lg font-bold col-span-1 justify-end">
                            in {{ Math.floor((departure.scheduledArrivalTimestamp - Date.now())/60000) }} min
                        </p>
                    </div>
                </template>
            </Card>
        </div>
        <div v-if="isSingleRunView" class="grid grid-cols-2 grid-rows-2 h-full flex flex-row">
            <RideMap class="col-span-2 2xl:col-span-1"/>
            <div class="col-span-2 2xl:col-span-1 flex flex-col text-lg mt-4">
                <div class="w-full grid grid-cols-6 ">
                    <div class="rounded-lg text-white bg-blue-500 mr-2 col-span-1 col-start-3 text-center">
                        {{ ride.line.name }}
                    </div>
                    <p class="col-span-3 justify-start">
                        {{ ride.line.direction.name }}
                    </p>
                </div>
                <div class="mt-4 left-0">
                    <Timeline :value="ride.stops" align="alternate">
                        <template #marker="slotProps">
                            <font-awesome-icon :icon="faCircle" :class="slotProps.item.isBusPassed ? 'fa-sm' : 'fa-lg'" :style="{ color: slotProps.item.isBusPassed ? 'red' : 'green' }"/>
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
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue';
import { BusRideService } from '@/service/BusRideService';


const selectedStop = ref(undefined)
const stopOptions = ref([])
const dataPicker = ref()
const isSingleRunView = ref(false)

const departures = ref([])
const ride = ref()


const toast = useToast();

const loadOptions = async (event) => {
    try {
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

function getTimeFromTimestamp(timeInput){
    const date = new Date(timeInput)
    const hour = date.getHours() < 10 ? '0'+date.getHours() : date.getHours()
    const minute = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()
    return hour+":"+minute
}

function getTimeStampFromTime(timeInput) {
    const [hours, minutes] = timeInput.split(':').map(Number);

    const now = new Date();

    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now.getTime();
}


const stopSelected = async () => {
    if(!dataPicker.value){
        toast.add({severity: 'warn', summary: 'Inserisci un orario di partenza', life: 3000 });
        return
    }
    const departureTime = getTimeStampFromTime(dataPicker.value)
    departures.value = await BusStopService.getDepartures({ stopId: selectedStop.value.stopId, departureTimeStamp: departureTime})
    departures.value.sort((dep1, dep2) => dep1.scheduledArrivalTimestamp - dep2.scheduledArrivalTimestamp)
}

const selectDeparture = async (index) => {
    ride.value = await BusRideService.getBusRide(departures.value[index].rideId)
    //await BusRideService.startBusRidSimulation(ride.value._id)
    isSingleRunView.value = true 
}

</script>