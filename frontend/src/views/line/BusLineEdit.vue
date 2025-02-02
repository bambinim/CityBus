<template>
    <Toast />
    <AppMenu />
    <div class="absolute top-12 bottom-0 start-0 end-0 flex flex-col">
        <Stepper class="mx-4 mt-3 h-full flex flex-col" :value="currentStep" linear>
            <StepList>
                <Step :value="1">Informazioni generali</Step>
                <Step :value="2">Percorsi</Step>
                <Step :value="3">Orari</Step>
            </StepList>
            <StepPanels class="grow flex flex-col">
                <StepPanel :value="1">
                    <EditLineStepOne v-model="busLine" />
                    <div class="flex flex-row justify-end">
                        <Button label="Avanti" icon="pi pi-arrow-right" iconPos="right" @click="currentStep++" />
                    </div>
                </StepPanel>
                <StepPanel :value="2" class="flex flex-col grow">
                    <!-- DO NOT REMOVE v-if in the component undearneath. Without it the map is not loaded correctly! -->
                    <EditLineStepTwo v-if="currentStep == 2" v-model="busLine" class="grow" />
                    <div class="flex justify-between">
                        <Button label="Indietro" severity="secondary" icon="pi pi-arrow-left" @click="currentStep = 1" />
                        <Button label="Avanti" icon="pi pi-arrow-right" iconPos="right" @click="currentStep = 3" />
                    </div>
                </StepPanel>
                <StepPanel :value="3">
                    <EditLineStepThree v-model="busLine" />
                    <div class="flex justify-between">
                        <Button label="Indietro" severity="secondary" icon="pi pi-arrow-left" @click="currentStep = 2" />
                        <Button label="Salva" icon="pi pi-save" iconPos="right" @click="saveBusLine" />
                    </div>
                </StepPanel>
            </StepPanels>
        </Stepper>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import EditLineStepOne from '@/views/line/components/EditLineStepOne.vue';
import EditLineStepTwo from '@/views/line/components/EditLineStepTwo.vue';
import EditLineStepThree from '@/views/line/components/EditLineStepThree.vue';
import { BusLineService } from '@/service/BusLineService';
import { useToast } from 'primevue';
import { useRouter } from 'vue-router'

const router = useRouter();
const currentStep = ref(1);
const toast = useToast();

const busLine = ref({
    name: '',
    directions: []
});

const saveBusLine = async () => {
    const data = {
        name: busLine.value.name,
        directions: busLine.value.directions.map(dir => {
            return {
                name: dir.name,
                stops: dir.stops.map(stop => {
                    if (stop.stopId) {
                        return stop.stopId
                    }
                    return stop;
                }),
                routeLegs: dir.routeLegs,
                timetable: dir.timetable
            }
        })
    }
    try {
        await BusLineService.createNewBusLine(data)
        toast.add({severity: 'success', summary: 'Creazione linea completata. Verrai reindirizzato automaticamente', life: 3000 });
        setTimeout(() => {
            router.push({ path: '/home' })
        }, 3000);
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
}


</script>
