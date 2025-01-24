import { defineStore } from "pinia";

export const useAuthenticationStore = defineStore('authentication', {
    state: () => ({jwt: localStorage.getItem('jwt'), renewToken: localStorage.getItem('renewToken')}),
    actions: {
        setTokens(jwt, renewToken) {
            this.jwt = jwt
            localStorage.setItem('jwt', jwt)
            this.renewToken = renewToken
            localStorage.setItem('renewToken', renewToken)
        }
    }
});