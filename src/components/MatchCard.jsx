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

export function MatchCard({ match, readOnly = false, value, onChange, incomplete = false }) {
  const { datePart, timePart } = match.match_date ? formatMatchDate(match.match_date) : {}

  const home = value?.home ?? ''
  const away = value?.away ?? ''

  const homeScore = match.real_home_goals ?? null
  const awayScore = match.real_away_goals ?? null

  return (
    <article className={`${styles.matchCard} ${incomplete ? styles.matchCardIncomplete : ''}`}>
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
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={home}
                onChange={e => onChange(match.id, e.target.value, away)}
              />
              <span className={styles.scoreSep}>:</span>
              <input
                className={styles.scoreInput}
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={away}
                onChange={e => onChange(match.id, home, e.target.value)}
              />
            </>
          )}
        </div>

        <TeamDisplay teamName={match.away_team} flagUrl={match.away_flag} />
      </section>

      {match.match_date && (
        <footer className={styles.matchFooter}>
          <span>{datePart}</span>
          <span className={styles.matchTime}>{timePart}</span>
        </footer>
      )}
    </article>
  )
}

export default MatchCard
