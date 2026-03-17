import styles from '../pages/Leaderboard.module.css'
import { PodiumStep } from './PodiumStep'

export function Podium({ users }) {
    return (
        <div className={styles.podiumContainer}>
            {users[1] && <PodiumStep user={users[1]} rank={2} />}
            {users[0] && <PodiumStep user={users[0]} rank={1} />}
            {users[2] && <PodiumStep user={users[2]} rank={3} />}
        </div>
    )
}