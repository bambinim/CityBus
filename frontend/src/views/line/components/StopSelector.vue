<script setup>
import { ref } from 'vue';
import { BusStopService } from '@/service/BusStopService';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useToast } from 'primevue';

const props = defineProps(['newStops'])
const emit = defineEmits(['stop-selected'])
const toast = useToast();
const selectedStop = ref(undefined)
const stopOptions = ref([])
const loadOptions = async (event) => {
    try {
        stopOptions.value = await BusStopService.searchBusStops({search: event.query})
        props.newStops.forEach(stop => stopOptions.value.push(stop))
    } catch (err) {
        toast.add({severity: 'error', summary: err, life: 3000 })
    }
};

const closeInplace = (callback) => {
    selectedStop.value = undefined
    callback()
}

const stopSelected = (callback) => {
    callback();
    emit('stop-selected', selectedStop.value)
    console.log(selectedStop.value)
    selectedStop.value = undefined
}


</script>

<template>
    <Inplace class="w-full">
        <template #display>
            <font-awesome-icon :icon="faPlus" />
            {{ 'Aggiunti fermata esistente' }}
        </template>
        <template #content="{ closeCallback }">
            <span class="inline-flex items-center gap-2">
                <AutoComplete
                    v-model="selectedStop"
                    :suggestions="stopOptions"
                    @complete="loadOptions"
                    @option-select="stopSelected(closeCallback)"
                    optionLabel="name" />
                <Button icon="pi pi-times" text severity="danger" @click="closeInplace(closeCallback)" />
            </span>
        </template>
    </Inplace>
</template>
