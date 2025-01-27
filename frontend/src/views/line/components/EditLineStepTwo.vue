<template>
    <TabView :scrollable="true">
        <TabPanel v-for="(direction, indexDir) in directions" :key="indexDir" :header="direction.name">
            <Splitter>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <div class="flex flex-col w-full">
                        <h2 class="mb-4">Fermate {{ direction.name }}</h2>
                        <ul class="list-group">
                            <div v-for="(stop, indexStop) in props.directions[indexDir].stops" :key="indexStop" class="w-full">
                                <li class="list-group-item flex flex-row m-2 w-full">
                                    <AutoComplete v-model="stop.name" optionLabel="name" :invalid="!stop" :suggestions="filteredStops" @complete="searchStops" placeholder="Nome fermata" type="text" size="small"/>
                                    <Button icon="pi pi-minus" class="p-button-danger" @click="removeStop(indexDir, indexStop)" size="small"/>
                                </li>
                            </div>
                            <Button label="Aggiungi fermata" severity="secondary" class="flex flex-col w-full m-2" size="small"  @click="addStop(indexDir)"/>
                        </ul>
                    </div>
                </SplitterPanel>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <h2 class="mb-4 ml-4">Tempi di percorrenza</h2>
                    <Timeline :value="events" layout="vertical" align="top" class="flex-grow items-center justify-center w-1/2">
                        <template #content="slotProps">
                            {{ slotProps.item.name }}
                        </template>
                        <template #opposite="slotProps">
                            <small class="text-surface-500 dark:text-surface-400">{{ slotProps.item.time }}</small>
                        </template>
                    </Timeline>
                </SplitterPanel>
            </Splitter>
        </TabPanel>
    </TabView>
    <Button label="Genera percorsi" severity="contrast" class="flex flex-col w-full m-2" size="small"  @click="generateRoutes()"/>
</template>

<script setup>
import { ref } from 'vue'
import { BusStopService } from '@/service/BusStopService';
import { RoutingService } from '@/service/RoutingService';
import { RoutingDataElaborator } from '@/utils/RoutingDataElaborator';

const props = defineProps({
  directions: Array
});

const emits = defineEmits(['generate-routes']);

const filteredStops = ref([]);

const searchStops = async (event) => {
  try {
    const query = {
        search: event.query
    }
    const stops = await BusStopService.searchBusStops(query);
    filteredStops.value = stops.map(stop => ({ stopId: stop.stopId, name: stop.name, location: stop.location, routeToNext: [], timeToNext: 0}));
  } catch (error) {
    console.error('Error fetching stops:', error);
  }
};

const addStop = (directionIndex) => {
    props.directions[directionIndex].stops.push({});
}

const removeStop = (indexDir, indexStop) => {
    props.directions[indexDir].stops.splice(indexStop, 1)
}

const generateRoutes = async () => {
    props.directions.forEach(async (direction) => {
        const coordinates = direction.stops.map(stop => ({location: stop.name.location.coordinates}))
        direction.stops = direction.stops.map(stop => ({
            stopId: stop.name.stopId,
            name: stop.name.name,
            routeToNext: stop.name.routeToNext,
            timeToNext: stop.name.timeToNext
        }))
        const routeData = await RoutingService.calculateRoute(coordinates)
        direction.fullRoute = RoutingDataElaborator.elaborateFullRoute(routeData)
        const routeSteps = RoutingDataElaborator.elaborateRouteStep(routeData)
        routeSteps.forEach((step, i) => {
            direction.stops[i].timeToNext = step.timeToNext
            direction.stops[i].routeToNext = step.routeToNext
        })
    })
    console.log(props.directions)
    emits('generate-routes')
}

</script>