import { post } from './client.js'

export async function saveMatchResult(matchId, homeGoals, awayGoals) {
  const res = await post(`/admin/matches/group/${matchId}/result`, {
    home_goals: homeGoals,
    away_goals: awayGoals,
  })
  if (!res.ok) throw new Error('Failed to save result')
  return res.json()
}

export async function lockGroupStage() {
  const res = await post('/admin/lock-group-stage')
  if (!res.ok) throw new Error('Failed to lock group stage')
  return res.json()
}
