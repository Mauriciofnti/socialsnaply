<template>
  <div class="user-list-container">
    <header>
      <h1>Usuários</h1>
      <button @click="$router.push('/feed')">Feed</button>
    </header>
    <div v-if="loading" class="loading">Carregando usuários...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="users.length === 0" class="empty">Nenhum usuário encontrado.</div>
    <div v-else class="users-list">
      <router-link v-for="u in users" :key="u.id" :to="`/profile/${u.id}`" class="user-item">
          <img 
          v-if="u.profile_picture" 
          :src="u.profile_picture" 
          alt="Foto de {{ u.username }}" 
          class="user-img" 
          @error="handleImgError"
          />
          <img 
          v-else 
          src="/static/default-avatar.png" 
          alt="Avatar Padrão" 
          class="user-img" 
          />
        <h3>{{ u.username }}</h3>
        <!-- <p>{{ u.bio || 'Sem bio' }}</p> -->
        <small>{{ u.email }}</small>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const users = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!authStore.token) {
    router.push('/login')
    return
  }
  await loadUsers()
})

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  const API_BASE = import.meta.env.VITE_API_BASE
  try {
    const response = await axios.get(`${API_BASE}users/`)
    users.value = response.data
  } catch (err) {
    console.error('Erro ao carregar usuários:', err)
    error.value = err.response?.data?.detail || 'Erro ao carregar usuários'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.user-item {
    display: flex;
    gap: 10px;
    flex-direction: column;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.user-item:hover {
  background-color: #d7dd91;
  transition: all .5s ease;
}

.user-img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
}

.user-link div {
    flex: 1;
}

.user-list-container {
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

.users-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.user-link h3 {
    margin: 0 0 5px 0;
}

.user-link p {
    margin: 0 0 5px 0;
    color: #666;
}

.user-link small {
    color: #999;
}

.loading,
.error,
.empty {
    text-align: center;
    padding: 40px;
    color: #666;
}

.error {
    color: red;
}
</style>