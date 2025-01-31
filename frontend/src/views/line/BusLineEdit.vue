<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <div class="grid grid-flow-col grid-rows-2 grid-cols-1 w-full h-full">
            <div class="flex row-span-1 w-full">
                <AppMap :currentStep="currentStep" @save-stop="handleSaveStop"/>
            </div>
            <div class="flex row-span-1 w-full">
                <div v-if="currentStep === 1" class="w-full">
                    <EditLineStepOne @next-step="handleNextStep"/>
                </div>
                <div v-else-if="currentStep === 2" class="w-full">
                    <EditLineStepTwo @next-step="handleNextStep"/>
                </div>
                <div v-else-if="currentStep === 3" class="w-full">
                    <EditLineStepThree @save-line="handleSaveLine"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import EditLineStepOne from '@/views/line/components/EditLineStepOne.vue';
import EditLineStepTwo from '@/views/line/components/EditLineStepTwo.vue';
import EditLineStepThree from '@/views/line/components/EditLineStepThree.vue';
import { BusStopService } from '@/service/BusStopService';
import { BusLineService } from '@/service/BusLineService';
import { useBusLineStore } from '@/stores/line';

const store = useBusLineStore();


const currentStep = ref(1);

const handleNextStep = () => {
    currentStep.value++
}

const handleSaveStop = async (data) => {
    try {
        await BusStopService.saveBusStop(data);
    } catch (error) {
        console.error('Error saving bus stop:', error);
    }
}

const handleSaveLine = async () => {
    try{
        await BusLineService.createNewBusLine(store.line);
        store.clearLine();
        console.log('Nuova Linea salvata');
    } catch (error) {
        console.error('Error saving bus stop:', error);
    }
}


</script>