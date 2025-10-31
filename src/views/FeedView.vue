<template>
  <div class="feed-container">
    <header>
      <h1>Feed</h1>
      <p v-if="authStore.user">Bem-vindo, {{ authStore.user.username }}!</p>
    </header>
    <div v-if="authStore.loading" class="loading">Entrando...</div>
    <div v-else-if="!authStore.token">
      <p>Faça login pra ver o feed!</p>
      <router-link to="/login">Ir pro Login</router-link>
    </div>
    <div v-else>
      <form @submit.prevent="createPost" class="new-post-form">
        <textarea v-model="newPostContent" placeholder="O que você está pensando hoje?" required></textarea>
        <button type="submit" :disabled="postsStore.loading">Postar</button>
      </form>

      <div v-if="postsStore.loading" class="loading">Carregando posts...</div>
      <div v-else-if="postsStore.error" class="error">{{ postsStore.error }}</div>
      <div v-else-if="postsStore.posts.length === 0" class="empty-feed">
        Nenhum post ainda. Siga usuários ou poste algo!
        <button @click="createPost" :disabled="!newPostContent">Postar algo</button>
      </div>
      <div v-else class="posts-list">
        <button v-for="post in postsStore.posts" :key="post.id" @click="$router.push(`/post/${post.id}`)" class="post-card">
          <router-link :to="`/profile/${post.author?.id || post.id}`" class="profile-link">
            <div class="post-header">
              <img 
                v-if="post.author?.profile_picture" 
                :src="post.author.profile_picture" 
                alt="Foto do Author" 
                class="author-img" 
                @error="handleImgError"
              />
              <img 
                v-else 
                src="/static/default-avatar.png" 
                alt="Avatar Padrão" 
                class="author-img" 
              />
              <h3>{{ post.author?.username || 'Usuário desconhecido' }}</h3>
              <small>{{ formatDate(post.created_at) }}</small>
            </div>
          </router-link>

            <p class="post-content">{{ post.content }}</p>
            <div class="post-actions">
              <button @click="likePost(post.id)" class="like-btn"> ❤️ {{ post.likes_count || 0 }}</button>
              <button @click="$router.push(`/post/${post.id}`)" class="comment-btn">💬 ({{ getCommentsCount(post) }}) Comentar</button>
              
              <template v-if="post.author?.id === authStore.user?.id">
              <div class="userPost">
                <button @click="$router.push(`/post/${post.id}/edit`)" class="edit-btn">Editar</button>
                <button @click="deletePost(post.id)" class="delete-btn">Deletar</button>
              </div>
              </template>
            </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()
const newPostContent = ref('')

onMounted(async () => {
  if (!authStore.token) {
    router.push('/login')
    return
  }
  await postsStore.fetchFeed()
})

const createPost = async () => {
  if (!newPostContent.value.trim()) return
  await postsStore.createPost(newPostContent.value)
  newPostContent.value = ''
}

const likePost = (id) => postsStore.likePost(id)

const deletePost = async (id) => {
  if (!confirm('Tem certeza que quer deletar este post?')) return
  const API_BASE = import.meta.env.VITE_API_BASE
  try {
    await axios.delete(`${API_BASE}posts/${id}/`)
    postsStore.posts = postsStore.posts.filter(p => p.id !== id)
    alert('Post deletado!')
  } catch (err) {
    console.error('Erro ao deletar:', err)
    alert('Erro ao deletar post')
  }
}

const getCommentsCount = (post) => {
  return post.comments ? post.comments.length : 0;
};

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR')
</script>

<style scoped>
@import './src/assets/main.css';
.userPost{
  display: flex;
  gap: 5px;
}
.post-header {
    display: flex;
    align-items: center;
    gap: 10px;
}

.author-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.edit-btn {
    background: #ffc107;
    color: black;
}

.delete-btn {
    background: #dc3545;
    color: white;
}

.post-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.error {
    color: red;
    text-align: center;
    padding: 20px;
}

.warning {
    color: orange;
    font-style: italic;
}

.feed-container {
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

.new-post-form textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
}

.new-post-form button {
    background: #28a745;
    color: white;
    border: none;
    padding: 10px;
    margin-top: 10px;
    cursor: pointer;
}

.post-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 15px;
    padding: 15px;
    width: 100%;
}

.post-header {
    display: flex;
    align-items: center;
    border-radius: 5px;
    box-shadow: .1px .1px #000;
}

.post-content {
    margin: 10px 0;
    line-height: 1.4;
    
}

.post-actions {
    display: flex;
    gap: 10px;
}

button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1em;
}

.like-btn:hover {
    color: red;
}

.profile-link {
    margin-left: auto;
    text-decoration: none;
    color: #007bff;
    display: block;
}

.loading,
.empty-feed {
    text-align: center;
    padding: 40px;
    color: #666;
}
</style>