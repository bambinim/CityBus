<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast';
import AppMenu from '@/components/AppMenu.vue';
import { UsersService } from '@/service/UsersService';
import { useUserStore } from '@/stores/user';

const toast = useToast();

const userStore = useUserStore()

const firstName = ref(userStore.name.first)
const lastName = ref(userStore.name.last)
const email = ref(userStore.email)

const passwordResolver = ({values}) => {
    let errors = {
        currentpassword: [],
        newpassword: [],
        confirmpassword: []
    }
    if (!values.currentpassword) {
        errors.currentpassword.push({type: 'required', message: 'Campo obbligatorio'})
    }
    if (!values.newpassword) {
        errors.newpassword.push({type: 'required', message: 'Campo obbligatorio'})
    }
    if (!values.confirmpassword) {
        errors.confirmpassword.push({type: 'required', message: 'Campo obbligatorio'})
    }
    return {values, errors}
}

const changePassword = ({valid, states}) => {
    if (!valid) {
        toast.add({severity: 'error', summary: 'Tutti i campi sono obbligatori', life: 3000 })
        return
    }
    if (states.newpassword.value != states.confirmpassword.value) {
        toast.add({severity: 'error', summary: 'Le password non coincidono', life: 3000 })
        return
    }
    UsersService.changePassword(states.currentpassword.value, states.newpassword.value)
        .then(() => {
            toast.add({severity: 'success', summary: 'La password è stata cambiata'})
            setTimeout(() => location.reload(), 3000)
        })
        .catch((err) => {
            toast.add({severity: 'error', summary: err})
        })
}

const updateUser = (_) => {
    if (firstName.value == '' || lastName.value == '') {
        toast.add({severity: 'error', summary: 'Nome e cognome sono obbligatori'})
        return
    }
    UsersService.updateMe(firstName.value, lastName.value)
        .then(() => {
            userStore.setUserInfo({
                name: {first: firstName, last: lastName},
                email: userStore.email,
                role: userStore.role
            })
            toast.add({severity: 'success', summary: 'Informazioni aggiornate correttamente'})
        })
        .catch((err) => toast.add({severity: 'error', summary: err}))
}

</script>

<template>
    <Toast />
    <AppMenu />
    <div class="flex flex-col mx-4 my-2">
        <h1 class="text-3xl">Profilo</h1>
        <Form @submit="updateUser" class="mt-2">
            <h2 class="text-2xl">Informazioni generali</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div class="flex flex-col">
                    <label for="first-name">Nome</label>
                    <InputText id="first-name" v-model="firstName" />
                </div>
                <div class="flex flex-col">
                    <label for="last-name">Cognome</label>
                    <InputText id="last-name" v-model="lastName" />
                </div>
                <div class="flex flex-col">
                    <label for="email">Email</label>
                    <InputText id="email" type="email" v-model="email" disabled />
                </div>
            </div>
            <Button type="submit" icon="pi pi-save" label="Salva modifiche" class="mt-2" />
        </Form>
        <Divider class="lg:col-span-3" />
        <Form @submit="changePassword" :resolver="passwordResolver">
            <h2 class="text-2xl">Cambia password</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <div class="flex flex-col">
                    <label for="current-password">Password attuale</label>
                    <InputText id="current-password" name="currentpassword" type="password" />
                </div>
                <div class="flex flex-col">
                    <label for="new-password">Nuova password</label>
                    <InputText id="new-password" name="newpassword" type="password" />
                </div>
                <div class="flex flex-col">
                    <label for="confirm-password">Conferma password</label>
                    <InputText id="confirm-password" name="confirmpassword" type="password" />
                </div>
            </div>
            <Button type="submit" label="Cambia password" class="mt-2" />
        </Form>
    </div>
</template>
