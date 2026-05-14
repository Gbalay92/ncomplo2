import styles from '../pages/Leaderboard.module.css'

export function PodiumStep({ user, rank }) {
    return (
        <div className={`${styles.podiumStep} ${styles[`rank${rank}`]}`}>
            <div className={styles.avatarCircle}>{rank}</div>
            <span className={styles.name}>{user.display_name}</span>
            <span className={styles.points}>{user.total_points} pts</span>
        </div>
    )
}