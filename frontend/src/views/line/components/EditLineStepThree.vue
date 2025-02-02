<template>
    <Tabs class="col-span-2 2xl:col-span-1 flex flex-col" v-model:value="currentTab">
        <TabList>
            <Tab v-for="(direction, indexDir) in busLine.directions" :value="indexDir">{{ direction.name }}</Tab>
        </TabList>
        <TabPanels class="grow h-full">
            <TabPanel v-for="(direction, indexDir) in busLine.directions" :value="indexDir" class="h-full">
                <div class="flex flex-row justify-center">
                    <InputText type="time" v-model="timePicker"/>
                    <Button label="Aggiunti orario partenza" icon="pi pi-plus" variant="outlined" class="ms-2" @click="addTime" />
                </div>
                <DataTable v-model:selection="selectedItems" :value="dataTableTransform()" dataKey="id">
                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column v-for="(stop, stopIndex) in busLine.directions[currentTab].stops" :field="stopIndex.toString()" :header="stop.name"></Column>
                </DataTable>
                <Button label="Elimina selezionati" icon="pi pi-trash" severity="danger" class="mt-3" variant="outlined" @click="removeTimes" />
            </TabPanel>
        </TabPanels>
    </Tabs>
</template>


<script setup>
import { ref } from 'vue';

const busLine = defineModel()
const timePicker = ref()
const currentTab = ref(0)
const selectedItems = ref()

function timeSum(time, seconds) {
    const hourDelta = Math.floor(seconds / 3600);
    const minuteDelta = Math.floor((seconds - (hourDelta * 3600)) / 60);
    let hour = time.hour + hourDelta
    let minute = time.minute + minuteDelta
    if (minute >= 60) {
        hour += 1
        minute -= 60
    }
    return {
        hour: hour,
        minute: minute
    }
}

const addTime = () => {
    if (!timePicker.value) {
        return;
    }
    const startTime = [timePicker.value.split(':')].map(el => {
        return {hour: parseInt(el[0]), minute: parseInt(el[1])}
    })[0]
    let lastTime = startTime;
    busLine.value.directions[currentTab.value].timetable.push(
        [startTime].concat(busLine.value.directions[currentTab.value].routeLegs.map(leg => {
            lastTime = timeSum(lastTime, leg.duration);
            return lastTime;
        }))
    );
}

const removeTimes = () => {
    const newTimetable = []
    const selected = selectedItems.value.map(el => el.id)
    for (let i = 0; i < busLine.value.directions[currentTab.value].timetable.length; i++) {
        if (i != selected[0]) {
            newTimetable.push(busLine.value.directions[currentTab.value].timetable[i])
            continue
        }
        selected.splice(0, 1);
    }
    busLine.value.directions[currentTab.value].timetable = newTimetable
    selectedItems.value = undefined
}

const dataTableTransform = () => {
    let counter = 0
    return busLine.value.directions[currentTab.value].timetable.map(el => {
        const row = {id: counter}
        for (let i = 0; i < el.length; i++) {
            row[i.toString()] = `${el[i].hour.toString().padStart(2, '0')}:${el[i].minute.toString().padStart(2, '0')}`
        }
        counter += 1
        return row
    })
}

</script>
