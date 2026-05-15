import { useState } from 'react'
import { MatchesContainer } from './MatchesContainer'
import styles from './TournamentNavigation.module.css'

export function TournamentNavigation({ data, predictions = {}, onSave }) {
  const groupNames = Object.keys(data.matches)
  const [activeGroup, setActiveGroup] = useState(groupNames[0])
  const currentMatches = data.matches[activeGroup]

  return (
    <div className={styles.tournamentNavigation}>
      <nav className={styles.groupsNav}>
        {groupNames.map((name) => (
          <button
            key={name}
            className={`nav-button ${activeGroup === name ? styles.active : ''}`}
            onClick={() => setActiveGroup(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <MatchesContainer matches={currentMatches} predictions={predictions} onSave={onSave} />
    </div>
  )
}