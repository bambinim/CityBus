<template>
    <TabView :scrollable="true">
        <TabPanel v-for="(direction, indexDir) in directions" :key="indexDir" :header="direction.name">
            <Splitter>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <div class="flex flex-col w-full">
                        <h2 class="mb-4">Fermate {{ direction.name }}</h2>
                        <ul class="list-group">
                            <div v-for="(stop, indexStop) in directions[indexDir].stops" :key="indexStop" class="w-full">
                                <li class="list-group-item flex flex-row m-2 w-full">
                                    <AutoComplete v-model="stop.query" optionLabel="name" :invalid="!stop" :suggestions="stop.filteredStops" @complete="searchStops(indexDir, indexStop)" @item-select="selectStop(indexDir, indexStop)" placeholder="Nome fermata" type="text" size="small"/>
                                    <Button icon="pi pi-minus" class="p-button-danger" @click="removeStop(indexDir, indexStop)" size="small"/>
                                </li>
                            </div>
                            <Button label="Aggiungi fermata" severity="secondary" class="flex flex-col w-full m-2" size="small"  @click="addStop(indexDir)"/>
                            <Button label="Genera percorsi" severity="contrast" class="flex flex-col w-full m-2" size="small"  @click="generateRoutes()"/>
                        </ul>
                    </div>
                </SplitterPanel>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <h2 class="mb-4 ml-4">Tempi di percorrenza</h2>
                    <Timeline :value="directions[indexDir].stops" layout="vertical" align="top" class="flex-grow items-center justify-center w-full">
                        <template #content="slotProps">
                            {{ slotProps.item.name }}
                        </template>
                        <template #opposite="slotProps">
                            <small class="p-text-secondary"> {{ slotProps.item.timeToNext }} </small>
                        </template>
                    </Timeline>
                </SplitterPanel>
            </Splitter>
        </TabPanel>
    </TabView>
    <Button label="Avanti" size="small" @click="submit"/>
</template>

<script setup>
import { ref } from 'vue'
import { BusStopService } from '@/service/BusStopService';
import { useBusLineStore } from '@/stores/line';

const emits = defineEmits(['next-step']);

const store = useBusLineStore();
const directions = store.line.directions;

const searchStops = async (indexDir, indexStop) => {
  try {
    const q = {
        search: directions[indexDir].stops[indexStop].query
    }
    const stops = await BusStopService.searchBusStops(q);
    store.updateStopSuggestions(indexDir, indexStop, stops);
  } catch (error) {
    console.error('Error fetching stops:', error);
  }
};

const addStop = (directionIndex) => {
  store.addStop(directionIndex);
};

const selectStop = (indexDir, indexStop) => {
    
    store.selectStop(indexDir, indexStop, directions[indexDir].stops[indexStop].query);
}

const removeStop = (indexDir, indexStop) => {
  store.removeStop(indexDir, indexStop);
};

const generateRoutes = () => {
  store.generateRoutes();
};

const submit = () => {
    emits('next-step')
}

</script>