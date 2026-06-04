import { getUseProxy, setUseProxy } from '@/services/storage'

export const API_DIRECT = 'https://world-rowing-api.soticcloud.net/stats/api'
export const API_PROXY = 'http://127.0.0.1:8765/stats/api'

export function getBase() {
  return getUseProxy() ? API_PROXY : API_DIRECT
}

export function useProxy() {
  return getUseProxy()
}

export function toggleProxy() {
  setUseProxy(!getUseProxy())
}

export function buildUrl(path, params = {}) {
  const parts = []
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  }
  return getBase() + path + (parts.length ? `?${parts.join('&')}` : '')
}

export async function apiFetch(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function api(path) {
  return apiFetch(getBase() + path)
}
