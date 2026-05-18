import { get } from './client.js'

export async function getTournamentSettings() {
  const res = await get('/tournament/settings')
  if (!res.ok) throw new Error('Failed to load tournament settings')
  return res.json()
}
