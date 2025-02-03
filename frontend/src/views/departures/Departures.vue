<template>
    <Toast />
    <AppMenu />
    <ScrollPanel class="p-4">
        <AutoComplete
            v-model="selectedStop"
            :suggestions="stopOptions"
            @complete="loadOptions"
            @option-select="stopSelected()"
            optionLabel="name"
            placeholder="Da dove vuoi partire" />

        <div class="mt-4 grid grid-cols-3">
            <h2 for="departure-time" class="col-span-1 text-lg">Quando: </h2>
            <InputText
                id="departure-time"
                type="time"
                v-model="dataPicker"
                class="col-span-2 rounded-lg"
            />
        </div>

        <Card v-for="(departure, index) in departures" class="w-full rounded-lg mt-4" :key="index">
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
                        <font-awesome-icon :icon="faBus" /> {{new Date(departure.direction.scheduledArrivalTimestamp).toTimeString().slice(3, 9)}}
                    </p>
                    <p class="text-sm col-span-2 text-{{ departure.direction.delay > 0 ? 'orange' : 'green' }}">
                        Ritardo: {{ departure.direction.delay }}
                    </p>
                </div>
            </template>
        </Card>
    </ScrollPanel>
</template>


<script setup>
import { useToast } from 'primevue';
import { BusStopService } from '@/service/BusStopService';
import { faBus } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue';


const selectedStop = ref(undefined)
const stopOptions = ref([])
const dataPicker = ref()

const departures = ref([])


const toast = useToast();

const loadOptions = async (event) => {
    try {
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

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
    const departureTime = getTimeStampFromTime(dataPicker.value)
    departures.value = await BusStopService.getDepartures({ stopId: selectedStop.value.stopId, departureTimeStamp: departureTime})
    console.log(departures.value)
}


</script>