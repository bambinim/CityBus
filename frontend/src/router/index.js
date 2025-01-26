import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/Login.vue'
import RegistrationView from '@/views/auth/Registration.vue'
import TemplateView from '@/views/TemplateView.vue'
import BusLineEditView from '@/views/line/BusLineEdit.vue'
import { useUserStore } from '@/stores/user'
import { UsersService } from '@/service/UsersService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/login', component: LoginView},
    {path: '/registration', component: RegistrationView},
    {path: '/home', component: TemplateView, meta: {requiresAuth: true}},
    {path: '/buslineedit', component:BusLineEditView, meta: {requiresAuth: true, restrictTo: ['admin']}}
  ],
})

router.beforeEach(async (to, from, next) => {
  if (!to.meta.requiresAuth) {
    next();
    return;
  }
  const userStore = useUserStore();
  if (!userStore.authenticated) {
    try {
      const user = await UsersService.me()
      userStore.setUserInfo(user)
    } catch {
      next('/login');
      return;
    }
  }
  if (to.meta.restrictTo && !to.meta.restrictTo.includes(userStore.role)) {
    next('/home')
  }
  next();
});

export default router
