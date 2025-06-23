<template>
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <DataTable v-model:selection="selectedLines" sortField="line_name" :sortOrder="-1" showGridlines paginator :rows="10" scrollable scrollHeight="h-2/3" :value="lines" rowGroupMode="rowspan" groupRowsBy="line_name" dataKey="line_id" sortMode="single" :metaKeySelection="false" tableStyle="min-width: 50rem" class="w-full h-full p-4">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Gestione linee</h4>
                    <div>
                        <Button label="Nuova linea" icon="pi pi-plus" class="mr-2" @click="openNew" />
                        <Button label="Elimina" icon="pi pi-trash" severity="danger" outlined @click="confirmDelete = true" :disabled="selectedLines.length == 0 " />
                        <Dialog 
                            v-model:visible="confirmDelete" 
                            header="Conferma eliminazione" 
                            modal
                            :style="{ width: '350px' }"
                        >
                            <p>Sei sicuro di voler eliminare le linee selezionate?</p>
                            <template #footer>
                                <Button label="Annulla" @click="confirmDelete = false" />
                                <Button 
                                label="Conferma" 
                                severity="danger" 
                                @click="handleDelete"
                            />
                            </template>
                        </Dialog>               
                    </div>
                </div>
            </template>
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
            <Column :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editLine(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteLine(slotProps.data)" />
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
import { faPlus, faTrash, faPencil } from '@fortawesome/free-solid-svg-icons'

const confirmDelete = ref(false);

const lines = ref(null)
const selectedLines = ref([])
const router = useRouter();

onMounted(async () => {
    lines.value = await BusLineService.getBusLinesDetailedInformation()
})

const handleDelete = () => {
    try {
        selectedLines.value.map(async line => {
            await BusLineService.deleteBusLine(line.line_id)
        })
        toast.add({ severity: 'success', summary: 'Linee eliminate con successo', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Errore durante l\'eliminazione', life: 3000 });
    } finally {
        confirmDelete.value = false;
        lines.value = lines.value.filter(line => !selectedLines.value.includes(line) )
        selectedLines.value = [];
    }

}

const confirmDeleteLine = async (line) => {
    await BusLineService.deleteBusLine(line.line_id)
    lines.value = lines.value.filter(l => l != line)
    toast.add({severity: 'success', summary: 'Linea eliminata con successo', life: 3000 });
}

const editLine = (line) => {
    router.push(`/line/edit/${line.line_id}`)
}

const openNew = () => {
    router.push(`/line/new`)
}

</script>