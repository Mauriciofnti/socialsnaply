import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchFeed() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_BASE}posts/feed/`)
        this.posts = response.data
        console.log('Feed carregado:', this.posts)
      } catch (error) {
        console.error('Erro ao carregar feed:', error)
        this.error = error.response?.data?.detail || 'Erro ao carregar feed. Tenta de novo?'
      } finally {
        this.loading = false
      }
    },
    async createPost(content) {
      try {
        const response = await axios.post(`${API_BASE}posts/`, { content })
        this.posts.unshift(response.data) // Adiciona no topo do feed
      } catch (error) {
        console.error('Erro ao criar post:', error)
      }
    },
    async likePost(postId) {
      try {
        const response = await axios.post(`${API_BASE}posts/${postId}/like/`)
        const message = response.data.message
        // ← FIX: Toggle baseado no message do backend
        const post = this.posts.find(p => p.id === postId)
        if (post) {
          if (message === 'Curtiu!') {
            post.likes_count = (post.likes_count || 0) + 1
          } else if (message === 'Curtiu cancelada!') {
            post.likes_count = Math.max(0, (post.likes_count || 0) - 1)
          }
        }
        console.log('Like toggle:', message)
      } catch (error) {
        console.error('Erro ao curtir:', error)
      }
    }
  }
})