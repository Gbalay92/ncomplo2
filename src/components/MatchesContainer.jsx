import { MatchCard } from './MatchCard.jsx'
import styles from './Matches.module.css'

export function MatchesContainer({ matches }) {
    return (
        <div className={styles.matchesContainer}>
            {matches.map(match => (
                <MatchCard key={match.match_number} match={match} />
            ))}
        </div>
    )
}