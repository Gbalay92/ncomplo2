import { useState, useEffect } from "react"
import { TournamentNavigation } from "../components/TournamentNavigation"
import { getMatches } from "../api/matches.js"
import { getMyPredictions, savePredictions } from "../api/predictions.js"
import styles from './Prediction.module.css'

export default function Prediction() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [values, setValues] = useState({})
    const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error'
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

                const initial = {}
                for (const p of preds) {
                    initial[p.match_id] = { home: String(p.pred_home_goals), away: String(p.pred_away_goals) }
                }
                setValues(initial)
            })
            .catch(() => setError('Failed to load data'))
    }, [])

    function handleChange(matchId, home, away) {
        setValues(prev => ({ ...prev, [matchId]: { home, away } }))
    }

    async function handleSave() {
        const payload = Object.entries(values)
            .filter(([, v]) => v.home !== '' && v.away !== '')
            .map(([matchId, v]) => ({
                match_id: Number(matchId),
                pred_home_goals: parseInt(v.home, 10),
                pred_away_goals: parseInt(v.away, 10),
            }))
            .filter(p => !isNaN(p.pred_home_goals) && !isNaN(p.pred_away_goals))

        if (!payload.length) return

        setSaveStatus('saving')
        try {
            await savePredictions(payload)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2000)
        } catch {
            setSaveStatus('error')
        }
    }

    if (error) return <p>{error}</p>
    if (!groupedMatches) return <p>Loading...</p>

    return (
        <>
            <h1>Prediction Page</h1>
            <TournamentNavigation
                data={{ matches: groupedMatches }}
                values={values}
                onChange={handleChange}
            />
            <div className={styles.saveBar}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Save predictions'}
                </button>
            </div>
        </>
    )
}
