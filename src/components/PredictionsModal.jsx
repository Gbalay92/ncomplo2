import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './PredictionsModal.module.css'
import { getUserTodayPredictions, getUserBracket } from '../api/users.js'
import { nextStageLabel } from '../utils/knockoutStage.js'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function PredictionMatchRow({ match }) {
  const hasPred = match.pred_home_goals != null && match.pred_away_goals != null

  return (
    <div className={styles.matchRow}>
      <div className={styles.matchTeam}>
        <img src={match.home_flag} alt="" width="22" />
        <span className={styles.teamName}>{match.home_team}</span>
      </div>
      <span className={styles.score}>
        {hasPred ? `${match.pred_home_goals} – ${match.pred_away_goals}` : '– – –'}
      </span>
      <div className={`${styles.matchTeam} ${styles.matchTeamRight}`}>
        <span className={styles.teamName}>{match.away_team}</span>
        <img src={match.away_flag} alt="" width="22" />
      </div>
    </div>
  )
}

function QualifierChip({ team }) {
  return (
    <div className={styles.qualifierChip}>
      {team.flag_url && <img src={team.flag_url} alt="" width="22" />}
      <span className={styles.teamName}>{team.name}</span>
    </div>
  )
}

export function PredictionsModal({ user, knockoutStage = null, onClose }) {
  const [predictions, setPredictions] = useState(null)
  const [qualifiers, setQualifiers] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (knockoutStage) {
      getUserBracket(user.user_id)
        .then(bracket => {
          const picks = (bracket ?? [])
            .filter(s => s.stage === knockoutStage && s.pred_winner_id)
            .map(s => ({ team_id: s.pred_winner_id, name: s.pred_winner_name, flag_url: s.pred_winner_flag }))
          setQualifiers(picks)
        })
        .catch(() => setQualifiers([]))
        .finally(() => setLoading(false))
    } else {
      getUserTodayPredictions(user.user_id)
        .then(data => setPredictions(data ?? []))
        .catch(() => setPredictions([]))
        .finally(() => setLoading(false))
    }
  }, [user.user_id, knockoutStage])

  const showingNext = predictions?.length > 0 && !isToday(predictions[0].match_date)
  const isEmpty = knockoutStage ? !qualifiers || qualifiers.length === 0 : !predictions || predictions.length === 0

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <header className={styles.header}>
          {user.rank <= 3 && <span className={styles.medal}>{MEDALS[user.rank]}</span>}
          <div className={styles.avatar}>{user.display_name?.[0]?.toUpperCase() ?? '?'}</div>
          <h2 className={styles.name}>{user.display_name}</h2>
          <span className={styles.points}>{user.total_points} pts</span>
        </header>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.msg}>Cargando…</p>
          ) : isEmpty ? (
            <p className={styles.msg}>No predictions available</p>
          ) : knockoutStage ? (
            <>
              <p className={styles.sectionLabel}>
                {knockoutStage === 'final' ? 'Predicted champion' : `${nextStageLabel(knockoutStage)} qualifiers`}
              </p>
              <div className={styles.qualifierGrid}>
                {qualifiers.map(team => (
                  <QualifierChip key={team.team_id} team={team} />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className={styles.sectionLabel}>
                {showingNext ? 'Next match' : "Today's matches"}
              </p>
              <div className={styles.matchList}>
                {predictions.map(m => (
                  <PredictionMatchRow key={m.id} match={m} />
                ))}
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <Link
            to={`/user/${user.user_id}`}
            state={{ displayName: user.display_name, firstName: user.first_name, lastName: user.last_name }}
            className={styles.fullLink}
            onClick={onClose}
          >
            View full predictions →
          </Link>
        </footer>
      </div>
    </div>
  )
}
