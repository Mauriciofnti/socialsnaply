<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <h2>Login</h2>
      <input v-model="credentials.username" type="text" placeholder="username" required autocomplete="username"/>
      <input v-model="credentials.password" type="password" placeholder="senha" required autocomplete="current-password" />
      <button type="submit">Entrar</button>
      <div v-if="loading" class="spinner"></div>
      <p v-if="loading" class="text-gray-600 text-center max-w-sm">
        ⏳ O servidor está iniciando... isso pode levar até <strong>2 minutos</strong> no primeiro acesso.
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const credentials = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  const result = await authStore.login(credentials.value)
  if (result) loading.value = false

  if (result.success) {
    router.push('/feed')
  } else if (result.error) {
    const backendError = result.error
    if (backendError.non_field_errors) {
      error.value = backendError.non_field_errors.join(', ')
    } else if (backendError.username) {
      error.value = backendError.username[0]
    } else if (backendError.password) {
      error.value = backendError.password[0]
    } else {
      error.value = backendError.detail || 'Credenciais inválidas. Tenta de novo!'
    }
  } else {
    error.value = 'Falha no login. Verifica username/senha?'
  }
}
</script>

<style scoped>

.login-container {
  font-size: 22px;
  max-width: 300px;
  margin: 100px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

input,
button {
  width: 90%;
  padding: 10px;
  margin: 10px 0;
  box-sizing: border-box;
}

button {
  background: var(--base-color);
  color: #000;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

form{
  display: flex;
  align-items: center;
  flex-direction: column;
}

.error {
  color: red;
  font-size: 0.9em;
}

.spinner {
  width: 8px;
  height: 8px;
  border: 5px solid #000;
  border-top-color: var(--base-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>