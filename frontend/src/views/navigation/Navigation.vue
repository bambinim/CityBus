<template>
  <Toast />
  <div class="flex flex-col w-full h-full">
    <AppMenu />
  
    <div class="grow h-full w-full p-2 flex flex-col md:flex-row">
      <div class="md:basis-1/4 mb-2 md:me-2 flex flex-col">
        <div class="shrink-0">
          <Form @submit="(e) => {getPath()}">
            <div class="flex flex-col gap-4 w-full mt-4">
              <div class="flex-1">
                <IftaLabel>
                  <AutoComplete
                    id="departure"
                    v-model="departureLabel"
                    :suggestions="departureSuggestions"
                    @complete="onDepartureSearch"
                    @item-select="onDepartureSelect"
                    placeholder="Cerca punto di partenza"
                    class="w-full custom-autocomplete"
                    inputClass="w-full"
                  />
                  <label for="departure">Partenza</label>
                </IftaLabel>
              </div>
              <div class="flex-1">
                <IftaLabel>
                  <AutoComplete
                    id="arrival"
                    v-model="arrivalLabel"
                    :suggestions="arrivalSuggestions"
                    @complete="onArrivalSearch"
                    @item-select="onArrivalSelect"
                    placeholder="Cerca punto di arrivo"
                    class="w-full custom-autocomplete"
                    inputClass="w-full"
                  />
                  <label for="arrival">Arrivo</label>
                </IftaLabel>
              </div>
              <div class="flex-1">
                <IftaLabel>
                  <InputText id="departure-time" type="time" v-model="departureTime" class="w-full" placeholder="Orario di partenza" />
                  <label for="departure-time">Orario di partenza</label>
                </IftaLabel>
              </div>
              <div class="flex-1">
                <Button type="submit" label="Cerca" icon="pi pi-search" class="w-full" :loading="loading" />
              </div>
            </div>
          </Form>
        </div>
        <div class="w-full flex-1 mt-4 pr-2 pb-2 overflow-auto" v-if="pathFiltered">
          <Timeline :value="pathFiltered.legs" align="alternate" class="customized-timeline">
            <template #marker="slotProps">
              <div :style="{ backgroundColor: slotProps.index == pathFiltered.legs.length - 1 ? 'red' : (slotProps.item.type == 'bus' ? 'dodgerblue' : 'orange') }" class="rounded-full">
                <font-awesome-icon class="md:fa-2xl fa-md p-2" :icon="slotProps.index == pathFiltered.legs.length - 1 ? faBullseye : (slotProps.item.type == 'bus' ? faBus : faPersonWalking)" style="color: white;" />
              </div>
            </template>
            <template #content="slotProps">
              <Card class="mt-4">
                <template #title>
                  {{ slotProps.item.type == 'bus' ? slotProps.item.stops[0].name : (slotProps.index == 0 ? 'La tua posizione' : pathFiltered.legs[pathFiltered.legs.length - 2].stops[1].name) }}
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
                    <p>Cambio bus alla fermata: <span class="font-bold">{{ slotProps.item.stops[1].name }}</span></p>
                    <p>Arrivo previsto alla fermata: <span class="font-bold md:text-lg text-sm">{{ getTimeFromTimestampWithOffset(slotProps.item.arrivalTimestamp) }}</span></p>
                  </div>
                  <div v-else>
                    <p>Proseguite a piedi fino a <span class="font-bold">{{ slotProps.index === 0 ? pathFiltered.legs[1].stops[0].name : 'Destinazione' }}</span></p>
                    <p>Arrivo previsto: <span class="font-bold md:text-lg text-sm">{{ getTimeFromTimestampWithOffset(slotProps.item.arrivalTimestamp) }}</span></p>
                  </div>
                </template>
              </Card>
            </template>
          </Timeline>
      </div>
    </div>
    <div class="md:basis-3/4 p-1 h-full w-full">
      <NavigationMap :pathToFollow="pathToFollow" :pathFiltered="pathFiltered" @update:departure="updateDeparture" @update:arrival="updateArrival" />
    </div>
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
const pathToFollow = ref(null)
const pathFiltered = ref(null)
const detailedSuggestionsDeparture = ref([])
const detailedSuggestionsArrival = ref([])
const lastDirection = ref(null)

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
      pathFiltered.value = null
      pathToFollow.value = null
    } else {
      pathToFollow.value = { ...path }
      console.log("Path: ", pathToFollow)
      pathFiltered.value = computePath(path)
      toast.add({ severity: 'success', summary: 'Percorso trovato', life: 2000 })
    }
  } catch (error) {
    toast.add({ severity: 'info', summary: 'Nessun percorso trovato', life: 4000 })
  } finally {
    loading.value = false
  }
}

function computePath(pathFiltered) {
  const mergedLegs = pathFiltered.legs.reduce((acc, leg, idx, arr) => {
    const lastMerged = acc[acc.length - 1];

    if (leg.type === "foot") {
      // Tratta a piedi: aggiungi direttamente
      return [...acc, { ...leg }];
    }

    if (leg.type === "bus") {
      const directionId = leg.line.direction.id;

      if (
        !lastMerged ||
        lastMerged.type !== "bus" ||
        lastMerged.line.direction.id !== directionId
      ) {
        // Nuova direzione bus: crea una nuova tratta
        const newLeg = {
          type: "bus",
          departureTimestamp: leg.departureTimestamp,
          arrivalTimestamp: leg.arrivalTimestamp,
          line: leg.line,
          duration: 0,
          stops: [leg.stops[0], leg.stops[leg.stops.length - 1]],
          routeToNext: {
            type: "LineString",
            coordinates: leg.stops.reduce(
              (coords, stop) => coords.concat(stop.routeToNext.coordinates),
              []
            ),
          },
        };
        newLeg.duration = (newLeg.arrivalTimestamp - newLeg.departureTimestamp) / 1000;
        return [...acc, newLeg];
      } else {
        // Stessa direzione: aggiorna l’ultima tratta bus unita
        const updatedLeg = {
          ...lastMerged,
          arrivalTimestamp: leg.arrivalTimestamp,
          stops: [
            lastMerged.stops[0],
            leg.stops[leg.stops.length - 1],
          ],
          routeToNext: {
            type: "LineString",
            coordinates: lastMerged.routeToNext.coordinates.concat(
              leg.stops.reduce(
                (coords, stop) => coords.concat(stop.routeToNext.coordinates),
                []
              )
            ),
          },
        };
        updatedLeg.duration = (updatedLeg.arrivalTimestamp - updatedLeg.departureTimestamp) / 1000;
        return [...acc.slice(0, -1), updatedLeg];
      }
    }

    return acc; // fallback per tipi inattesi
  }, []);

  return {
    ...pathFiltered,
    legs: mergedLegs,
  };
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
