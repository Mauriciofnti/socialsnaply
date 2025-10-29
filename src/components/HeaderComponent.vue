<template>
  <header class="app-header">
    <div class="logo">
      <router-link to="/feed">Snaply</router-link>
    </div>
    <nav v-if="authStore.user" class="nav">
      <router-link to="/feed">Feed</router-link>
      <router-link to="/users">Usuários</router-link>
        <router-link :to="authStore.user ? `/profile/${authStore.user.id}` : '/login'">
        Perfil
        </router-link>
      <router-link to="/edit-profile">Editar Perfil</router-link>
      <button @click="logout" class="logout-btn">Logout</button>
    </nav>
    <div v-else class="nav">
      <router-link to="/login">Login</router-link>
      <router-link to="/register">Cadastrar</router-link>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #007bff; color: white; }
.logo a { font-size: 1.5em; font-weight: bold; color: white; text-decoration: none; }
.nav { display: flex; gap: 20px; align-items: center; }
.nav a { color: white; text-decoration: none; }
.logout-btn { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
</style>