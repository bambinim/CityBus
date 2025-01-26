<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <div class="grid grid-flow-col grid-rows-2 grid-cols-1 w-full h-full">
            <div class="flex row-span-1 w-full">
                <AppMap :currentStep="currentStep" @save-stop="handleSaveStop"/>
            </div>
            <div class="flex row-span-1 w-full">
                <div v-if="currentStep === 1" class="w-full">
                    <EditLineStepOne :line="line" @update-line="handleUpdateLine" />
                </div>
                <div v-else-if="currentStep === 2" class="w-full">
                    <EditLineStepTwo :directions="directions"/>
                </div>
                <div v-else-if="currentStep === 3" class="w-full">
                    <EditLineStepThree />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Timeline from 'primevue/timeline';
import EditLineStepOne from '@/views/line/components/EditLineStepOne.vue';
import EditLineStepTwo from '@/views/line/components/EditLineStepTwo.vue';
import EditLineStepThree from '@/views/line/components/EditLineStepThree.vue';
import { BusStopService } from '@/service/BusStopService';


const currentStep = ref(1);

const busLine = ref('');

const directions = ref([])



const handleUpdateLine = (data) => {
    busLine.value = data.name;
    data.directions.forEach(direction => {
        directions.value.push({
            name: direction.name,
            stops: [],
            timetable: [],
            routeLegs: []
        })
    });
    currentStep.value++;
};

const handleSaveStop = async (data) => {
    try {
        await BusStopService.saveBusStop(data);
    } catch (error) {
        console.error('Error saving bus stop:', error);
    }
}


</script>