<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import MoreMenu from './MoreMenu.vue'

const route = useRoute()
const { t, locale } = useI18n()
const app = useAppStore()

const moreOpen = ref(false)

const navItems = [
  { name: 'results', to: '/', icon: '🏆', labelKey: 'nav_results' },
  { name: 'schedule', to: '/schedule', icon: '📅', labelKey: 'nav_schedule' },
  { name: 'live', to: '/live', icon: '📡', labelKey: 'nav_live' },
  { name: 'analyse', to: '/analyse', icon: '📊', labelKey: 'nav_analyse' },
]

const pageTitleKey = computed(() => route.meta.titleKey || 'title_results')
const themeIcon = computed(() => (app.theme === 'light' ? '☀️' : '🌙'))
const langIcon = computed(() => locale.value.toUpperCase())

function toggleMoreMenu(e) {
  e.stopPropagation()
  moreOpen.value = !moreOpen.value
}

function closeMoreMenu() {
  moreOpen.value = false
}

function isActive(name) {
  return route.meta.nav === name
}
</script>

<template>
  <header>
    <RouterLink
      class="brand"
      to="/"
      :title="t('tt_home')"
    >
      <div class="logo">🚣</div>
      <div class="brand-text">
        <h1>{{ t(pageTitleKey) }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </RouterLink>

    <nav class="header-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="nav-link"
        :class="{ active: isActive(item.name) }"
        :title="t(item.labelKey)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ t(item.labelKey) }}</span>
      </RouterLink>
    </nav>

    <div class="header-tools">
      <span class="refresh-status">
        <span class="refresh-dot on" />
        <span class="lbl-text">{{ t('refresh_label') }}</span>
      </span>
      <button
        type="button"
        class="hdr-btn hdr-btn--desktop-only"
        :class="{ on: app.notificationsOn }"
        :title="t('tt_notifs')"
        @click="app.toggleNotifications()"
      >
        <span class="hdr-icon">🔔</span>
        <span class="hdr-lbl">{{ t('hdr_notifs') }}</span>
      </button>
      <button
        type="button"
        class="hdr-btn hdr-btn--desktop-only"
        :title="t('tt_compare')"
      >
        <span class="hdr-icon">🔀</span>
        <span class="hdr-lbl">{{ t('hdr_compare') }}</span>
      </button>
      <button
        type="button"
        class="hdr-btn"
        :title="t('tt_theme')"
        @click="app.toggleTheme()"
      >
        <span class="hdr-icon">{{ themeIcon }}</span>
      </button>
      <button
        type="button"
        class="hdr-btn"
        :title="t('tt_lang')"
        @click="app.toggleLang()"
      >
        <span class="hdr-icon">{{ langIcon }}</span>
      </button>
      <button
        type="button"
        class="hdr-more"
        :title="t('tt_more')"
        @click="toggleMoreMenu"
      >
        ⋯
      </button>
    </div>

    <MoreMenu
      :open="moreOpen"
      @close="closeMoreMenu"
    />
  </header>
</template>
