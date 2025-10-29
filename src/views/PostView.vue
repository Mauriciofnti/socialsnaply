<template>
  <div class="post-detail-container">
    <button @click="$router.go(-1)">Voltar</button>
    <div v-if="loading" class="loading">Carregando post...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!post" class="not-found">Post não encontrado!</div>
    <div v-else class="post-detail">
      <div class="post-header">
        <h2>{{ post.author.username }}</h2>
        <p class="post-content">{{ post.content }}</p>
        <small>{{ formatDate(post.created_at) }}</small>
      </div>
      <div class="post-actions">
        <button @click="likePost" class="like-btn">❤️ {{ post.likes_count || 0 }}</button>
        <template v-if="post.author.id === authStore.user.id">
          <button @click="$router.push(`/post/${post.id}/edit`)" class="edit-btn">Editar</button>
          <button @click="deletePost(post.id)" class="delete-btn">Deletar</button>
        </template>
      </div>
      <h3>Comentários ({{ comments.length }})</h3>
      <div v-if="comments.length === 0" class="empty-comments">Nenhum comentário ainda. Seja o primeiro!</div>
      <div v-else class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <strong>{{ comment.author.username }}:</strong> {{ comment.content }}
          <small>{{ formatDate(comment.created_at) }}</small>
        </div>
      </div>
      <form @submit.prevent="addComment" class="comment-form">
        <textarea v-model="newComment" placeholder="Adicione um comentário..." required></textarea>
        <button type="submit" :disabled="submitting">Comentar</button>
      </form>
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

const postId = route.params.id
const post = ref(null)
const comments = ref([])
const loading = ref(true)
const error = ref('')
const newComment = ref('')
const submitting = ref(false)

onMounted(async () => {
  if (!authStore.token) {
    router.push('/login')
    return
  }
  await authStore.restoreAuth()
  await loadPost()
})

const loadPost = async () => {
  loading.value = true
  error.value = ''
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/'
  try {
    const [postRes, commentsRes] = await Promise.all([
      axios.get(`${API_BASE}posts/${postId}/`),
      axios.get(`${API_BASE}posts/${postId}/comments/`)
    ])
    post.value = postRes.data
    comments.value = commentsRes.data
  } catch (err) {
    console.error('Erro ao carregar post:', err)
    error.value = err.response?.data?.detail || 'Erro ao carregar post'
    if (err.response?.status === 404) error.value = 'Post não encontrado'
    if (err.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const likePost = () => postsStore.likePost(postId)

const addComment = async () => {
  if (!newComment.value.trim()) return
  submitting.value = true
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/'
  try {
    const response = await axios.post(`${API_BASE}posts/${postId}/comments/`, {
      content: newComment.value
    })
    comments.value.push(response.data)
    newComment.value = ''
  } catch (err) {
    console.error('Erro ao comentar:', err)
    alert('Erro ao adicionar comentário')
  } finally {
    submitting.value = false
  }
}

const deletePost = async (id) => {
  if (!confirm('Tem certeza que quer deletar este post?')) return
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/'
  try {
    await axios.delete(`${API_BASE}posts/${id}/`)
    alert('Post deletado!')
    router.push('/feed')
  } catch (err) {
    console.error('Erro ao deletar:', err)
    alert('Erro ao deletar post')
  }
}

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('pt-BR')
</script>

<style scoped>
.edit-btn { background: #ffc107}
.post-detail-container { max-width: 600px; margin: 0 auto; padding: 20px; }
button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; }
.post-header { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
.post-content { font-size: 1.2em; line-height: 1.4; }
.post-actions { display: flex; gap: 10px; margin: 10px 0; }
.like-btn { background: none; border: none; font-size: 1.2em; cursor: pointer; }
.comments-list { margin: 20px 0; }
.comment-item { border-left: 2px solid #ccc; padding-left: 10px; margin: 10px 0; }
.comment-form textarea { width: 100%; min-height: 60px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; }
.comment-form button { background: #28a745; color: white; border: none; padding: 10px; margin-top: 10px; cursor: pointer; }
.loading, .error, .not-found, .empty-comments { text-align: center; padding: 40px; color: #666; }
.error { color: red; }
</style>