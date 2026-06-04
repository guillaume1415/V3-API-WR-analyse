import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'results',
      component: () => import('@/views/ResultsView.vue'),
      meta: {
        titleKey: 'title_results',
        subtitleKey: 'subtitle',
        welcomeKey: 'welcome_results',
        nav: 'results',
        refreshKey: 'refresh_label',
        refreshTitleKey: 'tt_refresh',
      },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('@/views/ScheduleView.vue'),
      meta: {
        titleKey: 'title_schedule',
        subtitleKey: 'subtitle',
        welcomeKey: 'welcome_schedule',
        nav: 'schedule',
        refreshKey: 'refresh_label',
        refreshTitleKey: 'tt_refresh',
      },
    },
    {
      path: '/live',
      name: 'live',
      component: () => import('@/views/LiveView.vue'),
      meta: {
        titleKey: 'title_live',
        subtitleKey: 'subtitle',
        welcomeKey: 'welcome_live',
        nav: 'live',
        refreshKey: 'status_ready',
        refreshTitleKey: 'tt_refresh',
        liveMenu: true,
      },
    },
    {
      path: '/analyse',
      name: 'analyse',
      component: () => import('@/views/AnalyseView.vue'),
      meta: {
        titleKey: 'title_analyse',
        subtitleKey: 'subtitle_analyse',
        welcomeKey: 'welcome_analyse',
        nav: 'analyse',
        refreshKey: 'status_ready',
        refreshTitleKey: 'tt_status',
      },
    },
  ],
})

export default router
