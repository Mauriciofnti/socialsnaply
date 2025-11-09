<template>
  <footer class="app-footer">
    <p>&copy; 2025 Snaply. Feito com Vue.js e Django. | <a href="/privacy">Privacidade</a></p>
    <button v-if="authStore.user" @click="logout" class="logout-btn">Logout</button>

  </footer>
</template>
<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
<style scoped>

.logout-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}
.app-footer {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-top: 1px solid #dee2e6;
    color: #6c757d;
}

.app-footer a {
    color: #007bff;
    text-decoration: none;
}
</style>