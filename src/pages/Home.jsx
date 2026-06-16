import { useState, useEffect } from 'react'
import { useRouter } from "../hooks/useRouter.jsx"
import styles from './Home.module.css'
import { useAuth } from "../context/AuthContext.jsx"
import { Podium } from "../components/Podium.jsx"
import { getLeaderboard } from '../api/leaderboard.js'
import { getTodayMatches } from '../api/matches.js'
import { getTournamentSettings } from '../api/tournament.js'
import { getUserTodayPredictions } from '../api/users.js'

function formatDateTime(dateStr) {
    const date = new Date(dateStr)
    const isToday = date.toDateString() === new Date().toDateString()
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    if (isToday) return time
    const day = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
    return `${day} ${time}`
}

function CompactMatchRow({ match, prediction }) {
    const hasResult = match.real_home_goals != null && match.real_away_goals != null
    const hasPred = prediction?.pred_home_goals != null && prediction?.pred_away_goals != null
    return (
        <div className={styles.matchRow}>
            <div className={styles.matchTeam}>
                <img src={match.home_flag} alt="" width="24" />
                <span>{match.home_team}</span>
            </div>
            <div className={styles.matchCenter}>
                {hasResult
                    ? <span className={styles.matchScore}>{match.real_home_goals} – {match.real_away_goals}</span>
                    : <span className={styles.matchTime}>{formatDateTime(match.match_date)}</span>
                }
                {hasPred && (
                    <span className={styles.matchPred}>{prediction.pred_home_goals}–{prediction.pred_away_goals}</span>
                )}
            </div>
            <div className={`${styles.matchTeam} ${styles.matchTeamRight}`}>
                <span>{match.away_team}</span>
                <img src={match.away_flag} alt="" width="24" />
            </div>
        </div>
    )
}

export default function HomePage() {
    const { navigateTo } = useRouter()
    const { isLoggedIn, user } = useAuth()
    const [topThree, setTopThree] = useState([])
    const [myStats, setMyStats] = useState(null)
    const [myPredictions, setMyPredictions] = useState(null)
    const [todayData, setTodayData] = useState(null)
    const [predictionsLocked, setPredictionsLocked] = useState(false)

    useEffect(() => {
        getTodayMatches().then(setTodayData).catch(() => {})

        if (isLoggedIn && user?.id) {
            getLeaderboard()
                .then(data => {
                    setTopThree(data.slice(0, 3))
                    const me = data.find(e => e.user_id === user.id)
                    if (me) setMyStats({ rank: me.rank, points: me.total_points })
                })
                .catch(() => {})
            getTournamentSettings()
                .then(s => setPredictionsLocked(s.predictions_locked))
                .catch(() => {})
            getUserTodayPredictions(user.id)
                .then(preds => {
                    if (preds) {
                        const map = {}
                        for (const p of preds) map[p.id] = p
                        setMyPredictions(map)
                    }
                })
                .catch(() => {})
        }
    }, [isLoggedIn, user?.id])

    const showPodium = isLoggedIn && topThree.length > 0

    const matchSectionTitle = todayData?.isToday ? "Today's matches" : 'Next match'
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
                        {myStats && myStats.rank > 3 && (
                            <div className={styles.myPosition}>
                                <span className={styles.myPositionName}>{user.display_name}</span>
                                <span className={styles.myPositionRank}>#{myStats.rank}</span>
                                <span className={styles.myPositionPts}>{myStats.points} pts</span>
                            </div>
                        )}
                        <span className={styles.podiumLink}>View leaderboard →</span>
                    </div>
                )}
                <article className={`${styles.nextMatchContainer} ${!showPodium ? styles.nextMatchFull : ''}`}>
                    <h2>{matchSectionTitle}</h2>
                    {matches.length > 0
                        ? <div className={styles.matchList}>
                            {matches.map(m => (
                                <CompactMatchRow
                                    key={m.id}
                                    match={m}
                                    prediction={myPredictions?.[m.id]}
                                />
                            ))}
                          </div>
                        : <p className={styles.noMatch}>No upcoming matches scheduled</p>
                    }
                </article>
            </section>
        </main>
    )
}
