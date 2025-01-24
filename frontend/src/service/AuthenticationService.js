import axios from "axios";

const API_ENDPINT = import.meta.env.VITE_API_ENDPOINT

export const AuthService = {
    login(email, password) {
        return new Promise(async (resolve, reject) => {
            let msg = '';
            try {
                const res = await axios.post(`${API_ENDPINT}/auth/session`, {email: email, password: password})
                if (res.status == 201) {
                    resolve(res.data)
                    return;
                }
                msg = 'Email o password non validi'
            } catch (err) {
                msg = 'Autenticazione fallita'
            }
            reject(msg)
        });
    },
    logout() {},
    renewSession() {}
};