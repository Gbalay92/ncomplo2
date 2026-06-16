import { get } from './client.js'

export async function getUserTodayPredictions(userId) {
  const now = new Date()
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const localMidnightNext = new Date(localMidnight.getTime() + 86400000)
  const params = new URLSearchParams({
    from: localMidnight.toISOString(),
    to: localMidnightNext.toISOString(),
  })
  const res = await get(`/users/${userId}/predictions/today?${params}`)
  if (res.status === 403) return null
  if (!res.ok) throw new Error('Failed to fetch predictions')
  return res.json()
}

export async function getUserPredictions(userId) {
  const res = await get(`/users/${userId}/predictions`)
  if (res.status === 403) return null
  if (!res.ok) throw new Error('Failed to fetch predictions')
  return res.json()
}

export async function getUserBracket(userId) {
  const res = await get(`/users/${userId}/bracket`)
  if (res.status === 403) return null
  if (!res.ok) throw new Error('Failed to fetch bracket')
  return res.json()
}
