import { defineStore } from "pinia";

export const useUserStore = defineStore('user', {
    state: () => ({
        authenticated: false,
        name: {
            first: undefined,
            last: undefined
        },
        email: undefined,
        role: undefined
    }),
    actions: {
        setUserInfo({name, email, role}) {
            this.authenticated = true;
            this.name = name;
            this.email = email;
            this.role = role;
        }
    }
})