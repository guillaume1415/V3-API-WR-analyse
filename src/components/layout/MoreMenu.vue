<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { fmtRelative } from '@/lib/format'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const route = useRoute()
const { t } = useI18n()
const app = useAppStore()

const menuRef = ref(null)

const favInfo = computed(() =>
  app.favoriteNation
    ? t('menu_fav', { nation: app.favoriteNation })
    : t('menu_no_fav'),
)

const refreshInfo = computed(() => {
  if (route.meta.liveMenu) {
    if (app.lastRefreshAt) {
      return t('menu_status_live', { when: fmtRelative(app.lastRefreshAt, t) })
    }
    return t('menu_status_idle')
  }
  if (app.lastRefreshAt) {
    return t('menu_refresh_last', { when: fmtRelative(app.lastRefreshAt, t) })
  }
  return t('menu_refresh_active')
})

function onNotifClick() {
  app.toggleNotifications()
}

function onCompareClick() {
  app.toggleCompare()
  emit('close')
}

function onDocumentClick(e) {
  if (!props.open) return
  if (menuRef.value?.contains(e.target)) return
  emit('close')
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <div
    ref="menuRef"
    class="more-menu"
    :class="{ open }"
  >
    <button
      type="button"
      :class="{ on: app.notificationsOn }"
      @click="onNotifClick"
    >
      <span>🔔</span>
      <span>{{ t('menu_notifs') }}</span>
      <span class="menu-state">{{ app.notificationsOn ? 'ON' : 'OFF' }}</span>
    </button>
    <button
      type="button"
      @click="onCompareClick"
    >
      <span>🔀</span>
      <span>{{ t('menu_compare') }}</span>
    </button>
    <hr class="menu-sep">
    <div class="menu-info">{{ favInfo }}</div>
    <hr class="menu-sep">
    <div class="menu-info">{{ refreshInfo }}</div>
  </div>
</template>
