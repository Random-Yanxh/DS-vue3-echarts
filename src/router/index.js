import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // {
    // path: '/about',
    // name: 'about',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () => import('../views/AboutView.vue')
    // },
    {
      path: '/indicators',
      name: 'indicators',
      component: () => import('../views/IndicatorsView/index.vue')
    },
    {
      path: '/graph',
      name: 'graph',
      component: () => import('../views/GraphView/index.vue')
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView/index.vue')
    },
    {
      path: '/control',
      name: 'control',
      component: () => import('../views/ControlView/index.vue')
    },
    {
      path: '/epie',
      name: 'epie',
      component: () => import('../views/EPieView/index.vue')
    },
    {
      path: '/aichat',
      name: 'aichat',
      component: () => import('../views/AichatView/index.vue')
    },
  ]
})

export default router
