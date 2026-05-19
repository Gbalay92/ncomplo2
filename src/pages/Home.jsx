import { useState, useEffect } from 'react'
import { useRouter } from "../hooks/useRouter.jsx"
import styles from './Home.module.css'
import { useAuth } from "../context/AuthContext.jsx"
import { Podium } from "../components/Podium.jsx"
import MatchCard from "../components/MatchCard.jsx"
import { getLeaderboard } from '../api/leaderboard.js'
import { getNextMatch } from '../api/matches.js'

export default function HomePage() {
    const { navigateTo } = useRouter()
    const { isLoggedIn } = useAuth()
    const [topThree, setTopThree] = useState([])
    const [nextMatch, setNextMatch] = useState(null)

    useEffect(() => {
        if (isLoggedIn) {
            getLeaderboard()
                .then(data => setTopThree(data.slice(0, 3)))
                .catch(() => {})
        }
        getNextMatch()
            .then(setNextMatch)
            .catch(() => {})
    }, [isLoggedIn])

    const showPodium = isLoggedIn && topThree.length > 0

    return (
        <main>
            <section className={styles.presentationContainer}>
                <img src="./background.jpg" />
                <div className={styles.overlay}>
                    <h3>THE WORLD STAGE AWAITS</h3>
                    <h4>Predict winners, earn points and won prizes!</h4>
                    <span></span>
                    <button
                        className={isLoggedIn ? styles.predictionBtn : `${styles.predictionBtn} ${styles.btnDisabled}`}
                        onClick={() => navigateTo('/prediction')}>
                        Start Predicting
                    </button>
                </div>
            </section>

            <section className={`${styles.wingetsContainer} ${!showPodium ? styles.fullWidth : ''}`}>
                {showPodium && <Podium users={topThree} />}
                <article className={`${styles.nextMatchContainer} ${!showPodium ? styles.nextMatchFull : ''}`}>
                    <h2>Next Match</h2>
                    {nextMatch
                        ? <MatchCard match={nextMatch} readOnly />
                        : <p className={styles.noMatch}>No upcoming matches scheduled</p>
                    }
                </article>
            </section>
        </main>
    )
}
