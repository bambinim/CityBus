<template>
    <div class="flex flex-col items-center justify-center w-full h-full">
        <TabView :scrollable="true" class="flex flex-col w-full">
            <TabPanel header="Direzione 1">
                <DatePicker id="datepicker-timeonly" v-model="time" timeOnly fluid class="mb-4" />
                <Button label="Aggiungi Orario" severity="secondary" size="small" />
            </TabPanel>
        </TabView>
    </div>
</template>


<script setup>
import { ref } from 'vue';
import { TabView, TabPanel, InputText, Button } from 'primevue';

</script>