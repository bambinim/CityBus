import axios from "axios";

const API_ENDPINT = import.meta.env.VITE_API_ENDPOINT

export const AuthenticationService = {
    login(email, password) {
        return new Promise(async (resolve, reject) => {
            let msg = '';
            try {
                const res = await axios.post(`${API_ENDPINT}/auth/session`, { email, password })
                if (res.status == 201) {
                    resolve({jwt: res.data.jwt, renewToken: res.data.renewToken})
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
