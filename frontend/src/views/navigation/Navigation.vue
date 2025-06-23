<template>
  <Toast />
  <AppMenu />
  <div class="grow h-full w-full p-4 grid md:grid-cols-8 md:grid-rows-1 grid-cols-1 grid-rows-2">
    <div class="md:col-span-2 row-span-1 h-full overflow-y-auto mb-2">
      <div class="flex flex-col md:flex-row gap-4 w-full mt-4">
        <div class="flex-1">
          <AutoComplete
            v-model="departureLabel"
            :suggestions="departureSuggestions"
            @complete="onDepartureSearch"
            @item-select="onDepartureSelect"
            placeholder="Cerca punto di partenza"
            class="w-full custom-autocomplete"
            inputClass="w-full"
          />
        </div>
        <div class="flex-1">
          <AutoComplete
            v-model="arrivalLabel"
            :suggestions="arrivalSuggestions"
            @complete="onArrivalSearch"
            @item-select="onArrivalSelect"
            placeholder="Cerca punto di arrivo"
            class="w-full custom-autocomplete"
            inputClass="w-full"
          />
        </div>
        <div class="w-full md:w-40">
          <InputText type="time" v-model="departureTime" class="w-full" />
        </div>
        <div class="w-full md:w-32">
          <Button type="button" label="Search" icon="pi pi-search" class="w-full" :loading="loading" @click="getPath" />
        </div>
      </div>

      <div class="w-full h-full mt-4 pr-2 pb-2" v-if="bestPath">
        <Timeline :value="bestPath.legs" align="alternate" class="customized-timeline">
          <template #marker="slotProps">
            <div :style="{ backgroundColor: slotProps.index == bestPath.legs.length - 1 ? 'red' : (slotProps.item.type == 'bus' ? 'dodgerblue' : 'orange') }" class="rounded-full">
              <font-awesome-icon class="md:fa-2xl fa-md p-2" :icon="slotProps.index == bestPath.legs.length - 1 ? faBullseye : (slotProps.item.type == 'bus' ? faBus : faPersonWalking)" style="color: white;" />
            </div>
          </template>
          <template #content="slotProps">
            <Card class="mt-4">
              <template #title>
                {{ slotProps.item.type == 'bus' ? slotProps.item.stops[0].name : (slotProps.index == 0 ? 'La tua posizione' : bestPath.legs[bestPath.legs.length - 2].stops[1].name) }}
              </template>
              <template #subtitle>
                <div class="w-full grid grid-rows-3">
                  <div v-if="slotProps.item.type == 'bus'" class="row-span-1">
                    <span class="rounded-lg text-white text-center bg-blue-500 mr-2">{{ slotProps.item.line.name }}</span>
                    <span class="font-bold md:text-xl text-md">{{ slotProps.item.line.direction.name }}</span>
                  </div>
                  <div class="row-span-1">
                    <span class="md:text-lg text-sm">Orario di partenza:</span>
                  </div>
                  <span class="row-span-1 font-bold md:text-2xl text-lg" :class="slotProps.index % 2 === 0 ? 'justify-self-start' : 'justify-self-end'">
                    {{ getTimeFromTimestampWithOffset(slotProps.item.departureTimestamp) }}
                  </span>
                </div>
              </template>
              <template #content>
                <div v-if="slotProps.item.type == 'bus'">
                  <p>Prossima fermata: <span class="font-bold">{{ slotProps.item.stops[1].name }}</span></p>
                  <p>Arrivo previsto alla prossima fermata: <span class="font-bold md:text-lg text-sm">{{ getTimeFromTimestampWithOffset(slotProps.item.arrivalTimestamp) }}</span></p>
                </div>
                <div v-else>
                  <p>Prossima fermata: <span class="font-bold">{{ slotProps.index === 0 ? bestPath.legs[1].stops[0].name : 'Destinazione' }}</span></p>
                  <p>Arrivo previsto: <span class="font-bold md:text-lg text-sm">{{ getTimeFromTimestampWithOffset(slotProps.item.arrivalTimestamp) }}</span></p>
                </div>
              </template>
            </Card>
          </template>
        </Timeline>
      </div>
    </div>

    <div class="md:col-span-6 row-span-1 p-4 h-full">
      <NavigationMap :bestPath="bestPath" @update:departure="updateDeparture" @update:arrival="updateArrival" />
    </div>
  </div>
</template>

<script setup>
import NavigationMap from './NavigationMap.vue'
import { RouteService } from '@/service/RouteService'
import { getTimeFromTimestampWithOffset } from '@/utils/DateUtils'
import { faPersonWalking, faBus, faBullseye } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { NominatimService } from '@/service/NominatimService'

const toast = useToast()
const departure = ref(null)
const arrival = ref(null)
const departureLabel = ref('')
const arrivalLabel = ref('')
const departureSuggestions = ref([])
const arrivalSuggestions = ref([])
const departureTime = ref('')
const loading = ref(false)
const bestPath = ref(null)
const emit = defineEmits(['drawBestPath'])
const detailedSuggestionsDeparture = ref([])
const detailedSuggestionsArrival = ref([])

async function onDepartureSearch(event) {
  detailedSuggestionsDeparture.value = await NominatimService.search(event.query)
  departureSuggestions.value = detailedSuggestionsDeparture.value.map(place => place.displayName)
  departure.value = detailedSuggestionsDeparture.value.find(p => p.displayName === departureLabel.value) || null
}

async function onArrivalSearch(event) {
  detailedSuggestionsArrival.value = await NominatimService.search(event.query)
  arrivalSuggestions.value = detailedSuggestionsArrival.value.map(place => place.displayName)
  arrival.value = detailedSuggestionsArrival.value.find(p => p.displayName === arrivalLabel.value) || null
}

function onDepartureSelect(e) {
  departureLabel.value = e.value
  departure.value = detailedSuggestionsDeparture.value.find(p => p.displayName === departureLabel.value)
}

function onArrivalSelect(e) {
  arrivalLabel.value = e.value
  arrival.value = detailedSuggestionsArrival.value.find(p => p.displayName === arrivalLabel.value)
}

async function getPath() {
  if (!departure.value || !arrival.value || !departureTime.value) {
    toast.add({ severity: 'warn', summary: 'Attenzione', detail: 'Compila tutti i campi.', life: 3000 })
    return
  }

  loading.value = true
  try {
    const data = {
      departure: departure.value,
      arrival: arrival.value,
      departureTime: departureTime.value
    }
    const path = await RouteService.getNavigationRoute(data)
    if (!path || !path.legs || path.legs.length === 0) {
      toast.add({ severity: 'info', summary: 'Nessun percorso trovato', life: 4000 })
      bestPath.value = null
    } else {
      bestPath.value = path
      toast.add({ severity: 'success', summary: 'Percorso trovato', life: 2000 })
      emit('drawBestPath', path)
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Errore', detail: 'Errore durante la ricerca del percorso.', life: 4000 })
    console.error(error)
  } finally {
    loading.value = false
  }
}

function updateDeparture(latlng) {
  departureLabel.value = latlng
  departure.value = latlng
}

function updateArrival(latlng) {
  arrivalLabel.value = latlng
  arrival.value = latlng
}
</script>

<style scoped>
.custom-autocomplete .p-inputtext,
.custom-autocomplete,
.custom-autocomplete .p-autocomplete {
  width: 100%;
  box-sizing: border-box;
}
</style>
