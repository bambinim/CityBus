import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/Login.vue'
import RegistrationView from '@/views/auth/Registration.vue'
import TemplateView from '@/views/TemplateView.vue'
import BusLineEditView from '@/views/line/BusLineEdit.vue'
import DeparturesView from '@/views/departures/Departures.vue'
import BusLinesTableView from '@/views/line/BusLinesTable.vue'
import RidesMap from '@/views/RidesMap.vue'
import { useUserStore } from '@/stores/user'
import { UsersService } from '@/service/UsersService'
import Navigation from '@/views/navigation/Navigation.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/', component: Navigation, meta: {requiresAuth: true}},
    {path: '/login', component: LoginView},
    {path: '/registration', component: RegistrationView},
    {path: '/home', component: TemplateView, meta: {requiresAuth: true}},
    {path: '/line/new', component:BusLineEditView, meta: {requiresAuth: true, restrictTo: ['admin']}},
    {path: '/line/edit/:id', component:BusLineEditView, meta: {requiresAuth: true, restrictTo: ['admin']}},
    {path: '/lines/view', component: BusLinesTableView, meta: {requiresAuth: true, restrictTo: ['admin']}},
    {path: '/departures', component: DeparturesView, meta: {requiresAuth: true}},
    {path: '/rides-map', component: RidesMap, meta: {requiresAuth: true, restrictTo: ['admin']}}
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
