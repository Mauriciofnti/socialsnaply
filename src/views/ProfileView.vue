<template>
  <div class="profile-container">
    <header>
      <button @click="$router.go(-1)">Voltar</button>
      <h1>Perfil</h1>
    </header>
    <div v-if="loading" class="loading">Carregando perfil...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!user" class="not-found">
      Usuário não encontrado!
    </div>
    <div v-else class="profile">
      <div class="profile-header">
        <img 
          v-if="user.profile_picture" 
          :src="user.profile_picture" 
          alt="Foto de Perfil" 
          class="profile-img" 
          @error="handleImgError"
        />
        <img 
          v-else 
          src="/static/default-avatar.png" 
          alt="Avatar Padrão" 
          class="profile-img" 
        />
        <h2>{{ user.username }}</h2>
        <p class="bio">{{ user.bio || 'Sem bio definida' }}</p>
        <div class="stats">
          <span>{{ userPosts.length }} posts</span>
          <span>{{ user.followers_count || 0 }} seguidores</span>
          <span>{{ user.following_count || 0 }} seguindo</span>
        </div>
        
        <!-- NOVO: Botão Follow + DM (só pra outros users) -->
        <div v-if="user.id !== authStore.user?.id" class="profile-actions">
          <button 
            @click="toggleFollowUser" 
            :class="['follow-btn', { 'unfollow': isFollowing }]">
            {{ isFollowing ? 'Deixar de seguir' : 'Seguir' }}
          </button>
          <button @click="startDM(user.id)" class="dm-btn">Mensagem</button>
        </div>
        <!-- FIM NOVO -->
        
        <!-- Próprio perfil: Sem botões de ação -->
        <div v-else class="profile-actions">
          <router-link to="/edit-profile" class="edit-profile-btn">Editar Perfil</router-link>
        </div>
      </div>
      <div v-if="userPosts.length === 0" class="empty-posts">
        Nenhum post ainda.
      </div>
      <div v-else class="posts-list">
        <div v-for="post in userPosts" :key="post.id" class="post-card">
          <div class="post-header">
            <h3>{{ post.author?.username || user.username }}</h3>
            <small>{{ formatDate(post.created_at) }}</small>
          </div>
          <p class="post-content">{{ post.content }}</p>
          <div class="post-actions">
            <button @click="likePost(post.id)" class="like-btn">❤️ {{ post.likes_count || 0 }}</button>
            <button @click="$router.push(`/post/${post.id}`)" class="comment-btn">💬 {{ getCommentsCount(post) }}</button>
            <template v-if="post.author?.id === authStore.user?.id">
              <button @click="$router.push(`/post/${post.id}/edit`)" class="edit-btn">Editar</button>
              <button @click="deletePost(post.id)" class="delete-btn">Deletar</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostsStore } from '@/stores/posts'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const userId = route.params.id
const user = ref(null)
const userPosts = ref([])
const loading = ref(true)
const error = ref('')
const isFollowing = ref(false)

const handleImgError = (e) => {
  e.target.src = '/static/default-avatar.png'
}

onMounted(async () => {
  if (!authStore.token) {
    router.push('/login')
    return
  }
  await authStore.restoreAuth()
  await loadProfile()
})

const loadProfile = async () => {
  loading.value = true
  error.value = ''
  const API_BASE = import.meta.env.VITE_API_BASE
  const headers = { Authorization: `Bearer ${authStore.token}` }
  try {
    const [userRes, postsRes] = await Promise.all([
      axios.get(`${API_BASE}users/${userId}/`, { headers }),
      axios.get(`${API_BASE}posts/?author=${userId}`, { headers })
    ])
    user.value = userRes.data
    userPosts.value = postsRes.data
    if (!authStore.user?.following_count) {
      authStore.user.following_count = 0
    }
    if (user.value.id === authStore.user?.id) {
      authStore.user.following_count = user.value.following_count || 0
    }
    if (user.value.id !== authStore.user?.id && authStore.user) {
      try {
        const statusRes = await axios.get(`${API_BASE}users/${userId}/is_following/`, { headers })
        isFollowing.value = statusRes.data.is_following
      } catch (statusErr) {
        console.warn('Erro ao checar follow status:', statusErr)
        isFollowing.value = false
      }
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err)
    if (err.response?.status === 401) {
      error.value = 'Sessão expirada. Faça login novamente.'
      authStore.logout()
      router.push('/login')
    } else if (err.response?.status === 404) {
      error.value = 'Usuário não encontrado'
    } else {
      error.value = err.response?.data?.detail || 'Erro ao carregar perfil'
    }
  } finally {
    loading.value = false
  }
}

const toggleFollowUser = async () => {
  const previousIsFollowing = isFollowing.value
  const API_BASE = import.meta.env.VITE_API_BASE
  const headers = { Authorization: `Bearer ${authStore.token}` }
  try {
    const response = await axios.post(`${API_BASE}users/${userId}/toggle_follow/`, {}, { headers })
    console.log('Response toggle:', response.data)
    isFollowing.value = response.data.is_following

    // 1. Atualiza seguidores (do perfil visitado - Alvo)
    user.value.followers_count = response.data.followers_count

    // 2. Atualiza 'seguindo' do usuário logado no Store
    if (authStore.user) {
      // O views.py corrigido retorna a contagem do usuário logado em 'following_count'
      const newFollowingCount = response.data.following_count
      authStore.user.following_count = newFollowingCount
      
      // 3. Se for o próprio perfil, sincroniza o campo 'following_count' local (user.value)
      if (user.value.id === authStore.user.id) {
          user.value.following_count = newFollowingCount
      }
    }

    console.log('Novo status botão:', isFollowing.value)
  } catch (err) {
    console.error('Erro no toggle follow:', err)
    // Reverte o estado local em caso de erro
    isFollowing.value = previousIsFollowing
    if (err.response?.status === 400) {
      alert(err.response.data.error || 'Erro ao alterar follow')
    } else {
      alert('Erro ao alterar follow')
    }
  }
}

// NOVO: Handler pra iniciar DM
const startDM = async (targetUserId) => {
  if (!targetUserId || targetUserId === authStore.user?.id) {
    alert('Não pode enviar mensagem pra si mesmo!')
    return
  }
  const API_BASE = import.meta.env.VITE_API_BASE
  const headers = { Authorization: `Bearer ${authStore.token}` }
  try {
    const res = await axios.post(`${API_BASE}conversations/create/${targetUserId}/`, {}, { headers })
    console.log('DM iniciada:', res.data)
    router.push(`/directs/${res.data.id}`)
  } catch (err) {
    console.error('Erro ao iniciar DM:', err)
    if (err.response?.status === 400) {
      alert(err.response.data.error || 'Erro ao iniciar conversa')
    } else if (err.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    } else {
      alert('Erro ao iniciar conversa. Tente novamente.')
    }
  }
}
// FIM NOVO

// Like toggle local pra userPosts (similar ao store)
const likePost = async (id) => {
  const headers = { Authorization: `Bearer ${authStore.token}` }
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE}posts/${id}/like/`, {}, { headers })
    const message = response.data.message
    const post = userPosts.value.find(p => p.id === id)
    if (post) {
      if (message === 'Curtiu!') {
        post.likes_count = (post.likes_count || 0) + 1
      } else if (message === 'Curtiu cancelada!') {
        post.likes_count = Math.max(0, (post.likes_count || 0) - 1)
      }
    }
    console.log('Like toggle no profile:', message)
  } catch (error) {
    console.error('Erro ao curtir no profile:', error)
  }
}

const deletePost = async (id) => {
  if (!confirm('Tem certeza que quer deletar este post?')) return
  const API_BASE = import.meta.env.VITE_API_BASE
  const headers = { Authorization: `Bearer ${authStore.token}` }
  try {
    await axios.delete(`${API_BASE}posts/${id}/`, { headers })
    // Remove do array local
    userPosts.value = userPosts.value.filter(p => p.id !== id)
    alert('Post deletado com sucesso!')
  } catch (err) {
    console.error('Erro ao deletar post:', err)
    if (err.response?.status === 403) {
      alert('Você só pode deletar seus próprios posts')
    } else if (err.response?.status === 404) {
      alert('Post não encontrado')
    } else {
      alert('Erro ao deletar post. Tente novamente.')
    }
  }
}

const getCommentsCount = (post) => {
  return post.comments ? post.comments.length : 0;
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR')
</script>

<style scoped>
.profile-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.edit-btn {
  background: #ffc107
}

.delete-btn {
  background: #dc3545;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.profile-header {
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.bio {
  font-style: italic;
  color: #666;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
}

.follow-btn {
  background: #28a745;
}

.follow-btn.unfollow {
  background: #dc3545;
}

/* NOVO: Estilos pros botões de ação */
.profile-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.dm-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-profile-btn {
  background: #ffc107;
  color: #000;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
}

/* FIM NOVO */

/* Vermelho pra unfollow */
.post-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.loading,
.error,
.not-found,
.empty-posts {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: red;
}
</style>