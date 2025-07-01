<script setup>
import AppMenu from '@/components/AppMenu.vue';



</script>

<template>
    <AppMenu />
    <h1 class="text-3xl">Profilo</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3">
        <div class="lg:col-span-3"><h2 class="text-xl">Informazioni generali</h2></div>
        <div>
            <label>Nome</label>
        </div>
        <div>
            <label>Cognome</label>
        </div>
        <div>
            <label>Email</label>
        </div>
        <div>
            <Button icon="pi pi-save" label="Salva modifiche" />
        </div>
        <Divider class="lg:col-span-3" />
        <div class="lg:col-span-3"><h2 class="text-xl">Cambia password</h2></div>
        <div></div>
    </div>
</template>
