import axios from "axios";

const API_ENDPINT = import.meta.env.VITE_API_ENDPOINT

export const UsersService = {
    registration(firstName, lastName, email, password) {
        return new Promise(async (resolve, reject) => {
            let msg = '';
            try {
                const res = await axios.post(`${API_ENDPINT}/users/registration`, {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    password: password
                });
                if (res.status == 201) {
                    resolve();
                    return;
                }
                msg = res.status == 400 ? 'L\'indirizzo email è già stato utilizzato' : 'Registrazione fallita';
            } catch {
                msg = 'Registrazione fallita';
            }
            reject(msg);
        });
    }
}