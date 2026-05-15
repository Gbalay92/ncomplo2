import { MatchCard } from './MatchCard.jsx'
import styles from './Matches.module.css'

export function MatchesContainer({ matches, values = {}, onChange }) {
    return (
        <div className={styles.matchesContainer}>
            {matches.map(match => (
                <MatchCard
                    key={match.match_number}
                    match={match}
                    value={values[match.id]}
                    onChange={onChange}
                />
            ))}
        </div>
    )
}