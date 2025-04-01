<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="New" :icon="faPlus" class="mr-2" @click="openNew" />
                <Button label="Delete" :icon="faTrash" severity="danger" outlined @click="confirmDeleteSelected" :disabled="!selectedLines" />
            </template>
        </Toolbar>
        <DataTable v-model:selection="selectedLines" sortField="line_name" :sortOrder="-1" showGridlines paginator :rows="10" scrollable scrollHeight="h-2/3" :value="lines" rowGroupMode="rowspan" groupRowsBy="line_name" dataKey="line_id" sortMode="single" :metaKeySelection="false" tableStyle="min-width: 50rem" class="sm:w-3/4 sm:h-1/2 md:w-2/3 md:h-1/2 justify-center">
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column header="#" headerStyle="width:3rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column sortable field="line_name" header="Linea" style="min-width: 200px"></Column>
            <Column field="direction_name" header="Direzione" style="min-width: 150px"></Column>
            <Column sortable field="stops" header="Stazione di partenza" style="width: 20%">
                <template #body="slotProps">
                    <span>{{ slotProps.data.stops[0].stop_name }}</span>
                </template>
            </Column>
            <Column sortable field="stops" header="Stazione di arrivo" style="width: 20%">
                <template #body="slotProps">
                    <span>{{ slotProps.data.stops[slotProps.data.stops.length - 1].stop_name }}</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<script setup>
import { BusLineService } from '@/service/BusLineService'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'

const lines = ref(null)
const selectedLines = ref()
const router = useRouter();

onMounted(async () => {
    lines.value = await BusLineService.getBusLinesDetailedInformation()
})

const confirmDeleteSelected = () => {
    selectedLines.value.map(async line => {
        await BusLineService.deleteBusLine(line.line_id)
    })
    lines.value = lines.value.filter(line => !selectedLines.value.includes(line) )
    selectedLines.value = null
}

const openNew = () => {
    router.push(`/line/new`)
}

</script>