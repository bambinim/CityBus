import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/Login.vue'
import RegistrationView from '@/views/auth/Registration.vue'
import TemplateView from '@/views/TemplateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/login', component: LoginView},
    {path: '/registration', component: RegistrationView},
    {path: '/template', component: TemplateView}
  ],
})

export default router
