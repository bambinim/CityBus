<script setup>
import { ref } from "vue";
import { useToast } from 'primevue/usetoast';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'vue-router'
import { UsersService } from '@/service/UsersService'

const toast = useToast();
const router = useRouter();

const resolver = ref(zodResolver(
    z.object({
        firstName: z.string().min(1, { message: 'Campo obbligatorio.' }),
        lastName: z.string().min(1, { message: 'Campo obbligatorio.' }),
        email: z.string().min(1, { message: 'Campo obbligatorio.' }).email({ message: 'Indirizzo email non valido.' }),
        password: z.string().min(1, { message: 'Campo obbligatorio.' }),
        passwordConfirm: z.string().min(1, { message: 'Campo obbligatorio.' })
    }).superRefine(({ password, passwordConfirm }, ctx) => {
        if (password !== passwordConfirm) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Le password non coincidono',
                path: ['passwordConfirm']
            });
        }
    })
));

const initialValues = ref({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: ''
});

const onFormSubmit = ({ valid, values }) => {
    if (!valid) {
        return;
    }
    UsersService.registration(values.firstName, values.lastName, values.email, values.password).then(() => {
            toast.add({severity: 'success', summary: 'Registrazione completata. Verrai reindirizzato automaticamente alla pagina di login.', life: 5000 })
            setTimeout(() => {
                router.push({ path: '/login' })
            }, 5000);
        }).catch(err => {
            toast.add({severity: 'error', summary: err, life: 5000 })
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
                    <span class="text-3xl mt-2">Registrazione</span>
                    <Form class="m-5" :initialValues v-slot="$form" @submit="onFormSubmit" :resolver>
                        <div class="mb-5">
                            <label for="firstName" class="text-l mb-2">Nome</label>
                            <InputText class="w-full" id="firstName" name="firstName" type="text" placeholder="Nome"/>
                            <Message v-if="$form.firstName?.invalid" severity="error" size="small" variant="simple">{{ $form.firstName.error?.message }}</Message>
                        </div>
                        
                        <div class="mb-5">
                            <label for="lastName" class="text-l mb-2">Cognome</label>
                            <InputText class="w-full" id="lastName" name="lastName" type="text" placeholder="Cognome"/>
                            <Message v-if="$form.lastName?.invalid" severity="error" size="small" variant="simple">{{ $form.lastName.error?.message }}</Message>
                        </div>
                        
                        <div class="mb-5">
                            <label for="email" class="text-l mb-2">Email</label>
                            <InputText class="w-full" id="email" name="email" type="text" placeholder="Email"/>
                            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">{{ $form.email.error?.message }}</Message>
                        </div>

                        <div class="mb-5">
                            <label class="text-l mb-2" for="password">Password</label>
                            <InputText class="w-full" id="password" name="password" type="password" placeholder="Password" />
                            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{ $form.password.error?.message }}</Message>
                        </div>
                        
                        <div class="mb-5">
                            <label class="text-l mb-2" for="passwordConfirm">Conferma Password</label>
                            <InputText class="w-full" id="passwordConfirm" name="passwordConfirm" type="password" placeholder="Conferma Password"/>
                            <Message v-if="$form.passwordConfirm?.invalid" severity="error" size="small" variant="simple">{{ $form.passwordConfirm.error?.message }}</Message>
                        </div>
                        <Button label="Registrati" type="submit" class="w-full" />
                    </Form>
                </div>
            </template>
        </Card>
    </div>
</template>