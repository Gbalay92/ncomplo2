import { useState, useEffect } from "react"
import { TournamentNavigation } from "../components/TournamentNavigation"
import { getMatches } from "../api/matches.js"

export default function Prediction() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        getMatches(null, 'group')
            .then(matches => {
                const grouped = {}
                for (const match of matches) {
                    const key = `Group ${match.group_name}`
                    if (!grouped[key]) grouped[key] = []
                    grouped[key].push(match)
                }
                setGroupedMatches(grouped)
            })
            .catch(() => setError('Failed to load matches'))
    }, [])

    if (error) return <p>{error}</p>
    if (!groupedMatches) return <p>Loading...</p>

    return (
        <>
            <h1>Prediction Page</h1>
            <TournamentNavigation data={{ matches: groupedMatches }} />
        </>
    )
}
