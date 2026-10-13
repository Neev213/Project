import axios from 'axios'

export const TOKEN_KEY = 'we_token'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

    // Attach the JWT to every outgoing request
    api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
        /* storage unavailable, continue without a token */
    }
    return config
})

export default api