



<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Splitter layout="vertical" style="height: 100%; width: 100%;">
            <SplitterPanel class="flex items-center justify-center">
                <AppMap />
            </SplitterPanel>
            <SplitterPanel>
                <TabView :scrollable="true">
                    <TabPanel header="Direzione 1">
                        <Splitter>
                            <SplitterPanel class="flex flex-col w-full h-full">
                                <div class="flex flex-col w-full">
                                    <h2 class="mb-4">Fermate</h2>
                                    <ul class="list-group">
                                        <li class="list-group-item flex flex-col w-full">
                                            <InputText type="text" size="small" placeholder="Fermata 1" class="mb-4 mr-4" /> 
                                        </li>
                                        <Button label="Aggiungi fermata" severity="secondary" size="small" />
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
            </SplitterPanel>
        </Splitter>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Timeline from 'primevue/timeline';

const events = ref([
  {
    time: '14.00',
    color: 'green',
    icon: 'pi pi-check',
    name: 'Fermata 1',
    content: 'Arrivo alla fermata del parco'
  },
  {
    time: '14.30',
    color: 'blue',
    icon: 'pi pi-map-marker',
    name: 'Fermata 2',
    content: 'Sosta breve presso il museo della città'
  },
  {
    time: '15.00',
    color: 'purple',
    icon: 'pi pi-info-circle',
    name: 'Fermata 3',
    content: 'Arrivo terminale stazione centrale'
  }
]);
</script>