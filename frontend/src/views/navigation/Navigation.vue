<template>
  <Toast />
  <AppMenu />
  <div class="grow h-full w-full p-4 grid grid-cols-5">
    <div class="col-span-2">
      <div class="grow w-full p-4 grid grid-rows-4">
          <div class="row-span-1 grow w-full h-full grid grid-rows-3 grid-cols-2 gap-4 justify-items-center">
            <InputText class="mb-2 col-span-2" v-model="departure" type="text" size="large" :invalid="!departure" placeholder="Partenza"/>
            <InputText class="mb-2 col-span-2" v-model="arrival" type="text" size="large" :invalid="!arrival" placeholder="Arrivo"/>
            <InputText type="time" v-model="departureTime" class="col-span-1"/>
            <Button type="button" label="Search" icon="pi pi-search" :loading="loading" @click="getPath" />
          </div>
          <div class="row-span-3 grow w-full h-full mt-4" v-if="bestPath">
            <Timeline :value="bestPath.legs" align="alternate" class="customized-timeline">
                    <template #marker="slotProps">
                      <div :style="{ backgroundColor: slotProps.index == bestPath.legs.length - 1 ? 'red' : (slotProps.item.type == 'bus' ? 'dodgerblue' : 'orange') }" class="rounded-full">
                        <font-awesome-icon class="fa-2xl p-2" :icon="slotProps.index == bestPath.legs.length - 1 ? faBullseye : (slotProps.item.type == 'bus' ? faBus : faPersonWalking)" style="color: white;"/>
                      </div>
                    </template>
                    <template #content="slotProps">
                    <Card class="mt-4">
                        <template #title>
                            {{ slotProps.item.type == 'bus' ? slotProps.item.stops[0].name : (slotProps.index == 0 ? 'La tua posizione' : bestPath.legs[bestPath.legs.length - 2].stops[1].name) }}
                        </template>
                        <template #subtitle>
                          <div class="w-full grid grid-cols-3">
                              <div v-if="slotProps.item.type == 'bus'" class="col-span-2 grid grid-cols-2">
                                <span class="rounded-lg text-white text-center bg-blue-500 mr-2 col-span-1">{{ slotProps.item.line.name }}</span>
                                <span class="col-span-1 font-bold text-xl justify-self-start">{{ slotProps.item.line.direction.name }}</span>
                              </div>
                              <div v-else class="col-span-2">
                                <span class="justify-self-start text-lg col-span-2">Orario di partenza</span>
                              </div>
                              <span class="col-span-1 font-bold text-2xl justify-self-end">{{ getTimeFromTimestamp(slotProps.item.departureTimestamp) }}</span>
                          </div>
                        </template>
                        <template #content>
                            <div v-if="slotProps.item.type == 'bus'">
                              <p>Prossima fermata: <span class="font-bold">{{ slotProps.item.stops[1].name }}</span></p>
                              <p>Arrivo previsto alla prossima fermata: <span class="font-bold text-lg">{{ getTimeFromTimestamp(slotProps.item.arrivalTimestamp) }}</span></p>
                            </div>
                            <div v-else>
                              <div v-if="slotProps.index == 0">
                                <p>Prossima fermata: <span class="font-bold">{{ bestPath.legs[1].stops[0].name}}</span></p>
                                <p>Arrivo previsto alla prossima fermata: <span class="font-bold text-lg">{{ getTimeFromTimestamp(slotProps.item.arrivalTimestamp) }}</span></p>
                              </div>
                              <div v-else>
                                <p>Prossima fermata: <span class="font-bold">Destinazione</span></p>
                                <p>Arrivo previsto a destinazione: <span class="font-bold text-lg">{{ getTimeFromTimestamp(slotProps.item.arrivalTimestamp) }}</span></p>
                              </div>
                            </div>
                        </template>
                    </Card>
                </template>
            </Timeline>
          </div>
      </div>
    </div>
    <div class="col-span-3">
      <NavigationMap :bestPath="bestPath" @update:departure="updateDeparture" @update:arrival="updateArrival"/>
    </div>
  </div>
</template>

<script setup>
import NavigationMap from './NavigationMap.vue'
import { RouteService } from '@/service/RouteService'
import { getTimeFromTimestamp } from '@/utils/DateUtils'
import { faPersonWalking, faBus, faBullseye} from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast();

const departure = ref(null)
const arrival = ref(null)
const departureTime = ref('')
const loading = ref(false);
const bestPath = ref(null)
const emit = defineEmits(['drawBestPath']);

async function getPath() {
  loading.value = true
  try {
    if (!departure.value || !arrival.value) {
      toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'Inserisci sia partenza che arrivo', life: 3000 });
      loading.value = false
      return;
    }
    const latLngRegex = /^LatLng\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)$/;
    if (!latLngRegex.test(departure.value)) {
      toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'La partenza deve essere nel formato LatLng(lat, lng)', life: 4000 });
      loading.value = false
      return;
    }
    if (!latLngRegex.test(arrival.value)) {
      toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'L\'arrivo deve essere nel formato LatLng(lat, lng)', life: 4000 });
      loading.value = false
      return;
    }
    if (!departureTime.value) {
      toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'Inserisci l\'orario di partenza', life: 3000 });
      loading.value = false
      return;
    }
    const data = {
      departure: departure.value,
      arrival: arrival.value,
      departureTime: departureTime.value
    }
    bestPath.value = await RouteService.getNavigationRoute(data)
    if (!bestPath.value || !bestPath.value.legs || bestPath.value.legs.length === 0) {
      toast.add({ severity: 'info', summary: 'Nessun percorso trovato', detail: 'Non è stato trovato alcun percorso per i dati inseriti.', life: 4000 });
      bestPath.value = null
      loading.value = false
      return;
    }
    toast.add({ severity: 'success', summary: 'Percorso trovato', detail: 'Il percorso è stato calcolato con successo.', life: 2000 });
    emit('drawBestPath', bestPath.value)
    loading.value = false
  }
  catch (error) {
    toast.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante la ricerca del percorso.', life: 4000 });
    console.error('Error fetching route:', error)
    bestPath.value = null
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


