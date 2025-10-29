<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin">
      <h2>Login</h2>
      <input v-model="credentials.username" type="text" placeholder="Username" required />
      <input v-model="credentials.password" type="password" placeholder="Senha" required autocomplete="current-password" />
      <button type="submit">Entrar</button>
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

const handleLogin = async () => {
  error.value = ''
  const result = await authStore.login(credentials.value)
  
  if (result.success) {
    console.log('Redirecionando pro feed!')
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
.login-container { max-width: 300px; margin: 100px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
input, button { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
button { background: #007bff; color: white; border: none; cursor: pointer; }
.error { color: red; font-size: 0.9em; }
</style>