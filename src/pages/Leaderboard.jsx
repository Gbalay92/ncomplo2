import { useState, useEffect } from 'react'
import styles from './Leaderboard.module.css'
import { getLeaderboard } from '../api/leaderboard.js'
import { getMatches } from '../api/matches.js'
import { getTournamentSettings } from '../api/tournament.js'
import { UserLeaderboardCard } from '../components/UserLeaderboardCard'
import { Podium } from '../components/Podium'
import { PredictionsModal } from '../components/PredictionsModal'
import { currentKnockoutStage } from '../utils/knockoutStage.js'

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [knockoutStage, setKnockoutStage] = useState(null)

  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboardData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    getTournamentSettings()
      .then(settings => {
        if (!settings.group_stage_locked) return
        return getMatches(null, 'knockout').then(matches => setKnockoutStage(currentKnockoutStage(matches)))
      })
      .catch(() => {})
  }, [])

  if (loading) return <div className={styles.page}><p>Loading…</p></div>
  if (error) return <div className={styles.page}><p>Error: {error}</p></div>

  const topThree = leaderboardData.slice(0, 3)
  const theRest = leaderboardData.slice(3)

  return (
    <div className={styles.page}>
      <h1>Leaderboard</h1>

      {leaderboardData.length === 0 ? (
        <p className={styles.empty}>No predictions yet. Be the first!</p>
      ) : (
        <>
          <Podium users={topThree} onSelect={setSelectedUser} />
          {theRest.length > 0 && (
            <div className={styles.list}>
              {theRest.map(entry => (
                <UserLeaderboardCard key={entry.user_id} user={entry} knockoutStage={knockoutStage} />
              ))}
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <PredictionsModal user={selectedUser} knockoutStage={knockoutStage} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}
