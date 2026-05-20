import styles from '../pages/Leaderboard.module.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function PodiumStep({ user, rank, onSelect }) {
  const initial = user.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <button className={`${styles.podiumStep} ${styles[`rank${rank}`]}`} onClick={() => onSelect(user)}>
      <span className={styles.medal}>{MEDALS[rank]}</span>
      <div className={styles.avatar}>{initial}</div>
      <span className={styles.podiumName}>{user.display_name}</span>
      <span className={styles.podiumPoints}>{user.total_points} pts</span>
    </button>
  )
}
