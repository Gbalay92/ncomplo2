import { get, post } from './client.js'

export async function getAdminBracket() {
  const res = await get('/admin/bracket')
  if (!res.ok) throw new Error('Failed to load bracket')
  return res.json()
}

export async function saveMatchResult(matchId, homeGoals, awayGoals) {
  const res = await post(`/admin/matches/group/${matchId}/result`, {
    home_goals: homeGoals,
    away_goals: awayGoals,
  })
  if (!res.ok) throw new Error('Failed to save result')
  return res.json()
}

export async function saveKnockoutResult(slotId, homeGoals, awayGoals, winnerId = null) {
  const res = await post(`/admin/bracket/${slotId}/result`, {
    home_goals: homeGoals,
    away_goals: awayGoals,
    winner_id: winnerId,
  })
  if (!res.ok) throw new Error('Failed to save knockout result')
  return res.json()
}

export async function lockPredictions() {
  const res = await post('/admin/lock-predictions')
  if (!res.ok) throw new Error('Failed to lock predictions')
  return res.json()
}

export async function lockGroupStage() {
  const res = await post('/admin/lock-group-stage')
  if (!res.ok) throw new Error('Failed to lock group stage')
  return res.json()
}
