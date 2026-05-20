import { useState, useEffect } from 'react'
import { useRouter } from "../hooks/useRouter.jsx"
import styles from './Home.module.css'
import { useAuth } from "../context/AuthContext.jsx"
import { Podium } from "../components/Podium.jsx"
import MatchCard from "../components/MatchCard.jsx"
import { getLeaderboard } from '../api/leaderboard.js'
import { getTodayMatches } from '../api/matches.js'
import { getTournamentSettings } from '../api/tournament.js'

export default function HomePage() {
    const { navigateTo } = useRouter()
    const { isLoggedIn } = useAuth()
    const [topThree, setTopThree] = useState([])
    const [todayData, setTodayData] = useState(null)
    const [predictionsLocked, setPredictionsLocked] = useState(false)

    useEffect(() => {
        getTodayMatches()
            .then(setTodayData)
            .catch(() => {})

        if (isLoggedIn) {
            getLeaderboard()
                .then(data => setTopThree(data.slice(0, 3)))
                .catch(() => {})
            getTournamentSettings()
                .then(s => setPredictionsLocked(s.predictions_locked))
                .catch(() => {})
        }
    }, [isLoggedIn])

    const showPodium = isLoggedIn && topThree.length > 0

    const matchSectionTitle = todayData?.isToday ? 'Partidos de hoy' : 'Próximo partido'
    const matches = todayData?.matches ?? []

    let btnLabel, btnAction
    if (!isLoggedIn) {
        btnLabel = 'Login'
        btnAction = () => navigateTo('/login')
    } else if (predictionsLocked) {
        btnLabel = 'Show predictions'
        btnAction = () => navigateTo('/prediction')
    } else {
        btnLabel = 'Start Predicting'
        btnAction = () => navigateTo('/prediction')
    }

    return (
        <main>
            <section className={styles.presentationContainer}>
                <img src="./background.jpg" />
                <div className={styles.overlay}>
                    <h3>THE WORLD STAGE AWAITS</h3>
                    <h4>Predict winners, earn points and won prizes!</h4>
                    <span></span>
                    <button className={styles.predictionBtn} onClick={btnAction}>
                        {btnLabel}
                    </button>
                </div>
            </section>

            <section className={`${styles.wingetsContainer} ${!showPodium ? styles.fullWidth : ''}`}>
                {showPodium && (
                    <div className={styles.podiumWidget} onClick={() => navigateTo('/leaderboard')}>
                        <Podium users={topThree} onSelect={() => navigateTo('/leaderboard')} />
                        <span className={styles.podiumLink}>Ver leaderboard →</span>
                    </div>
                )}
                <article className={`${styles.nextMatchContainer} ${!showPodium ? styles.nextMatchFull : ''}`}>
                    <h2>{matchSectionTitle}</h2>
                    {matches.length > 0
                        ? <div className={styles.matchList}>
                            {matches.map(m => (
                                <MatchCard key={m.id} match={m} readOnly />
                            ))}
                          </div>
                        : <p className={styles.noMatch}>No upcoming matches scheduled</p>
                    }
                </article>
            </section>
        </main>
    )
}
