<template>
  <div class="direct-view">
    <!-- Lista de Conversas (esquerda ou mobile full) -->
    <aside v-if="!currentConversation" class="conversations-list">
      <h2>Diretos</h2>
      <div v-if="conversations.length === 0" class="empty-state">
        <p>Nenhuma conversa ainda. Inicie uma no perfil!</p>
      </div>
      <div v-else class="conversations">
        <!-- FIX: v-for com filtro pra ignorar nulls + key safe -->
        <div
          v-for="conv in conversations.filter(conv => conv != null)"
          :key="conv?.id || 'unknown'"
          class="conversation-item"
          @click="openConversation(conv.id)"
          :class="{ active: currentConversationId === conv.id }"
        >
          <img
            :src="getOtherParticipant(conv).profile_picture || '/static/default-avatar.png'"
            :alt="getOtherParticipant(conv).username"
            class="avatar"
          />
          <div class="info">
            <p class="username">{{ getOtherParticipant(conv).username }}</p>
            <p v-if="conv.last_message" class="preview">
              {{ conv.last_message.content.substring(0, 30) }}...
            </p>
            <span v-else class="preview">Comece a conversa!</span>
          </div>
          <small class="timestamp">{{ formatTime(conv.updated_at) }}</small>
        </div>
      </div>
      <button @click="$router.push('/users')" class="new-dm-btn">Nova Mensagem</button>
    </aside>

    <!-- View da Conversa Específica (direita ou full em mobile) -->
    <main v-else class="conversation-chat">
      <header class="chat-header">
        <img
          :src="currentOtherParticipant.profile_picture || '/static/default-avatar.png'"
          :alt="currentOtherParticipant.username"
          class="avatar"
        />
        <h3>{{ currentOtherParticipant.username }}</h3>
        <button @click="backToList">← Voltar</button>
      </header>

      <div class="messages">
        <!-- FIX: v-for com filtro pra ignorar nulls + key safe -->
        <div
          v-for="msg in currentConversation.messages.filter(msg => msg != null)"
          :key="msg?.id || 'unknown-msg'"
          :class="['message', { 'sent': msg.author?.id === authStore.user?.id }]"
        >
          <div class="message-content">
            <strong>{{ msg.author?.username || 'Anônimo' }}:</strong>
            <p>{{ msg.content }}</p>
            <small>{{ formatTime(msg.created_at) }}</small>
          </div>
        </div>
      </div>

      <footer class="message-input">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Digite sua mensagem..."
          :disabled="sending"
        />
        <button @click="sendMessage" :disabled="!newMessage || sending">
          {{ sending ? 'Enviando...' : 'Enviar' }}
        </button>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const API_BASE = import.meta.env.VITE_API_BASE
const conversations = ref([])
const currentConversationId = ref(route.params.id) 
const currentConversation = ref(null)
const newMessage = ref('')
const sending = ref(false)
const loading = ref(false)

const headers = computed(() => ({ Authorization: `Bearer ${authStore.token}` }))

// Carrega lista de conversas
const fetchConversations = async () => {
  try {
    loading.value = true
    const res = await axios.get(`${API_BASE}conversations/`, { headers: headers.value })
    // FIX: Filtra nulls no array retornado da API
    conversations.value = (res.data || []).filter(conv => conv != null)
    loading.value = false
  } catch (err) {
    console.error('Erro ao carregar conversas:', err)
    if (err.response?.status === 401) router.push('/login')
    loading.value = false
  }
}

// NOVO: Fetch específico pra uma conv (se ID na rota, carrega só ela)
const fetchConversationById = async (convId) => {
  try {
    loading.value = true
    const res = await axios.get(`${API_BASE}conversations/${convId}/`, { headers: headers.value })
    const convData = res.data  // Assume convData não null
    if (!convData) {
      console.error('Resposta da API vazia pra conv')
      loading.value = false
      return
    }
    // FIX: Filtra nulls nas messages
    convData.messages = (convData.messages || []).filter(msg => msg != null)
    
    // Merge na lista ou set direto
    const existingIndex = conversations.value.findIndex(c => c.id === convId)
    if (existingIndex > -1) {
      conversations.value[existingIndex] = convData
    } else {
      conversations.value.push(convData)
    }
    currentConversation.value = convData
    currentConversationId.value = convId
    loading.value = false
  } catch (err) {
    console.error('Erro ao carregar conversa específica:', err)
    if (err.response?.status === 404) {
      console.error('Conversa não encontrada')  // Em vez de alert, pra não quebrar
      router.push('/directs')  // Volta pra lista
    } else if (err.response?.status === 401) router.push('/login')
    loading.value = false
  }
}

// Abre uma conversa específica (agora await-safe)
const openConversation = async (convId) => {
  const conv = conversations.value.find(c => c && c.id === convId)  // FIX: Check c != null
  if (conv) {
    // Já tem na lista — usa local
    currentConversation.value = conv
    currentConversationId.value = convId
    router.replace(`/directs/${convId}`)
  } else {
    // Não tem — fetch específica
    await fetchConversationById(convId)
  }
}

// Pega o outro participante (não o logado)
const getOtherParticipant = (conv) => {
  if (!conv || !conv.participants) return { username: 'Desconhecido', profile_picture: '' }
  return conv.participants.find(p => p.id !== authStore.user?.id) || { username: 'Desconhecido', profile_picture: '' }
}

// Computed pro outro user na conversa atual
const currentOtherParticipant = computed(() => getOtherParticipant(currentConversation.value))

// Envia mensagem
const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentConversation.value) return
  sending.value = true
  try {
    const res = await axios.post(
      `${API_BASE}conversations/${currentConversation.value.id}/send/`,
      { content: newMessage.value },
      { headers: headers.value }
    )
    // Atualiza a conversa local com a nova msg
    currentConversation.value = res.data
    newMessage.value = ''
    // Refresh lista pra atualizar last_message em outras views
    await fetchConversations()
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err)
    if (err.response?.status === 401) router.push('/login')
  } finally {
    sending.value = false
  }
}

// Volta pra lista
const backToList = () => {
  currentConversation.value = null
  router.push('/directs')
}

// Formata tempo (simples)
const formatTime = (timeStr) => {
  return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Monte: Carrega dados
onMounted(async () => {
  if (!authStore.token) router.push('/login')
  else {
    fetchConversations()
    if (route.params.id) openConversation(route.params.id)
  }
})
</script>


<!-- Estilos iguais ao anterior -->
<style scoped>
.direct-view { display: flex; height: 100vh; }
.conversations-list { width: 300px; border-right: 1px solid #ddd; overflow-y: auto; padding: 10px; }
.conversation-item { display: flex; align-items: center; padding: 10px; cursor: pointer; border-radius: 8px; }
.conversation-item:hover, .active { background: #f0f0f0; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; }
.info { flex: 1; }
.username { margin: 0; font-weight: bold; }
.preview { margin: 0; font-size: 0.9em; color: gray; }
.timestamp { font-size: 0.8em; color: gray; }
.empty-state { text-align: center; color: gray; padding: 20px; }
.new-dm-btn { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; margin-top: 10px; }

.conversation-chat { flex: 1; display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #ddd; background: #f8f9fa; }
.chat-header h3 { flex: 1; margin: 0; }
.messages { flex: 1; overflow-y: auto; padding: 10px; }
.message { margin-bottom: 10px; }
.message.sent { text-align: right; }
.message-content { display: inline-block; max-width: 70%; background: #e9ecef; padding: 8px; border-radius: 10px; }
.message-content p { margin: 0 0 5px 0; }
small { color: gray; font-size: 0.8em; }
.message-input { display: flex; padding: 10px; border-top: 1px solid #ddd; }
.message-input input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; margin-right: 10px; }
.message-input button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer; }
.message-input button:disabled { background: #ccc; cursor: not-allowed; }

/* Mobile: Lista full, chat em modal ou toggle */
@media (max-width: 768px) {
  .conversations-list { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
  .conversation-chat { margin-left: 0; }
}

/* NOVO: Loading na conv */
.loading-conv { text-align: center; padding: 20px; color: gray; }
</style>