import { useState, useEffect } from 'react'
import styles from './Matches.module.css'

function TeamDisplay({ teamName, flagUrl }) {
  return (
    <div className={styles.countryDisplay}>
      <article className={styles.flagContainer}>
        <img src={flagUrl} width="40" alt={teamName} />
      </article>
      <span>{teamName}</span>
    </div>
  )
}

function formatMatchDate(dateStr) {
  const date = new Date(dateStr)
  const datePart = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const timePart = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  return { datePart, timePart }
}

function ScoreInput({ value, onChange, onBlur }) {
  return (
    <input
      className={styles.scoreInput}
      type="number"
      min="0"
      max="20"
      placeholder="0"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
    />
  )
}

export function MatchCard({ match, readOnly = false, prediction, onSave }) {
  const { datePart, timePart } = match.match_date ? formatMatchDate(match.match_date) : {}

  const [home, setHome] = useState(prediction?.home ?? '')
  const [away, setAway] = useState(prediction?.away ?? '')
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'

  useEffect(() => {
    setHome(prediction?.home ?? '')
    setAway(prediction?.away ?? '')
  }, [prediction])

  async function handleBlur() {
    if (home === '' || away === '') return
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a)) return

    const prev = prediction
    if (prev && prev.home === h && prev.away === a) return

    setStatus('saving')
    try {
      await onSave(match.id, h, a)
      setStatus('saved')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('error')
    }
  }

  const homeScore = match.real_home_goals ?? null
  const awayScore = match.real_away_goals ?? null

  return (
    <article className={styles.matchCard}>
      <section className={styles.matchInfo}>
        <TeamDisplay teamName={match.home_team} flagUrl={match.home_flag} />

        <div className={styles.scoreContainer}>
          {readOnly ? (
            <>
              <span className={styles.scoreText}>{homeScore !== null ? homeScore : '–'}</span>
              <span className={styles.scoreSep}>:</span>
              <span className={styles.scoreText}>{awayScore !== null ? awayScore : '–'}</span>
            </>
          ) : (
            <>
              <ScoreInput value={home} onChange={setHome} onBlur={handleBlur} />
              <span className={styles.scoreSep}>:</span>
              <ScoreInput value={away} onChange={setAway} onBlur={handleBlur} />
            </>
          )}
        </div>

        <TeamDisplay teamName={match.away_team} flagUrl={match.away_flag} />
      </section>

      <footer className={styles.matchFooter}>
        {match.match_date && (
          <>
            <span>{datePart}</span>
            <span className={styles.matchTime}>{timePart}</span>
          </>
        )}
        {status === 'saving' && <span className={styles.statusSaving}>saving…</span>}
        {status === 'saved' && <span className={styles.statusSaved}>✓ saved</span>}
        {status === 'error' && <span className={styles.statusError}>error saving</span>}
      </footer>
    </article>
  )
}

export default MatchCard
