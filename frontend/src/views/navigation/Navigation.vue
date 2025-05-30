<template>
  <Toast />
  <AppMenu />
  <div class="grow h-full w-full p-4 grid grid-cols-5">
    <div class="col-span-1">
      <div class="grow w-full p-4 grid grid-rows-4">
          <div class="row-span-1 grow w-full h-full grid grid-rows-3 grid-cols-2 gap-4 justify-items-center">
            <InputText class="mb-2 col-span-2" v-model="departure" type="text" size="large" :invalid="!departure" placeholder="Partenza"/>
            <InputText class="mb-2 col-span-2" v-model="arrival" type="text" size="large" :invalid="!arrival" placeholder="Arrivo"/>
            <InputText type="time" v-model="departureTime" class="col-span-1"/>
            <Button type="button" label="Search" icon="pi pi-search" :loading="loading" @click="getPath" />
          </div>
      </div>
    </div>
    <div class="col-span-4">
      <NavigationMap :bestPath="bestPath" @update:departure="updateDeparture" @update:arrival="updateArrival"/>
    </div>
  </div>
</template>

<script setup>
import NavigationMap from './NavigationMap.vue'
import { RouteService } from '@/service/RouteService'
import { faBullseye} from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const departure = ref(null)
const arrival = ref(null)
const departureTime = ref('')
const loading = ref(false);
const bestPath = ref(null)
const emit = defineEmits(['drawBestPath']);

async function getPath() {
  loading.value = true
  try {
    const data = {
      departure: departure.value,
      arrival: arrival.value,
      departureTime: departureTime.value
    }
    bestPath.value = await RouteService.getNavigationRoute(data)
    console.log(bestPath.value)
    emit('drawBestPath', bestPath.value)
    loading.value = false
  }
  catch (error) {
    console.error('Error fetching route:', error)
  } finally {
    loading.value = false
  }
}

function updateDeparture(latlng) {
  departure.value = latlng
}

function updateArrival(latlng) {
  arrival.value = latlng
}
</script>


