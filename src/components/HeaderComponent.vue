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
      
      <router-link to="/directs" class="directs-link">
        <span><img src="./icons/comment-solid.svg" width="30px" alt="" ></span>
        <div v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</div>
      </router-link>
      
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
import { computed, onMounted, ref, onUnmounted } from 'vue'  // <-- NOVO: ref pra unreadCount
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE
const headers = computed(() => ({ Authorization: `Bearer ${authStore.token}` }))

// Props: Receba targetUserId se for usado em profile de outro user
const props = defineProps({
  targetUserId: {
    type: Number,
    default: null
  }
})

// NOVO: Ref pra conversas e unread count
const conversations = ref([])
const unreadCount = ref(0)

// Fetch conversas e calcula unread (chamado no mount)
const fetchConversationsForBadge = async () => {
  if (!authStore.token) return
  try {
    const res = await axios.get(`${API_BASE}conversations/`, { headers: headers.value })
    conversations.value = res.data
    
    // Calcula total unread (msgs não lidas de outros users)
    unreadCount.value = conversations.value.reduce((total, conv) => {
      const unreadInConv = conv.messages?.filter(msg => 
        !msg.is_read && msg.author.id !== authStore.user?.id
      ).length || 0
      return total + unreadInConv
    }, 0)
  } catch (err) {
    console.error('Erro ao fetch conversas pro badge:', err)
  }
}

// Carrega user se necessário (após refresh)
onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchCurrentUser?.()
  }
  fetchConversationsForBadge()  // NOVO: Carrega conversas pro badge
  
  // NOVO: Polling simples pra atualizar badge (a cada 30s, ou visível)
  const interval = setInterval(fetchConversationsForBadge, 30000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchConversationsForBadge()  // Refresh quando volta à aba
  })
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', fetchConversationsForBadge)
  })
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
    // Refresh badge após criar (pode adicionar unread=0 na nova conv)
    fetchConversationsForBadge()
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
  position: relative;  /* NOVO: Pra posicionar badge */
}

.nav a:hover {
  text-decoration: underline;
}

/* NOVO: Estilo pro link Diretos */
.directs-link {
  color: white;
  text-decoration: none;
  position: relative;
}

.directs-link:hover {
  text-decoration: underline;
}

/* NOVO: Badge de notificação (bolinha vermelha) */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  min-width: 20px;  /* Pra números >9 */
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