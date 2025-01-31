<template>
    <div class="flex flex-col items-center justify-center w-full h-full">
        <ScrollPanel class="h-full w-full flex">
            <div class="flex flex-col w-full">
                <h2 class="m-2">Inserisci Dettagli della Linea</h2>
                <InputText v-model="store.line.name" placeholder="Nome della linea" class="m-2" :invalid="!store.line.name"/>
                <h3 class="m-2">Direzioni:</h3>
                <div v-for="(direction, index) in store.line.directions" :key="index" class="m-2 flex flex-col direction-item grid grid-flow-col grid-rows-1 grid-cols-5 gap-4">
                    <InputText v-model="direction.name" placeholder="Nome direzione" class="col-span-4" :invalid="!direction.name" />
                    <Button icon="pi pi-minus" class="p-button-danger col-span-1 flex justify-end" @click="removeDirection(index)"/>
                </div>
                <Button label="Aggiungi direzione" @click="addDirection" severity="secondary" size="small" class="m-2" />
            </div>
        </ScrollPanel>
    </div>
    <div class="w-full flex justify-end p-4">
        <Button label="Avanti" size="small" @click="submit"/>
    </div>
</template>


<script setup>
import { useBusLineStore } from '@/stores/line';

const emits = defineEmits(['next-step']);

const store = useBusLineStore();

const addDirection = () => {
  store.addDirection();
};

const removeDirection = (index) => {
  store.removeDirection(index)
};

const submit = () => {
  emits('next-step')
}


</script>