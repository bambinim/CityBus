<script setup>
import { ref } from "vue";
import { faCompass, faMap, faRoad, faClock, faBus } from '@fortawesome/free-solid-svg-icons'

const items = ref([
    {label: 'Cerca percorso', icon: faCompass},
    {label: 'Partenze', icon: faClock},
    {label: 'Cerca linea', icon: faBus},
    {label: 'Mappa', icon: faMap},
    {label: 'Linee', icon: faRoad},
]);
</script>
<template>
    <Menubar :model="items">
        <template #itemicon="itemProps">
            <font-awesome-icon v-if="itemProps.item.icon" :icon="itemProps.item.icon"/>
        </template>
        <template #end>
            <Avatar shape="circle" label="MB" />
        </template>
    </Menubar>
</template>
