import { useState, useEffect } from 'react'
import styles from './AdminMatchCard.module.css'

function TeamDisplay({ teamName, flagUrl, size = 'sm' }) {
  return (
    <div className={`${styles.team} ${size === 'lg' ? styles.teamLg : ''}`}>
      <img src={flagUrl} width={size === 'lg' ? 48 : 32} alt={teamName} />
      <span>{teamName}</span>
    </div>
  )
}

export function AdminMatchCard({ match, isExpanded, onToggle, onSave }) {
  const hasResult = match.real_home_goals != null

  const [home, setHome] = useState(hasResult ? String(match.real_home_goals) : '')
  const [away, setAway] = useState(hasResult ? String(match.real_away_goals) : '')
  const [displayHome, setDisplayHome] = useState(hasResult ? match.real_home_goals : null)
  const [displayAway, setDisplayAway] = useState(hasResult ? match.real_away_goals : null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isExpanded) setError(null)
  }, [isExpanded])

  async function handleSave() {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || home === '' || away === '') {
      setError('Both scores are required')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(match.id, h, a)
      setDisplayHome(h)
      setDisplayAway(a)
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
      className={`${styles.card} ${isSaved ? styles.saved : ''} ${isExpanded ? styles.expanded : ''}`}
      onClick={!isExpanded ? onToggle : undefined}
    >
      <div className={styles.compact}>
        <TeamDisplay teamName={match.home_team} flagUrl={match.home_flag} />
        <div className={styles.score}>
          <span>{displayHome !== null ? displayHome : '–'}</span>
          <span className={styles.sep}>:</span>
          <span>{displayAway !== null ? displayAway : '–'}</span>
        </div>
        <TeamDisplay teamName={match.away_team} flagUrl={match.away_flag} />
      </div>

      {isExpanded && (
        <div className={styles.expandedArea} onClick={e => e.stopPropagation()}>
          <div className={styles.inputRow}>
            <TeamDisplay teamName={match.home_team} flagUrl={match.home_flag} size="lg" />
            <div className={styles.inputs}>
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={home}
                autoFocus
                onChange={e => setHome(e.target.value)}
              />
              <span className={styles.sep}>:</span>
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={away}
                onChange={e => setAway(e.target.value)}
              />
            </div>
            <TeamDisplay teamName={match.away_team} flagUrl={match.away_flag} size="lg" />
          </div>

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
