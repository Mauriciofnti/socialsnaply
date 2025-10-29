import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import FeedView from '../views/FeedView.vue'
import ProfileView from '../views/ProfileView.vue'
import PostView from '../views/PostView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import UserListView from '@/views/UserListView.vue'
import RegisterView from '@/views/RegisterView.vue'
import EditPostView from '@/views/EditPostView.vue'

const routes = [
  { path: '/', redirect: '/feed' },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/edit-profile', component: EditProfileView, meta: { requiresAuth: true } },
  { path: '/users', component: UserListView, meta: { requiresAuth: true } },
  { path: '/feed', component: FeedView, meta: { requiresAuth: true } },
  { path: '/profile/:id', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/post/:id', component: PostView, meta: { requiresAuth: true } },  
  { path: '/post/:id/edit', component: EditPostView, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) next('/login')
  else next()
})

export default router