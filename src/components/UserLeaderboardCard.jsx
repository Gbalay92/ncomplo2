import styles from './UserLeaderboardCard.module.css'

export function UserLeaderboardCard({ user }) {
    return (
        <div className={styles.userCard}>
                <h2>{user.display_name}</h2>
                <h3>{user.total_points} pts</h3>
        </div>
)}