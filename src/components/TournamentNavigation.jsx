import { useState } from 'react'
import { MatchesContainer } from './MatchesContainer'
import styles from './TournamentNavigation.module.css'

export function TournamentNavigation({ data, values = {}, onChange, incompleteIds = new Set() }) {
  const groupNames = Object.keys(data.matches)
  const [activeGroup, setActiveGroup] = useState(groupNames[0])
  const currentMatches = data.matches[activeGroup]

  const incompleteGroups = new Set(
    groupNames.filter(name => data.matches[name].some(m => incompleteIds.has(m.id)))
  )

  return (
    <div className={styles.tournamentNavigation}>
      <nav className={styles.groupsNav}>
        {groupNames.map((name) => (
          <button
            key={name}
            className={[
              activeGroup === name ? styles.active : '',
              incompleteGroups.has(name) ? styles.incomplete : '',
            ].join(' ')}
            onClick={() => setActiveGroup(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <MatchesContainer
        matches={currentMatches}
        values={values}
        onChange={onChange}
        incompleteIds={incompleteIds}
      />
    </div>
  )
}
