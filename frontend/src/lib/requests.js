import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useAuthenticationStore } from '@/stores/authentication'

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_ENDPOINT
})

async function renewAuthenticationToken(authStore) {
    res = await putRequest('/auth/session', { renewToken: authStore.renewToken })
    if (res.status == 200) {
        authStore.setTokens(res.data.jwt, res.data.renewToken)
        return;
    }
    throw "Errore durante il rinnovo della sessione."
}

async function getAuthorizationHeader() {
    const authStore = useAuthenticationStore()
    const decoded = jwtDecode(authStore.jwt)
    if (decoded.exp < Math.floor(Date.now() / 1000) ) {
        await renewAuthenticationToken(authStore);
    }
    return `Bearer ${authStore.jwt}`
}

async function request(method, endpoint, data, authenticated) {
    const headers = {}
    if (authenticated) {
        headers['Authorization'] = await getAuthorizationHeader()
    }
    return await instance.request({
        url: endpoint,
        method: method,
        data: data,
        headers: headers
    })
}

async function getRequest(endpoint, {data = undefined, authenticated =false}) {
    return await request('get', endpoint, data, authenticated)
}

async function postRequest(endpoint, {data = undefined, authenticated = false}) {
    return await request('post', endpoint, data, authenticated)
}

async function putRequest(endpoint, {data = undefined, authenticated = false}) {
    return await request('put', endpoint, data, authenticated)
}

async function deleteRequest(endpoint, {data = undefined, authenticated = false}) {
    return await request('delete', endpoint, data, authenticated)
}

export default {
    get: getRequest,
    post: postRequest,
    put: putRequest,
    delete: deleteRequest
}
