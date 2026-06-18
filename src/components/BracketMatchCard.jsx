import styles from './BracketMatchCard.module.css'
import { FlagImg } from './FlagImg.jsx'

function TeamOption({ team, selected, onClick }) {
  const canPick = !!team

  return (
    <button
      className={`${styles.team} ${selected ? styles.selected : ''} ${!canPick ? styles.tbd : ''}`}
      onClick={canPick ? onClick : undefined}
      disabled={!canPick}
    >
      {team ? (
        <>
          <FlagImg src={team.flag_url} width={32} alt={team.name} />
          <span>{team.name}</span>
        </>
      ) : (
        <span className={styles.tbdLabel}>TBD</span>
      )}
    </button>
  )
}

export function BracketMatchCard({ slot, homeTeam, awayTeam, pickedTeamId, onPick, warn = false }) {
  const bothKnown = homeTeam && awayTeam

  return (
    <article className={`${styles.card} ${!bothKnown ? styles.locked : ''} ${warn ? styles.warn : ''}`}>
      <div className={styles.matchLabel}>{slot.slot_label}</div>
      <div className={styles.teams}>
        <TeamOption
          team={homeTeam}
          selected={pickedTeamId != null && pickedTeamId === homeTeam?.team_id}
          onClick={() => onPick(homeTeam)}
        />
        <span className={styles.vs}>vs</span>
        <TeamOption
          team={awayTeam}
          selected={pickedTeamId != null && pickedTeamId === awayTeam?.team_id}
          onClick={() => onPick(awayTeam)}
        />
      </div>
    </article>
  )
}
