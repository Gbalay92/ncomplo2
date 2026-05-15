import { get, put } from './client.js'

export async function getMyPredictions() {
  const res = await get('/predictions')
  if (!res.ok) throw new Error('Failed to fetch predictions')
  return res.json()
}

export async function savePrediction(matchId, predHomeGoals, predAwayGoals) {
  const res = await put('/predictions', {
    match_id: matchId,
    pred_home_goals: predHomeGoals,
    pred_away_goals: predAwayGoals,
  })
  if (!res.ok) throw new Error('Failed to save prediction')
  return res.json()
}
