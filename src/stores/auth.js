import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE //|| 
//'http://localhost:8000/api/'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  actions: {
    async login(credentials) {
      try {
        const response = await axios.post(`${API_BASE}token/`, credentials)
        this.token = response.data.access
        localStorage.setItem('token', this.token)
        await this.restoreAuth()
        return { success: true }
      } catch (error) {
        console.error('Login falhou:', error.response?.data)
        return { success: false, error: error.response?.data }
      }
    },
    async restoreAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        try {
          const userResponse = await axios.get(`${API_BASE}users/me/`)
          this.user = userResponse.data
          console.log('Auth restaurado no reload:', this.user)
        } catch (error) {
          console.error('Erro ao restaurar user:', error)
          // Se falhar (token inválido), logout auto
          this.logout()
        }
      }
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    }
  }
})