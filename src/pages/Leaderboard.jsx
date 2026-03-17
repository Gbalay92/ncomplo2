import { useState, useEffect } from 'react'
import styles from './Leaderboard.module.css'
import data from '../example-data.json'
import { UserLeaderboardCard } from '../components/UserLeaderboardCard'
import { Podium } from '../components/Podium'

export default function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([])

    useEffect(() => {
        const sortedData = [...data].sort((a, b) => b.points - a.points)
        setLeaderboardData(sortedData)
    }, [])

    const topThree = leaderboardData.slice(0, 3)
    const theRest = leaderboardData.slice(3)

    return (
        <div className={styles.leaderboardContainer}>
            <h1>World Cup Leaderboard</h1>

            <Podium users={topThree} />

            <div className={styles.listContainer}>
                {theRest.map((entry, index) => (
                    <UserLeaderboardCard key={index} user={entry} />
                ))}
            </div>
        </div>
    )
}