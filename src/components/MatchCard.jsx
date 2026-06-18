import styles from './Matches.module.css'
import { FlagImg } from './FlagImg.jsx'

function TeamDisplay({ teamName, flagUrl }) {
  return (
    <div className={styles.countryDisplay}>
      <article className={styles.flagContainer}>
        <FlagImg src={flagUrl} width={40} alt={teamName} />
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

export function MatchCard({ match, readOnly = false, value, onChange, incomplete = false, subtitle, points }) {
  const { datePart, timePart } = match.match_date ? formatMatchDate(match.match_date) : {}

  const home = value?.home ?? ''
  const away = value?.away ?? ''

  const hasResult = match.real_home_goals != null && match.real_away_goals != null

  return (
    <article className={`${styles.matchCard} ${incomplete ? styles.matchCardIncomplete : ''}`}>
      {subtitle && <p className={styles.matchSubtitle}>{subtitle}</p>}
      <section className={styles.matchInfo}>
        <TeamDisplay teamName={match.home_team} flagUrl={match.home_flag} />

        <div className={styles.scoreContainer}>
          {readOnly ? (
            <>
              <span className={styles.scoreText}>{home !== '' ? home : '–'}</span>
              <span className={styles.scoreSep}>:</span>
              <span className={styles.scoreText}>{away !== '' ? away : '–'}</span>
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

      <footer className={styles.matchFooter}>
        {match.match_date && (
          <>
            <span>{datePart}</span>
            <span className={styles.matchTime}>{timePart}</span>
          </>
        )}
        {hasResult && (
          <>
            {match.match_date && <span className={styles.footerSep}>·</span>}
            <span className={styles.matchResult}>{match.real_home_goals} – {match.real_away_goals}</span>
          </>
        )}
        {points != null && (
          <span className={points > 0 ? styles.pointsEarned : styles.pointsZero}>
            {points > 0 ? `+${points} pts` : '0 pts'}
          </span>
        )}
      </footer>
    </article>
  )
}

export default MatchCard
