<template>
    <TabView :scrollable="true">
        <TabPanel v-for="(direction, indexDir) in directions" :key="indexDir" :header="direction.name">
            <div class="flex flex-col w-full h-full">
                <h2 class="mb-4">Orari di partenza {{ direction.name }}</h2>
                <div class="flex flex-col w-full" v-for="(time, timeIndex) in props.directions[indexDir].timetable" :key="timeIndex">
                    <DatePicker id="datepicker-timeonly" v-model="time.selectedTime" timeOnly fluid class="mb-4" />
                    <Button icon="pi pi-minus" @click="removeTime(indexDir, timeIndex)" class="remove-time-button"/>
                </div>
                <Button label="Aggiungi Orario" severity="secondary" size="small" @click="addTime(indexDir)" />
            </div>
        </TabPanel>
    </TabView>
    <Button label="Salva linea" class="flex flex-col w-full m-2" size="small"  @click="saveLines()"/>
</template>


<script setup>
import { ref, watch  } from 'vue';

const emits = defineEmits(['save-line']);

const props = defineProps({
  directions: Array
});

const addTime = (indexDir) => {
    props.directions[indexDir].timetable.push({hour: new Date().getHours, minute: new Date().getMinutes(), selectedTime: new Date()})
}

const removeTime = (indexDir, timeIndex) => {
    props.directions[indexDir].timetable.splice(timeIndex, 1)
}


const saveLines = () => {
    props.directions.forEach(direction => {
        direction.timetable = direction.timetable.map(t => ({         
                hour: t.selectedTime.getHours(),
                minute: t.selectedTime.getMinutes()
        }),
    )})
    emits('save-line')
}

</script>