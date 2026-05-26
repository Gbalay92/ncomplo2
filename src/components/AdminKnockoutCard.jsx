import { useState, useEffect } from 'react'
import styles from './AdminMatchCard.module.css'

function TeamDisplay({ teamName, flagUrl, size = 'sm' }) {
  return (
    <div className={`${styles.team} ${size === 'lg' ? styles.teamLg : ''}`}>
      {flagUrl
        ? <img src={flagUrl} width={size === 'lg' ? 48 : 32} alt={teamName} />
        : <span className={styles.tbd}>TBD</span>
      }
      <span>{teamName ?? 'TBD'}</span>
    </div>
  )
}

export function AdminKnockoutCard({ slot, isExpanded, onToggle, onSave }) {
  const hasResult = slot.real_home_goals != null
  const isSeeded = slot.home_team_id != null

  const [home, setHome] = useState(hasResult ? String(slot.real_home_goals) : '')
  const [away, setAway] = useState(hasResult ? String(slot.real_away_goals) : '')
  const [winnerId, setWinnerId] = useState(slot.real_winner_id ?? null)
  const [displayHome, setDisplayHome] = useState(hasResult ? slot.real_home_goals : null)
  const [displayAway, setDisplayAway] = useState(hasResult ? slot.real_away_goals : null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isExpanded) setError(null)
  }, [isExpanded])

  const homeGoals = parseInt(home, 10)
  const awayGoals = parseInt(away, 10)
  const isDraw = !isNaN(homeGoals) && !isNaN(awayGoals) && homeGoals === awayGoals

  async function handleSave() {
    if (isNaN(homeGoals) || isNaN(awayGoals) || home === '' || away === '') {
      setError('Both scores are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(slot.slot_id, homeGoals, awayGoals, isDraw ? (winnerId ?? null) : null)
      setDisplayHome(homeGoals)
      setDisplayAway(awayGoals)
      onToggle()
    } catch {
      setError('Error saving, try again')
    } finally {
      setSaving(false)
    }
  }

  const isSaved = displayHome !== null

  return (
    <article
      className={`${styles.card} ${isSaved ? styles.saved : ''} ${isExpanded ? styles.expanded : ''} ${!isSeeded ? styles.unseeded : ''}`}
      onClick={!isExpanded && isSeeded ? onToggle : undefined}
    >
      <div className={styles.compact}>
        <TeamDisplay teamName={slot.home_team_name} flagUrl={slot.home_team_flag} />
        <div className={styles.score}>
          <span>{displayHome !== null ? displayHome : '–'}</span>
          <span className={styles.sep}>:</span>
          <span>{displayAway !== null ? displayAway : '–'}</span>
        </div>
        <TeamDisplay teamName={slot.away_team_name} flagUrl={slot.away_team_flag} />
      </div>

      {isExpanded && (
        <div className={styles.expandedArea} onClick={e => e.stopPropagation()}>
          <div className={styles.inputRow}>
            <TeamDisplay teamName={slot.home_team_name} flagUrl={slot.home_team_flag} size="lg" />
            <div className={styles.inputs}>
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={home}
                autoFocus
                onChange={e => { setHome(e.target.value); setWinnerId(null) }}
              />
              <span className={styles.sep}>:</span>
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={away}
                onChange={e => { setAway(e.target.value); setWinnerId(null) }}
              />
            </div>
            <TeamDisplay teamName={slot.away_team_name} flagUrl={slot.away_team_flag} size="lg" />
          </div>

          {isDraw && (
            <div className={styles.penaltyRow}>
              <span className={styles.penaltyLabel}>Penalty winner:</span>
              <button
                className={`${styles.penaltyBtn} ${winnerId === slot.home_team_id ? styles.penaltySelected : ''}`}
                onClick={() => setWinnerId(slot.home_team_id)}
              >
                {slot.home_team_name}
              </button>
              <button
                className={`${styles.penaltyBtn} ${winnerId === slot.away_team_id ? styles.penaltySelected : ''}`}
                onClick={() => setWinnerId(slot.away_team_id)}
              >
                {slot.away_team_name}
              </button>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onToggle} disabled={saving}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
