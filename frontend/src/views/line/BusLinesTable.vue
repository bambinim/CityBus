<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <DataTable scrollable scrollHeight="h-2/3" :value="lines" rowGroupMode="rowspan" groupRowsBy="line_name" selectionMode="single" dataKey="line_id" @rowSelect="onLineSelect" sortMode="single" sortField="line_name" :sortOrder="1" tableStyle="min-width: 50rem" class="sm:w-3/4 sm:h-1/2 md:w-2/3 md:h-1/2 justify-center">
            <Column selectionMode="single" headerStyle="width: 3rem"></Column>
            <Column header="#" headerStyle="width:3rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="line_name" header="Linea" style="min-width: 200px"></Column>
            <Column field="direction_name" header="Direzione" style="min-width: 150px"></Column>
            <Column field="stops" header="Stazione di partenza" style="width: 20%">
                <template #body="slotProps">
                    <span>{{ slotProps.data.stops[0].stop_name }}</span>
                </template>
            </Column>
            <Column field="stops" header="Stazione di arrivo" style="width: 20%">
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

const lines = ref(null)
const selectedLine = ref()
const router = useRouter();

onMounted(async () => {
    lines.value = await BusLineService.getBusLinesDetailedInformation()
})

const onLineSelect = (event) => {
    router.push(`/line/edit/${event.data.line_id}`)
}

</script>