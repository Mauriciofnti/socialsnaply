<template>
  <header class="app-header">
    <div class="logo">
      <router-link to="/feed">SNAPLY</router-link>
    </div>
    <nav v-if="authStore.user" class="nav">
      <router-link to="/feed">Feed</router-link>
      <router-link to="/users">Usuários</router-link>
      <router-link 
        :to="authStore.user?.id ? `/profile/${authStore.user.id}` : '/login'"
      >
        Perfil
      </router-link>
      <router-link to="/edit-profile">Editar Perfil</router-link>
      <!-- Botão Mensagem: Só se user logado e no contexto certo (ex: profile de outro user) -->
      <button 
        v-if="authStore.user?.id && targetUserId" 
        @click="startDM(targetUserId)"
        class="dm-btn"
      >
        Mensagem
      </button>
    </nav>
    <div v-else class="nav">
      <router-link to="/login">Login</router-link>
      <router-link to="/register">Cadastrar</router-link>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'  // <-- IMPORT FALTANTE
import axios from 'axios'  // <-- IMPORT FALTANTE
import { useAuthStore } from '@/stores/auth'

const router = useRouter()  // <-- DEFINIDO
const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/'  // <-- DEFINIDO
const headers = computed(() => ({ Authorization: `Bearer ${authStore.token}` }))  // <-- DEFINIDO

// Props: Receba targetUserId se for usado em profile de outro user (ex: <HeaderComponent :target-user-id="userId" />)
const props = defineProps({
  targetUserId: {
    type: Number,
    default: null  // Seu próprio ID se null
  }
})

// Carrega user se necessário (após refresh)
onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchCurrentUser?.()  // Chama se existir no store
  }
})

// Inicia DM: Cria conversa e redireciona
const startDM = async (userId) => {
  if (!userId || userId === authStore.user?.id) {
    console.error('ID inválido ou mesmo usuário')
    return
  }
  try {
    const res = await axios.post(
      `${API_BASE}conversations/create/${userId}/`, 
      {}, 
      { headers: headers.value }
    )
    router.push(`/directs/${res.data.id}`)
  } catch (err) {
    console.error('Erro ao iniciar DM:', err.response?.data || err.message)
    if (err.response?.status === 401) router.push('/login')
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  font-family: 'Courier New', Courier, monospace;
}

.logo a {
  font-size: 1.5em;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav a {
  color: white;
  text-decoration: none;
}

.nav a:hover {
  text-decoration: underline;
}

.dm-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.dm-btn:hover {
  background: #218838;
}
</style>