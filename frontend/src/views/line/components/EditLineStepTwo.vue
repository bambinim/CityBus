<template>
    <Toast />
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
                    <Timeline :value="directions[indexDir].stops" layout="vertical" align="top" class="flex flex-col w-full">
                        <template #content="slotProps">
                            {{ slotProps.item.name }}
                        </template>
                        <template #opposite="slotProps">
                            <small class="p-text-secondary"> {{ Math.floor(slotProps.item.timeToNext / 60) }} </small>
                        </template>
                    </Timeline>
                </SplitterPanel>
            </Splitter>
        </TabPanel>
    </TabView>
    <Button label="Avanti" size="small" @click="submit" :disabled="!isRoutesGenerated"/>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast';
import { BusStopService } from '@/service/BusStopService';
import { useBusLineStore } from '@/stores/line';

const emits = defineEmits(['next-step']);
const toast = useToast();

const store = useBusLineStore();
const directions = store.line.directions;

const isRoutesGenerated = ref(false)

const searchStops = async (indexDir, indexStop) => {
  try {
    const q = {
        search: directions[indexDir].stops[indexStop].query
    }
    const stops = await BusStopService.searchBusStops(q);
    store.updateStopSuggestions(indexDir, indexStop, stops);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel recupero delle fermate', life: 3000 });
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
    if (directions.some(dir => dir.stops.length < 2)) {
        toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'Inserisci almeno due fermate valide per ogni direzione per generare i percorsi.', life: 3000 });
        return;
    }else if(directions.some(dir => dir.stops.some(stop => !stop.name.trim())) 
            || directions.some(dir => dir.stops.some(stop => stop.name != stop.query))){
        toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'Fermate non valide.', life: 3000 });
        return
    }
    store.generateRoutes();
    isRoutesGenerated.value = true
};

const submit = () => {
    emits('next-step')
}

</script>