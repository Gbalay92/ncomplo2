import { get } from './client.js'

export async function getNextMatch() {
  const res = await get('/matches/next')
  if (!res.ok) throw new Error('Failed to fetch next match')
  return res.json()
}

export async function getTodayMatches() {
  const now = new Date()
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const localMidnightNext = new Date(localMidnight.getTime() + 86400000)
  const params = new URLSearchParams({
    from: localMidnight.toISOString(),
    to: localMidnightNext.toISOString(),
  })
  const res = await get(`/matches/today?${params}`)
  if (!res.ok) throw new Error('Failed to fetch today matches')
  return res.json()
}

export async function getMatches(group, phase = 'group') {
  const params = new URLSearchParams()
  if (group) params.set('group', group)
  params.set('phase', phase)
  const res = await get(`/matches?${params}`)
  if (!res.ok) throw new Error('Failed to fetch matches')
  return res.json()
}
