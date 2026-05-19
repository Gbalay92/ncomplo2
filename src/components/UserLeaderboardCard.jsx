import styles from './UserLeaderboardCard.module.css'

export function UserLeaderboardCard({ user }) {
  const initial = user.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.card}>
      <span className={styles.rank}>{user.rank}</span>
      <div className={styles.avatar}>{initial}</div>
      <span className={styles.name}>{user.display_name}</span>
      <span className={styles.points}>{user.total_points} pts</span>
    </div>
  )
}
