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
                        <Button label="Avanti" icon="pi pi-arrow-right" iconPos="right" @click="handleGoToStepTwo" />
                    </div>
                </StepPanel>
                <StepPanel :value="2" class="flex flex-col grow">
                    <!-- DO NOT REMOVE v-if in the component undearneath. Without it the map is not loaded correctly! -->
                    <EditLineStepTwo v-if="currentStep == 2" v-model="busLine" class="grow" />
                    <div class="flex justify-between">
                        <Button label="Indietro" severity="secondary" icon="pi pi-arrow-left" @click="currentStep = 1" />
                        <Button label="Avanti" icon="pi pi-arrow-right" iconPos="right" @click="handleGoToStepThree" />
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
import { ref, onMounted } from 'vue'
import EditLineStepOne from '@/views/line/components/EditLineStepOne.vue';
import EditLineStepTwo from '@/views/line/components/EditLineStepTwo.vue';
import EditLineStepThree from '@/views/line/components/EditLineStepThree.vue';
import { BusLineService } from '@/service/BusLineService';
import { BusRideService } from '@/service/BusRideService'
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();
const currentStep = ref(1);
const toast = useToast();

const busLine = ref({
    name: '',
    directions: []
});

const isEditMode = ref(false);

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true;
    await loadLineData(route.params.id);
  }
});

const handleGoToStepTwo = () => {
    if (busLine.value.name.trim() === '') {
        toast.add({severity: 'error', summary: 'Il nome della linea non può essere vuoto', life: 3000 });
        return;
    }
    if (busLine.value.directions.length === 0) {
        toast.add({severity: 'error', summary: 'Devi aggiungere almeno una direzione alla linea', life: 3000 });
        return;
    }
    currentStep.value = 2;
}

const handleGoToStepThree = () => {
    if(busLine.value.directions.some(dir => dir.stops.length < 2)){
        toast.add({severity: 'error', summary: 'Devi aggiungere almeno due fermate per ogni direzione', life: 3000 });
        return;
    }
    if(busLine.value.directions.some(dir => dir.routeLegs.length === 0)){
        toast.add({severity: 'error', summary: 'Devi generare il percorso per ogni direzione', life: 3000 });
        return;
    }
    currentStep.value = 3;
}

const loadLineData = async (id) => {
    busLine.value = await BusLineService.getBusLineToEdit(id)
}

const saveBusLine = async () => {
    if(busLine.value.directions.some(dir => dir.timetable.length === 0)){
        toast.add({severity: 'error', summary: 'Devi aggiungere almeno un orario per ogni direzione', life: 3000 });
        return;
    }
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
                routeLegs: dir.routeLegs.map(leg => {
                    leg.steps = leg.steps.map(step => {
                        const newCoordinates = []
                        step.geometry.coordinates.forEach((coord, index) => {
                            if (index == 0) {
                                newCoordinates.push(coord)
                                return
                            }
                            if (JSON.stringify(coord) != JSON.stringify(step.geometry.coordinates[index - 1])) {
                                newCoordinates.push(coord)
                            }
                        })
                        step.geometry.coordinates = newCoordinates
                        return step
                    }).filter(step => step.geometry.coordinates.length > 2)
                    return leg
                }),
                timetable: dir.timetable
            }
        })
    }
    try {
        if(isEditMode.value){
            await BusLineService.editBusLine(route.params.id, data)
            toast.add({severity: 'success', summary: 'Modifica linea completata. Verrai reindirizzato automaticamente', life: 3000 });
        }else{
            await BusLineService.createNewBusLine(data)
            toast.add({severity: 'success', summary: 'Creazione linea completata. Verrai reindirizzato automaticamente', life: 3000 });
        }
        setTimeout(() => {
            router.push({ path: '/lines/view' })
        }, 3000);
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
}


</script>
