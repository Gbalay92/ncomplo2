import { get, post } from './client.js'

export async function getMyQualifiers() {
  const res = await get('/bracket/qualifiers')
  if (!res.ok) throw new Error('Failed to fetch qualifiers')
  return res.json()
}

export async function getMyBracket() {
  const res = await get('/bracket')
  if (!res.ok) throw new Error('Failed to fetch bracket')
  return res.json()
}

export async function saveMyBracket(picks) {
  const res = await post('/bracket', { picks })
  if (!res.ok) throw new Error('Failed to save bracket')
  return res.json()
}
