import { api } from './client'

/** Replay tracker (analyse.html) */
export async function fetchTrackerReplay(raceId) {
  const d = await api(`/livetracker/${raceId}`)
  return d.data
}

/** Live ou replay selon le type (live.html) */
export async function fetchTracker(raceId, trackerType) {
  const path = `/livetracker/${trackerType === 'Live' ? 'live/' : ''}${raceId}`
  const d = await api(path)
  return d.data
}
