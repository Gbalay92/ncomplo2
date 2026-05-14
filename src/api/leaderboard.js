import { get } from './client.js'

export async function getLeaderboard() {
  const res = await get('/leaderboard')
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}
