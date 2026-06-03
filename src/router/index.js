import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
      meta: { titleKey: 'title_results', nav: 'results' },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/views/ScheduleView.vue'),
      meta: { titleKey: 'title_schedule', nav: 'schedule' },
    },
    {
      path: '/live',
      name: 'live',
      component: () => import('@/views/LiveView.vue'),
      meta: { titleKey: 'title_live', nav: 'live' },
    },
    {
      path: '/analyse',
      name: 'analyse',
      component: () => import('@/views/AnalyseView.vue'),
      meta: { titleKey: 'title_analyse', nav: 'analyse' },
    },
  ],
})

export default router
