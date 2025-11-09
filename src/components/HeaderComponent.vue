<template>
  <header class="app-header">
    <div class="logo">
      <router-link to="/feed">SNAPLY</router-link>
    </div>
    
    <!-- Hamburger menu button para mobile -->
    <button v-if="isMobile && authStore.user" @click="toggleMobileMenu" class="hamburger-btn">
      ☰
    </button>
    
    <!-- Mobile menu dropdown -->
    <nav v-if="showMobileMenu && isMobile && authStore.user" class="mobile-nav">
      <router-link to="/feed" @click="toggleMobileMenu">Feed</router-link>
      <router-link to="/users" @click="toggleMobileMenu">Usuários</router-link>
      <router-link 
        :to="authStore.user?.id ? `/profile/${authStore.user.id}` : '/login'"
        @click="toggleMobileMenu"
      >
        Perfil
      </router-link>
      <router-link to="/edit-profile" @click="toggleMobileMenu">Editar Perfil</router-link>
      
      <!-- <router-link to="/directs" class="directs-link" @click="toggleMobileMenu">
        <span><img src="./icons/comment-solid.svg" width="30px" alt="" ></span>
        <div v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</div>
      </router-link> -->
      
      <!-- Botão Mensagem: Só se user logado e no contexto certo (ex: profile de outro user) -->
      <button 
        v-if="authStore.user?.id && targetUserId" 
        @click="startDM(targetUserId); toggleMobileMenu()"
        class="dm-btn"
      >
        Mensagem
      </button>
    </nav>
    
    <!-- Desktop nav -->
    <nav v-else-if="authStore.user" class="nav">
      <router-link to="/feed">Feed</router-link>
      <router-link to="/users">Usuários</router-link>
      <router-link 
        :to="authStore.user?.id ? `/profile/${authStore.user.id}` : '/login'"
      >
        Perfil
      </router-link>
      <router-link to="/edit-profile">Editar Perfil</router-link>
      
      <!-- <router-link to="/directs" class="directs-link">
        <span><img src="./icons/comment-solid.svg" width="30px" alt="" ></span>
        <div v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</div>
      </router-link> -->
      
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
import { computed, onMounted, ref, onUnmounted } from 'vue' 
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE
const headers = computed(() => ({ Authorization: `Bearer ${authStore.token}` }))

const props = defineProps({
  targetUserId: {
    type: Number,
    default: null
  }
})

const conversations = ref([])
const unreadCount = ref(0)

const isMobile = ref(window.innerWidth <= 768)  

const fetchConversationsForBadge = async () => {
  if (!authStore.token) return
  try {
    const res = await axios.get(`${API_BASE}conversations/`, { headers: headers.value })
    conversations.value = res.data
    
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

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

onMounted(() => {
  if (authStore.token && !authStore.user) {
    authStore.fetchCurrentUser?.()
  }
  fetchConversationsForBadge()
  
  const interval = setInterval(fetchConversationsForBadge, 30000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchConversationsForBadge()
  })
  
  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
    if (!isMobile.value) showMobileMenu.value = false  // Fecha menu no desktop
  }
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', fetchConversationsForBadge)
    window.removeEventListener('resize', handleResize)
  })
})

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
  background: var(--base-color);
  position: relative;
}

.logo a {
  font-size: 1.5em;
  font-weight: bold;
  color: #000;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav a {
  color: #000;
  text-decoration: none;
  position: relative;
}

.nav a:hover {
  text-decoration: underline;
}

.directs-link {
  color: white;
  text-decoration: none;
  position: relative;
}

.directs-link:hover {
  text-decoration: underline;
}

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
  min-width: 20px;
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

/* NOVO: Hamburger button */
.hamburger-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  display: none;  /* Hidden por default, mostrado no mobile */
}

/* NOVO: Mobile menu */
.mobile-nav {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #007bff;
  flex-direction: column;
  gap: 0;
  padding: 10px 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
}

.mobile-nav a,
.mobile-nav button {
  display: block;
  width: 100%;
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  border: none;
  background: none;
  text-align: left;
  font-size: 1em;
}

.mobile-nav a:hover,
.mobile-nav button:hover {
  background: rgba(255,255,255,0.1);
}

/* Mobile: Esconde desktop nav, mostra hamburger */
@media (max-width: 768px) {
  .hamburger-btn {
    display: block;
  }
  
  .nav {
    display: none;  /* Esconde nav desktop no mobile */
  }
  
  /* Ajusta logo se necessário */
  .logo {
    flex: 1;
  }
  
  /* Badge menor no mobile */
  .notification-badge {
    width: 16px;
    height: 16px;
    font-size: 0.7em;
    top: -3px;
    right: -8px;
  }
  
  /* Ícone menor no mobile */
  .directs-link img {
    width: 24px;
  }
  
  /* Para não logado: Stack vertical */
  .nav:not(.mobile-nav) {
    flex-direction: column;
    gap: 10px;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #007bff;
    padding: 10px;
  }
  
  .nav:not(.mobile-nav) a {
    display: block;
    width: 100%;
    text-align: center;
  }
}
</style>