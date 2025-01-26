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
                                    <AutoComplete v-model="stop.name"  optionLabel="name" :invalid="!stop.name" :suggestions="filteredStops" @complete="searchStops" placeholder="Nome fermata" type="text" size="small"/>
                                    <Button icon="pi pi-minus" class="p-button-danger" @click="removeStop(indexDir, indexStop)" size="small"/>
                                </li>
                            </div>
                            <Button label="Aggiungi fermata" severity="secondary" class="flex flex-col w-full m-2" size="small"  @click="addStop(indexDir)"/>

                            <Button label="Genera percorso" severity="contrast" class="flex flex-col w-full m-2" size="small"  @click="generateRoutes(indexDir)"/>
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
</template>

<script setup>
import { ref } from 'vue'
import { defineProps } from 'vue';
import { BusStopService } from '@/service/BusStopService';
import { RoutingService } from '@/service/RoutingService';

const props = defineProps({
  directions: Array
});

const filteredStops = ref([]);

const searchStops = async (event) => {
  try {
    const query = {
        search: event.query
    }
    const stops = await BusStopService.searchBusStops(query);
    filteredStops.value = stops.map(stop => ({ name: stop.name, stopId: stop.stopId, location: stop.location }));
  } catch (error) {
    console.error('Error fetching stops:', error);
  }
};

const addStop = (directionIndex) => {
    props.directions[directionIndex].stops.push({ name: ''});
}

const removeStop = (indexDir, indexStop) => {
    props.directions[indexDir].stops.splice(indexStop, 1)
}

const generateRoutes = async (indexDir) => {
    const coordinates = props.directions[indexDir].stops.map(stop => ({location: stop.name.location.coordinates}))
    const routeLegs = await RoutingService.calculateRoute(coordinates)
    props.directions[indexDir].routeLegs = routeLegs
    console.log(props.directions[indexDir])
}

</script>