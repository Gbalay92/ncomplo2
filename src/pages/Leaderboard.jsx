import { useState, useEffect } from 'react'
import styles from './Leaderboard.module.css'
import { getLeaderboard } from '../api/leaderboard.js'
import { UserLeaderboardCard } from '../components/UserLeaderboardCard'
import { Podium } from '../components/Podium'

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        getLeaderboard()
            .then(setLeaderboardData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const topThree = leaderboardData.slice(0, 3)
    const theRest = leaderboardData.slice(3)

    if (loading) return <div className={styles.leaderboardContainer}><p>Loading...</p></div>
    if (error) return <div className={styles.leaderboardContainer}><p>Error: {error}</p></div>

    return (
        <div className={styles.leaderboardContainer}>
            <h1>World Cup Leaderboard</h1>

            {leaderboardData.length === 0 ? (
                <p className={styles.empty}>No predictions yet. Be the first!</p>
            ) : (
                <>
                    <Podium users={topThree} />
                    <div className={styles.listContainer}>
                        {theRest.map((entry, index) => (
                            <UserLeaderboardCard key={entry.user_id} user={entry} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
