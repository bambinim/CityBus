<template>
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Card class="sm:w-full md:w-1/2 justify-center">
            <template #content>
                <div class="flex flex-col items-center sm:w-full">
                    <span class="text-4xl">CityBus</span>
                    <span class="text-3xl mt-2">Registrazione</span>
                    <Form class="m-5">
                        <label for="firstName" class="text-l mb-2">Nome</label>
                        <InputText class="mb-5 w-full" id="firstName" name="firstName" type="text" placeholder="Nome"/>

                        <label for="lastName" class="text-l mb-2">Cognome</label>
                        <InputText class="mb-5 w-full" id="lastName" name="lastName" type="text" placeholder="Cognome"/>

                        <label for="email" class="text-l mb-2">Email</label>
                        <InputText class="mb-5 w-full" id="email" name="email" type="text" placeholder="Email"/>

                        <label class="text-l mb-2" for="password">Password</label>
                        <InputText class="mb-5 w-full" id="password" name="password" type="password" placeholder="Password"/>

                        <label class="text-l mb-2" for="passwordConfirm">Conferma Password</label>
                        <InputText class="mb-5 w-full" id="passwordConfirm" name="passwordConfirm" type="password" placeholder="Conferma Password"/>

                        <Button label="Registrati" class="w-full" />
                    </Form>
                </div>
            </template>
        </Card>
    </div>
</template>