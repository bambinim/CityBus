<template>

    <TabView :scrollable="true">
        <TabPanel v-for="(direction, indexDir) in directions" :key="indexDir" :header="direction.name">
            <Splitter>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <div class="flex flex-col w-full">
                        <h2 class="mb-4">Fermate {{ direction.name }}</h2>
                        <ul class="list-group">
                            <div v-for="(stop, indexStop) in props.directions[indexDir].stops" :key="indexStop">
                                <li class="list-group-item flex flex-col grid grid-flow-col grid-rows-1 grid-cols-5 flex flex-col w-full m-2">
                                    <InputText v-model="stop.name" type="text" size="small" placeholder="Nome fermata" class="col-span-3 mr-2" />
                                    <Button icon="pi pi-minus" class="p-button-danger col-span-" @click="removeStop(indexDir, indexStop)" size="small"/>
                                </li>
                            </div>
                            <Button label="Aggiungi fermata" severity="secondary" size="small"  @click="addStop(indexDir)"/>
                        </ul>
                    </div>
                </SplitterPanel>
                <SplitterPanel class="flex flex-col w-full h-full">
                    <h2 class="mb-4 ml-4">Tempi di percorrenza</h2>
                    <Timeline :value="events" layout="vertical" align="top" class="flex-grow items-center justify-center">
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

const props = defineProps({
  directions: Array
});

const newStopName = ref('');

const addStop = (directionIndex) => {
    props.directions[directionIndex].stops.push({ name: ''});
}

const removeStop = (indexDir, indexStop) => {
    props.directions[indexDir].stops.splice(indexStop, 1)
}

</script>