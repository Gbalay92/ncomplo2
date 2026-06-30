import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './UserLeaderboardCard.module.css'
import { getUserTodayPredictions, getUserBracket } from '../api/users.js'
import { FlagImg } from './FlagImg.jsx'
import { nextStageLabel } from '../utils/knockoutStage.js'

function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function PredictionMatchRow({ match }) {
  const hasPred = match.pred_home_goals != null && match.pred_away_goals != null

  return (
    <div className={styles.matchRow}>
      <div className={styles.matchTeam}>
        <FlagImg className={styles.matchFlag} src={match.home_flag} alt="" width={20} />
        <span className={styles.matchTeamName}>{match.home_team}</span>
      </div>
      <span className={styles.matchScore}>
        {hasPred ? `${match.pred_home_goals} – ${match.pred_away_goals}` : '– – –'}
      </span>
      <div className={`${styles.matchTeam} ${styles.matchTeamRight}`}>
        <span className={styles.matchTeamName}>{match.away_team}</span>
        <FlagImg className={styles.matchFlag} src={match.away_flag} alt="" width={20} />
      </div>
    </div>
  )
}

function QualifierChip({ team }) {
  return (
    <div className={styles.qualifierChip}>
      {team.flag_url && <FlagImg className={styles.matchFlag} src={team.flag_url} alt="" width={20} />}
      <span className={styles.matchTeamName}>{team.name}</span>
    </div>
  )
}

export function UserLeaderboardCard({ user, knockoutStage = null }) {
  const initial = user.display_name?.[0]?.toUpperCase() ?? '?'
  const [expanded, setExpanded] = useState(false)
  const [predictions, setPredictions] = useState(null)
  const [qualifiers, setQualifiers] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!expanded && predictions === null && qualifiers === null) {
      setLoading(true)
      try {
        if (knockoutStage) {
          const bracket = await getUserBracket(user.user_id)
          const picks = (bracket ?? [])
            .filter(s => s.stage === knockoutStage && s.pred_winner_id)
            .map(s => ({ team_id: s.pred_winner_id, name: s.pred_winner_name, flag_url: s.pred_winner_flag }))
          setQualifiers(picks)
        } else {
          const data = await getUserTodayPredictions(user.user_id)
          setPredictions(data ?? [])
        }
      } catch {
        if (knockoutStage) setQualifiers([])
        else setPredictions([])
      } finally {
        setLoading(false)
      }
    }
    setExpanded(v => !v)
  }

  const showingNext = predictions?.length > 0 && !isToday(predictions[0].match_date)
  const isEmpty = knockoutStage ? !qualifiers || qualifiers.length === 0 : !predictions || predictions.length === 0

  return (
    <div className={styles.wrapper}>
      <button className={styles.card} onClick={handleToggle}>
        <span className={styles.rank}>{user.rank}</span>
        <div className={styles.avatar}>{initial}</div>
        <span className={styles.name}>{user.display_name}</span>
        <span className={styles.points}>{user.total_points} pts</span>
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ''}`}>›</span>
      </button>

      {expanded && (
        <div className={styles.expand}>
          {loading ? (
            <p className={styles.expandMsg}>Cargando…</p>
          ) : isEmpty ? (
            <p className={styles.expandMsg}>No predictions available</p>
          ) : knockoutStage ? (
            <>
              <span className={styles.nextLabel}>
                {knockoutStage === 'final' ? 'Predicted champion' : `${nextStageLabel(knockoutStage)} qualifiers`}
              </span>
              <div className={styles.qualifierGrid}>
                {qualifiers.map(team => (
                  <QualifierChip key={team.team_id} team={team} />
                ))}
              </div>
              <Link to={`/user/${user.user_id}`} state={{ displayName: user.display_name, firstName: user.first_name, lastName: user.last_name }} className={styles.fullLink}>
                View full predictions →
              </Link>
            </>
          ) : (
            <>
              {showingNext && <span className={styles.nextLabel}>Next match</span>}
              <div className={styles.matchList}>
                {predictions.map(m => (
                  <PredictionMatchRow key={m.id} match={m} />
                ))}
              </div>
              <Link to={`/user/${user.user_id}`} state={{ displayName: user.display_name, firstName: user.first_name, lastName: user.last_name }} className={styles.fullLink}>
                View full predictions →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
