import { useState, useEffect } from "react"
import { TournamentNavigation } from "../components/TournamentNavigation"
import { getMatches } from "../api/matches.js"
import { getMyPredictions, savePrediction } from "../api/predictions.js"

export default function Prediction() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [predictions, setPredictions] = useState({})
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([getMatches(null, 'group'), getMyPredictions()])
            .then(([matches, preds]) => {
                const grouped = {}
                for (const match of matches) {
                    const key = `Group ${match.group_name}`
                    if (!grouped[key]) grouped[key] = []
                    grouped[key].push(match)
                }
                setGroupedMatches(grouped)

                const predMap = {}
                for (const p of preds) {
                    predMap[p.match_id] = { home: p.pred_home_goals, away: p.pred_away_goals }
                }
                setPredictions(predMap)
            })
            .catch(() => setError('Failed to load data'))
    }, [])

    async function handleSave(matchId, home, away) {
        await savePrediction(matchId, home, away)
        setPredictions(prev => ({ ...prev, [matchId]: { home, away } }))
    }

    if (error) return <p>{error}</p>
    if (!groupedMatches) return <p>Loading...</p>

    return (
        <>
            <h1>Prediction Page</h1>
            <TournamentNavigation
                data={{ matches: groupedMatches }}
                predictions={predictions}
                onSave={handleSave}
            />
        </>
    )
}
