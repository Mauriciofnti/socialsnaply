<template>
  <div class="register-container">
    <form @submit.prevent="handleRegister">
      <h2>Cadastre-se</h2>
      <input v-model="credentials.username" type="text" placeholder="Username" required autocomplete="username" />
      <input v-model="credentials.email" type="email" placeholder="Email" required autocomplete="email" />
      <input v-model="credentials.password" type="password" placeholder="Senha (mín. 6 chars)" required autocomplete="new-password" minlength="6" />
      <button type="submit" :disabled="registering">Cadastrar</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p>Já tem conta? <router-link to="/login">Faça login</router-link></p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const credentials = ref({ username: '', email: '', password: '' })
const error = ref('')
const registering = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE

const handleRegister = async () => {
  if (credentials.value.password.length < 6) {
    error.value = 'Senha deve ter pelo menos 6 caracteres'
    return
  }
  registering.value = true
  error.value = ''
  try {
    const response = await axios.post(`${API_BASE}users/`, credentials.value)
    await authStore.login({ username: credentials.value.username, password: credentials.value.password })
    if (authStore.user) {
      router.push('/feed')
    } else {
      error.value = 'Cadastro OK, mas login falhou. Tente logar manualmente.'
    }
  } catch (err) {
    console.error('Erro no cadastro:', err)
    if (err.response?.data?.username) {
      error.value = err.response.data.username[0]
    } else if (err.response?.data?.email) {
      error.value = err.response.data.email[0]
    } else if (err.response?.data?.password) {
      error.value = err.response.data.password[0]
    } else {
      error.value = err.response?.data?.detail || 'Erro no cadastro. Tente novamente.'
    }
  } finally {
    registering.value = false
  }
}
</script>

<style scoped>
.register-container {
    max-width: 300px;
    margin: 100px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

input,
button {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    box-sizing: border-box;
}

button {
    background: #28a745;
    color: white;
    border: none;
    cursor: pointer;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.error {
    color: red;
    font-size: 0.9em;
}

router-link {
    color: #007bff;
    text-decoration: none;
}
</style>