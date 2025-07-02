<template>
    <div class="grid grid-cols-2 h-full grow">
        <LineEditMap @new-stop="stop => newStops.push(stop)" v-model="busLine" :direction-index="currentTab" class="col-span-2 xl:col-span-1 h-full mx-1 my-1"/>
        <Tabs class="col-span-2 xl:col-span-1 flex flex-col h-full mx-1 my-1" v-model:value="currentTab">
            <TabList>
                <Tab v-for="(direction, indexDir) in busLine.directions" :value="indexDir">{{ direction.name }}</Tab>
            </TabList>
            <TabPanels class="grow h-full">
                <TabPanel v-for="(direction, indexDir) in busLine.directions" :value="indexDir" class="h-full">
                    <div class="flex flex-row justify-between w-auto h-full">
                        <div class="w-full max-h-full" style="overflow: auto;">
                            <h2 class="text-lg">Fermate</h2>
                            <draggable class="mt-3" tag="ul" v-model="busLine.directions[currentTab].stops" item-key="id">
                                <template #item="{ index, element: stop }">
                                    <li class="flex flex-row justify-between items-center border-black border rounded-md px-3 mb-1 cursor-grab">
                                        <div>
                                            <font-awesome-icon :icon="faBars" />
                                            <Badge :value="index + 1" class="ms-2" />
                                        </div>
                                        <span>{{ stop.name }}</span>
                                        <Button icon="pi pi-trash" severity="danger" variant="text" rounded aria-label="Elimina" @click="removeStop(stop)" />
                                    </li>
                                </template>
                            </draggable>
                            <div class="flex flex-col">
                                <!-- <Button icon="pi pi-plus" class="mt-3" label="Aggiungi fermata esistente" severity="secondary" />-->
                                <StopSelector :newStops="newStops" @stop-selected="el => busLine.directions[currentTab].stops.push(el)" />
                                <Button class="mt-3" label="Genera percorso" @click="generateRoute">
                                    <template #icon>
                                        <font-awesome-icon :icon="faRoute" />
                                    </template>
                                </Button>
                            </div>
                        </div>
                        <Divider layout="vertical" />
                        <div class="w-full">
                            <h2 class="text-lg">Tempi di percorrenza</h2>
                            <Timeline :value="busLine.directions[currentTab].stops" layout="vertical" class="mt-2">
                                <template #content="slotProps">
                                    <div class="grid grid-rows-2 h-full">
                                        <span class="font-bold">{{ slotProps.item.name }}</span>
                                        <span
                                            v-if="busLine.directions[currentTab].routeLegs.length > slotProps.index"
                                            >
                                            {{ Math.floor(busLine.directions[currentTab].routeLegs[slotProps.index].duration / 60) }}m {{ Math.round(busLine.directions[currentTab].routeLegs[slotProps.index].duration % 60) }}s
                                        </span>
                                    </div>
                                </template>
                            </Timeline>
                        </div>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { BusStopService } from '@/service/BusStopService';
import { RoutingService } from '@/service/RoutingService';
import { RoutingDataElaborator } from '@/utils/RoutingDataElaborator';
import LineEditMap from '@/views/line/components/LineEditMap.vue'
import { faBars, faRoute } from '@fortawesome/free-solid-svg-icons'
import { useToast } from 'primevue/usetoast';
import StopSelector from './StopSelector.vue';

const toast = useToast();

const newStops = ref([])
const busLine = defineModel()
const currentTab = ref(0)

const removeStop = (stop) => {
    const index = busLine.value.directions[currentTab.value].stops.indexOf(stop);
    busLine.value.directions[currentTab.value].stops.splice(index, 1);
}

const generateRoute = async () => {
    const direction = busLine.value.directions[currentTab.value];
    try {
        busLine.value.directions[currentTab.value].routeLegs = await RoutingService.calculateRoute(direction.stops.map(stop => stop.location))
    } catch {
        toast.add({severity: 'error', summary: 'C\'è stato un errore durante il calcolo del percorso', life: 3000 })
        return;
    }
}

</script>
