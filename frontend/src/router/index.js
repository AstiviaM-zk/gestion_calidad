import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/dashboard/overview'
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard/overview'
      },
      {
        path: 'overview',
        name: 'dashboard-overview',
        component: () => import('../views/DashboardOverviewView.vue')
      },
      {
        path: 'documents',
        name: 'dashboard-documents',
        component: () => import('../components/DocumentManager.vue')
      },
      {
        path: 'users',
        name: 'dashboard-users',
        component: () => import('../components/UserList.vue')
      },
      {
        path: 'roles',
        name: 'dashboard-roles',
        component: () => import('../components/RoleManager.vue')
      },
      {
        path: 'profile',
        name: 'dashboard-profile',
        component: () => import('../components/UserProfile.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard/overview'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de navegación global
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard/overview');
  } else {
    next();
  }
});

export default router;
