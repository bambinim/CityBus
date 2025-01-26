<template>
    <div style="height:100%; width:100%">
      <l-map ref="map" v-model:zoom="zoom" :center="[47.41322, -1.219482]" :useGlobalLeaflet="false" @click="handleMapClick">
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        ></l-tile-layer>
        <l-marker :lat-lng="marker.latlng" v-if="marker.visible">
          <l-popup v-if="popup.visible">
            <button v-if="currentStep === 2" @click="confirmStopCreation(marker.latlng.lat, marker.latlng.lng)">Crea fermata?</button>
          </l-popup>
        </l-marker>
      </l-map>
    </div>
</template>
  
<script setup>
  import { defineProps, ref } from 'vue';
  import "leaflet/dist/leaflet.css";
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import {NominatimService} from '@/service/NominatimService';

  const emits = defineEmits(['save-stop']);
  
  const props = defineProps({
    currentStep: Number
  });

  const zoom = ref(13)
  const popup = ref({visible: false})
  const marker = ref({visible: false, latlng: null})


  async function handleMapClick(event){
    console.log(props.currentStep)
    marker.value.latlng = event.latlng;
    popup.value.visible = true;
    marker.value.visible = true
  }
  async function confirmStopCreation(lat, lng) {
    if(props.currentStep != 2) return
    try {
      const locationDetails = await NominatimService.reverseGeocode(lat, lng);
      popup.visible = false
      emits('save-stop', { name: locationDetails.data.address.road, coordinates: [locationDetails.data.lat, locationDetails.data.lon] });
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  }

</script>
  
