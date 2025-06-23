<script setup>
import { ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'vue-router'
import { AuthenticationService } from '@/service/AuthenticationService'
import { useAuthenticationStore } from '@/stores/authentication'


const toast = useToast();
const router = useRouter();
const authStore = useAuthenticationStore();


const resolver = ref(zodResolver(
    z.object({
        email: z.string().min(1, { message: 'Campo obbligatorio.' }).email({ message: 'Indirizzo email non valido.' }),
        password: z.string().min(1, { message: 'Campo obbligatorio.' }),
    })
));

const initialValues = {
    email: '',
    password: ''
};

const onFormSubmit = ({ valid, values }) => {
    if (!valid) {
        return;
    }
    AuthenticationService.login(values.email, values.password).then(({jwt, renewToken}) => {
        authStore.setTokens(jwt, renewToken);
        toast.add({severity: 'success', summary: 'Autenticazione effettuata con successo. Verrai reindirizzato automaticamente', life: 3000 })
        setTimeout(() => {
            router.push({ path: '/' })
        }, 3000);
    }).catch(err => {
        toast.add({severity: 'error', summary: err, life: 3000 })
    });
};
</script>

<template>
    <Toast />
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Card class="sm:w-full md:w-1/2 justify-center">
            <template #content>
                <div class="flex flex-col items-center sm:w-full">
                    <span class="text-4xl">CityBus</span>
                    <span class="text-3xl mt-2">Login</span>
                    <Form class="m-5" :initialValues v-slot="$form" :resolver @submit="onFormSubmit" >
                        <div class="mb-8">
                            <label for="email" class="text-l mb-2">Email</label>
                            <InputText class="w-full" id="email" name="email" type="text" placeholder="Email"/>
                            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{ $form.email.error?.message }}</Message>
                        </div>
                        <div class="mb-8">
                            <label class="text-l mb-2" for="password">Password</label>
                            <InputText class="w-full" id="password" name="password" type="password" placeholder="Password"/>
                            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error?.message }}</Message>
                        </div>
                        <Button label="Login" class="w-full" type="submit" />
                    </Form>
                    <RouterLink to="/forgot-password" class="ml-2 underline p-button p-component p-button-link">Hai dimenticato la password?</RouterLink>
                    <div>
                        <span>Non hai ancora un account?</span>
                        <RouterLink class="ml-2 p-button p-component p-button-link" to="/registration">Registrati</RouterLink>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
