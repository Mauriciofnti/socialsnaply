<template>
  <div class="edit-profile-container">
    <header>
      <button @click="$router.go(-1)">Cancelar</button>
      <h1>Editar Perfil</h1>
      <button @click="saveProfile" :disabled="saving">Salvar</button>
    </header>
    <div v-if="loading" class="loading">Carregando perfil...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <form v-else @submit.prevent="saveProfile" class="edit-form">
      <div class="field">
        <label for="profile-picture">Foto de Perfil (opcional):</label>
        <input 
          id="profile-picture" 
          ref="profilePictureInput" 
          type="file" 
          accept="image/*" 
          @change="onFileChange"
        />
        <small v-if="profilePictureUrl" class="preview">Preview: <img :src="profilePictureUrl" alt="Preview" style="max-width: 100px; max-height: 100px;" /></small>
      </div>        
      <div class="field">
        <label for="bio">Bio:</label>
        <textarea 
          id="bio"
          v-model="form.bio" 
          placeholder="Descreva-se em poucas palavras..." 
          maxlength="500"
          autocomplete="bio"
        ></textarea>
        <small>{{ form.bio.length }}/500</small>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ bio: '' })
const profilePictureInput = ref(null)
const profilePictureFile = ref(null)
const profilePictureUrl = ref('')
const loading = ref(true)
const error = ref('')
const saving = ref(false)

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
  try {
    const response = await axios.get(`${API_BASE}users/me/`)
    form.value.bio = response.data.bio || ''
    if (response.data.profile_picture) {
      profilePictureUrl.value = response.data.profile_picture
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err)
    if (err.response?.status === 401) {
      error.value = 'Sessão expirada. Faça login novamente.'
      authStore.logout()
      router.push('/login')
    } else {
      error.value = err.response?.data?.detail || 'Erro ao carregar perfil'
    }
  } finally {
    loading.value = false
  }
}

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    profilePictureFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => { profilePictureUrl.value = e.target.result }
    reader.readAsDataURL(file)
  } else {
    profilePictureFile.value = null
    profilePictureUrl.value = ''
  }
}

const saveProfile = async () => {
  saving.value = true
  error.value = ''
  const API_BASE = import.meta.env.VITE_API_BASE
  try {
    const formData = new FormData()
    formData.append('bio', form.value.bio.trim() || '')  
    if (profilePictureFile.value) {
      formData.append('profile_picture', profilePictureFile.value) 
    }
    
    // Debug: Log FormData contents
    console.log('Enviando FormData:', { bio: formData.get('bio'), hasFile: !!profilePictureFile.value })
    
    const response = await axios.patch(`${API_BASE}users/me/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    authStore.user = { ...authStore.user, ...response.data }
    profilePictureUrl.value = response.data.profile_picture || ''
    alert('Perfil atualizado com sucesso!')
    router.push(`/profile/${authStore.user.id}`)
  } catch (err) {
    console.error('Erro ao salvar:', err)
    console.log('Erro response:', err.response?.data)  
    if (err.response?.status === 401) {
      error.value = 'Sessão expirada. Faça login novamente.'
      authStore.logout()
      router.push('/login')
    } else if (err.response?.status === 400) {
      const backendError = err.response.data
      if (backendError.profile_picture) {
        error.value = backendError.profile_picture[0]
      } else if (backendError.bio) {
        error.value = backendError.bio[0]
      } else {
        error.value = backendError.detail || 'Erro de validação. Verifique os campos.'
      }
    } else {
      error.value = err.response?.data?.detail || 'Erro ao salvar perfil'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.edit-profile-container {
    max-width: 500px;
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

header button:last-child {
    background: #28a745;
}

header button:last-child:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.field {
    display: flex;
    flex-direction: column;
}

.field label {
    font-weight: bold;
    margin-bottom: 5px;
}

.field textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    min-height: 100px;
    resize: vertical;
}

.field small {
    color: #666;
    font-size: 0.9em;
}

.loading,
.error {
    text-align: center;
    padding: 40px;
    color: #666;
}

.error {
    color: red;
}
</style>