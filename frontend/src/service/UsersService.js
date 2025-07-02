import requests from "@/lib/requests";

export const UsersService = {
    async registration(firstName, lastName, email, password) {
        let msg = '';
        try {
            const res = await requests.post(`/users/registration`, {data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            }});
            if (res.status == 201) {
                return;
            }
            msg = res.status == 400 ? 'L\'indirizzo email è già stato utilizzato' : 'Registrazione fallita';
        } catch {
            msg = 'Registrazione fallita';
        }
        throw msg;
    },

    async me() {
        let msg = ''
        try {
            const res = await requests.get(`/users/me`, {authenticated: true})
            if (res.status == 200) {
                return res.data
            }
            msg = 'Utente non autenticato'
        } catch {
            msg = 'Errore nella richiesta'
        }
        throw msg
    },

    async updateMe(firstName, lastName) {
        let msg = ''
        try {
            const res = await requests.put(`/users/me`, {authenticated: true, data: {firstName, lastName}})
            if (res.status == 200) {
                return
            }
            msg = 'Utente non autenticato'
        } catch {
            msg = 'Errore nella richiesta'
        }
        throw msg
    },

    async changePassword(oldPassword, newPassword) {
        let msg = ''
        try {
            const res = await requests.put(`/users/me/password`, {authenticated: true, data: {oldPassword, newPassword}})
            if (res.status == 200) {
                return
            }
            msg = 'Utente non autenticato'
        } catch {
            msg = 'Errore nella richiesta'
        }
        throw msg
    }
}