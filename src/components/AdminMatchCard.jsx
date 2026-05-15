import { useState } from 'react'
import styles from './AdminMatchCard.module.css'
import matchStyles from './Matches.module.css'

function TeamDisplay({ teamName, flagUrl }) {
  return (
    <div className={matchStyles.countryDisplay}>
      <article className={matchStyles.flagContainer}>
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

export function AdminMatchCard({ match, onSave }) {
  const { datePart, timePart } = match.match_date ? formatMatchDate(match.match_date) : {}

  const [home, setHome] = useState(match.real_home_goals ?? '')
  const [away, setAway] = useState(match.real_away_goals ?? '')
  const [status, setStatus] = useState(match.real_home_goals != null ? 'saved' : null)

  async function handleBlur() {
    if (home === '' || away === '') return
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a)) return
    if (h === match.real_home_goals && a === match.real_away_goals) return

    setStatus('saving')
    try {
      await onSave(match.id, h, a)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <article className={`${styles.adminMatchCard} ${status === 'saved' ? styles.confirmed : ''}`}>
      <section className={matchStyles.matchInfo}>
        <TeamDisplay teamName={match.home_team} flagUrl={match.home_flag} />

        <div className={matchStyles.scoreContainer}>
          <input
            className={matchStyles.scoreInput}
            type="number"
            min="0"
            max="20"
            placeholder="0"
            value={home}
            onChange={e => setHome(e.target.value)}
            onBlur={handleBlur}
          />
          <span className={matchStyles.scoreSep}>:</span>
          <input
            className={matchStyles.scoreInput}
            type="number"
            min="0"
            max="20"
            placeholder="0"
            value={away}
            onChange={e => setAway(e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        <TeamDisplay teamName={match.away_team} flagUrl={match.away_flag} />
      </section>

      <footer className={matchStyles.matchFooter}>
        {match.match_date && (
          <>
            <span>{datePart}</span>
            <span className={matchStyles.matchTime}>{timePart}</span>
          </>
        )}
        {status === 'saving' && <span className={styles.statusSaving}>saving…</span>}
        {status === 'saved' && <span className={styles.statusSaved}>✓</span>}
        {status === 'error' && <span className={styles.statusError}>error</span>}
      </footer>
    </article>
  )
}
