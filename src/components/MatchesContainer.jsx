import { MatchCard } from './MatchCard.jsx'
import styles from './Matches.module.css'

export function MatchesContainer({ matches, predictions = {}, onSave }) {
    return (
        <div className={styles.matchesContainer}>
            {matches.map(match => (
                <MatchCard
                    key={match.match_number}
                    match={match}
                    prediction={predictions[match.id]}
                    onSave={onSave}
                />
            ))}
        </div>
    )
}