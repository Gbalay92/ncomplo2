import { get } from './client.js'

export async function getNextMatch() {
  const res = await get('/matches/next')
  if (!res.ok) throw new Error('Failed to fetch next match')
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
