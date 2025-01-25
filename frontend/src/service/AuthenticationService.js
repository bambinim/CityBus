import requests from "@/lib/requests";

export const AuthenticationService = {
    async login(email, password) {
        let msg = ''
        try {
            const res = await requests.post(`/auth/session`, { data: {email, password} })
            if (res.status == 201) {
                return {jwt: res.data.jwt, renewToken: res.data.renewToken}
            }
            msg = 'Email o password non validi'
        } catch (err) {
            msg = 'Autenticazione fallita'
        }
        throw msg
    },
    async logout() {
        try {
            const res = await requests.delete(`/auth/session`, { authenticated: true })
            if (res.status == 201) {
                return 'Logout effettuato con successo'
            }
        } catch (err) {}
        throw 'Errore durante il logout'
    }
};
