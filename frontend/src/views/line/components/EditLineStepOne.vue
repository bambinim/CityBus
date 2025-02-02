<template>
  <ScrollPanel class="flex flex-col">
    <div class="grid grid-cols-3 gap-3">
      <div class="col-span-3 md:col-span-1">
        <h2 class="m-2 text-xl">Dettagli</h2>
        <InputText v-model="busLine.name" placeholder="Nome della linea" class="m-2" :invalid="!busLine.name"/>
      </div>
      <div class="col-span-3 md:col-span-2">
        <h2 class="m-2 text-xl">Direzioni</h2>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="(direction, index) in busLine.directions" :key="index" class="col-span-3 md:col-span-1 flex flex-row">
            <InputText v-model="direction.name" placeholder="Nome direzione" :invalid="!direction.name" />
            <Button icon="pi pi-trash" severity="danger" variant="text" aria-label="Elimina direzione" @click="removeDirection(index)" />
          </div>
        </div>
        <Button label="Aggiungi direzione" icon="pi pi-plus" @click="addDirection" severity="secondary" class="m-2" />
      </div>
    </div>
  </ScrollPanel>
</template>


<script setup>
import { ref } from 'vue';

const busLine = defineModel();

const addDirection = () => {
  busLine.value.directions.push({ name: '', stops: [], routeLegs: [], timetable: [] });
};

const removeDirection = (index) => {
  busLine.value.directions.splice(index, 1);
};

</script>
