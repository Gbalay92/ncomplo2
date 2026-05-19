import { get, put } from './client.js'

export async function getMyPredictions() {
  const res = await get('/predictions')
  if (!res.ok) throw new Error('Failed to fetch predictions')
  return res.json()
}

export async function savePredictions(predictions) {
  const res = await put('/predictions/bulk', { predictions })
  if (!res.ok) throw new Error('Failed to save predictions')
  return res.json()
}
