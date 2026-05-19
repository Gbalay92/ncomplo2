import styles from '../pages/Leaderboard.module.css'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function PodiumStep({ user, rank }) {
  const initial = user.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={`${styles.podiumStep} ${styles[`rank${rank}`]}`}>
      <span className={styles.medal}>{MEDALS[rank]}</span>
      <div className={styles.avatar}>{initial}</div>
      <span className={styles.podiumName}>{user.display_name}</span>
      <span className={styles.podiumPoints}>{user.total_points} pts</span>
    </div>
  )
}
