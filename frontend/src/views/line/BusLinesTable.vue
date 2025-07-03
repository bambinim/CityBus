<template>
    <Toast />
    <AppMenu />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <DataTable v-model:selection="selectedLines" showGridlines paginator :rows="20" scrollable scrollHeight="h-2/3" :value="lines" rowGroupMode="rowspan" groupRowsBy="line_name" dataKey="line_id" sortMode="single" :metaKeySelection="false" tableStyle="min-width: 50rem" class="w-full h-full p-4">
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
                                    @click="_ => deleteLines(selectedLines)"
                                />
                            </template>
                        </Dialog>               
                    </div>
                </div>
            </template>
            <Column selectionMode="multiple" field="line_name" headerStyle="width: 3rem"></Column>
            <Column header="#" field="line_name" headerStyle="width:3rem">
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
            <Column field="line_name" :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editLine(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="_ => deleteLine(slotProps.data)" />
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

const toast = useToast();
const confirmDelete = ref(false);

const lines = ref(null)
const selectedLines = ref([])
const router = useRouter();

onMounted(async () => {
    lines.value = await BusLineService.getBusLinesDetailedInformation()
})

const deleteLine = (lineData) => {
    deleteLines([lineData])
}

const deleteLines = async (linesList) => {
    const ids = []
    try {
        for (const i in linesList) {
            await BusLineService.deleteBusLine(linesList[i].line_id)
            ids.push(linesList[i].line_id)
        }
        toast.add({ severity: 'success', summary: 'Linee eliminate con successo', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Errore durante l\'eliminazione', life: 3000 });
    } finally {
        confirmDelete.value = false;
        const newLines = lines.value.filter(line => !ids.includes(line.line_id) )
        lines.value = newLines;
        selectedLines.value = [];
    }
}

const editLine = (line) => {
    router.push(`/line/edit/${line.line_id}`)
}

const openNew = () => {
    router.push(`/line/new`)
}

</script>