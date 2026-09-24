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
        path: 'departments',
        name: 'dashboard-departments',
        component: () => import('../components/departments/DepartmentManager.vue'),
        meta: { requiredPermission: 'departments:read' }
      },
      {
        path: 'documents',
        name: 'dashboard-documents',
        component: () => import('../components/DocumentManager.vue'),
        meta: { requiredPermission: 'templates:read' }
      },
      {
        path: 'users',
        name: 'dashboard-users',
        component: () => import('../components/UserList.vue'),
        meta: { requiredPermission: 'users:read' }
      },
      {
        path: 'roles',
        name: 'dashboard-roles',
        component: () => import('../components/RoleManager.vue'),
        meta: { requiredPermission: 'roles:read' }
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

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    return next('/login');
  } 
  
  if (to.matched.some(record => record.meta.requiresGuest) && isAuthenticated) {
    return next('/dashboard/overview');
  }

  // Validación de acceso por permiso a nivel de ruta
  const permissionProtected = to.matched.find(record => record.meta && record.meta.requiredPermission);
  if (permissionProtected && !authStore.hasPermission(permissionProtected.meta.requiredPermission)) {
    return next('/dashboard/overview');
  }

  // Validación de acceso por rol a nivel de ruta
  const roleProtected = to.matched.find(record => record.meta && record.meta.allowedRoles);
  if (roleProtected && !authStore.hasRole(roleProtected.meta.allowedRoles)) {
    return next('/dashboard/overview');
  }

  next();
});

export default router;
