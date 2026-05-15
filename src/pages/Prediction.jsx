import { useState, useEffect } from "react"
import { TournamentNavigation } from "../components/TournamentNavigation"
import { getMatches } from "../api/matches.js"
import { getMyPredictions, savePredictions } from "../api/predictions.js"
import styles from './Prediction.module.css'

function isFilled(v) {
    return v && v.home !== '' && v.away !== '' && !isNaN(parseInt(v.home, 10)) && !isNaN(parseInt(v.away, 10))
}

export default function Prediction() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [values, setValues] = useState({})
    const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error'
    const [incompleteIds, setIncompleteIds] = useState(new Set())
    const [loadError, setLoadError] = useState(null)

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
            .catch(() => setLoadError('Failed to load data'))
    }, [])

    function handleChange(matchId, home, away) {
        setValues(prev => ({ ...prev, [matchId]: { home, away } }))
    }

    async function handleSave() {
        setIncompleteIds(new Set())
        setSaveStatus(null)

        const allMatches = Object.values(groupedMatches).flat()
        const missing = new Set(allMatches.filter(m => !isFilled(values[m.id])).map(m => m.id))

        if (missing.size > 0) {
            setIncompleteIds(missing)
            return
        }

        const payload = allMatches.map(m => ({
            match_id: m.id,
            pred_home_goals: parseInt(values[m.id].home, 10),
            pred_away_goals: parseInt(values[m.id].away, 10),
        }))

        setSaveStatus('saving')
        try {
            await savePredictions(payload)
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus(null), 2000)
        } catch {
            setSaveStatus('error')
        }
    }

    if (loadError) return <p>{loadError}</p>
    if (!groupedMatches) return <p>Loading...</p>

    return (
        <>
            <h1>Prediction Page</h1>
            <TournamentNavigation
                data={{ matches: groupedMatches }}
                values={values}
                onChange={handleChange}
                incompleteIds={incompleteIds}
            />
            <div className={styles.saveBar}>
                {incompleteIds.size > 0 && (
                    <p className={styles.saveError}>Fill in all matches before saving</p>
                )}
                <button className={styles.saveBtn} onClick={handleSave} disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Save predictions'}
                </button>
            </div>
        </>
    )
}
