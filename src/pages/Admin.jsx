import { useState, useEffect } from 'react'
import { getMatches } from '../api/matches.js'
import { saveMatchResult, lockGroupStage } from '../api/admin.js'
import { AdminMatchCard } from '../components/AdminMatchCard.jsx'
import styles from './Admin.module.css'
import navStyles from '../components/TournamentNavigation.module.css'

export default function Admin() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [activeGroup, setActiveGroup] = useState(null)
    const [savedResults, setSavedResults] = useState({})
    const [expandedId, setExpandedId] = useState(null)
    const [lockStatus, setLockStatus] = useState(null)
    const [lockError, setLockError] = useState(null)
    const [loadError, setLoadError] = useState(null)

    useEffect(() => {
        getMatches(null, 'group')
            .then(matches => {
                const grouped = {}
                const initial = {}
                for (const match of matches) {
                    const key = `Group ${match.group_name}`
                    if (!grouped[key]) grouped[key] = []
                    grouped[key].push(match)
                    if (match.real_home_goals != null) {
                        initial[match.id] = true
                    }
                }
                setGroupedMatches(grouped)
                setActiveGroup(Object.keys(grouped)[0])
                setSavedResults(initial)
            })
            .catch(() => setLoadError('Failed to load matches'))
    }, [])

    async function handleSave(matchId, homeGoals, awayGoals) {
        await saveMatchResult(matchId, homeGoals, awayGoals)
        setSavedResults(prev => ({ ...prev, [matchId]: true }))
    }

    async function handleLock() {
        if (!confirm('Lock the group stage? This will seed the real knockout bracket and cannot be undone.')) return
        setLockStatus('locking')
        setLockError(null)
        try {
            await lockGroupStage()
            setLockStatus('locked')
        } catch {
            setLockStatus(null)
            setLockError('Failed to lock group stage. Make sure all 72 results are entered.')
        }
    }

    if (loadError) return <p>{loadError}</p>
    if (!groupedMatches) return <p>Loading…</p>

    const allMatches = Object.values(groupedMatches).flat()
    const filledCount = Object.keys(savedResults).length
    const allFilled = filledCount === allMatches.length

    const currentMatches = groupedMatches[activeGroup] ?? []

    return (
        <main className={styles.adminPage}>
            <h1>Admin Panel</h1>

            <section className={styles.groupStage}>
                <h2>Group Stage Results</h2>
                <p className={styles.progress}>{filledCount} / {allMatches.length} results entered</p>

                <nav className={navStyles.groupsNav}>
                    {Object.keys(groupedMatches).map(name => (
                        <button
                            key={name}
                            className={activeGroup === name ? navStyles.active : ''}
                            onClick={() => setActiveGroup(name)}
                        >
                            {name}
                        </button>
                    ))}
                </nav>

                <div className={styles.matchList}>
                    {currentMatches.map(match => (
                        <AdminMatchCard
                            key={match.id}
                            match={match}
                            isExpanded={expandedId === match.id}
                            onToggle={() => setExpandedId(prev => prev === match.id ? null : match.id)}
                            onSave={handleSave}
                        />
                    ))}
                </div>
            </section>

            <section className={styles.lockSection}>
                <h2>Lock Group Stage</h2>
                <p>Once all 72 results are entered, lock the group stage to seed the knockout bracket.</p>
                {lockError && <p className={styles.lockError}>{lockError}</p>}
                {lockStatus === 'locked'
                    ? <p className={styles.lockSuccess}>Group stage locked. Knockout bracket seeded.</p>
                    : (
                        <button
                            className={styles.lockBtn}
                            onClick={handleLock}
                            disabled={!allFilled || lockStatus === 'locking'}
                        >
                            {lockStatus === 'locking' ? 'Locking…' : `Lock group stage (${filledCount}/72)`}
                        </button>
                    )
                }
            </section>
        </main>
    )
}
