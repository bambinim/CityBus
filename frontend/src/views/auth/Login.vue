<template>
    <div class="flex flex-col items-center justify-center w-full h-full">
        <Card class="sm:w-full md:w-1/2 justify-center">
            <template #content>
                <div class="flex flex-col items-center sm:w-full">
                    <span class="text-4xl">CityBus</span>
                    <span class="text-3xl mt-2">Login</span>
                    <Form class="m-5">
                        <label for="email" class="text-l mb-2">Email</label>
                        <InputText class="mb-8 w-full" id="email" name="email" type="text" placeholder="Email"/>
                        <label class="text-l mb-2" for="password">Password</label>
                        <InputText class="mb-8 w-full" id="password" name="password" type="password" placeholder="Password"/>
                        <Button label="Login" class="w-full" />
                    </Form>
                    <div>
                        <span>Non hai ancora un account?</span>
                        <RouterLink class="ml-2 p-button p-component p-button-link" to="/registration">Registrati</RouterLink>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>