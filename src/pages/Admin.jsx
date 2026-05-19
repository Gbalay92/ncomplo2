import { useState, useEffect } from 'react'
import { getMatches } from '../api/matches.js'
import { getAdminBracket, saveMatchResult, saveKnockoutResult, lockPredictions, lockGroupStage } from '../api/admin.js'
import { getTournamentSettings } from '../api/tournament.js'
import { AdminMatchCard } from '../components/AdminMatchCard.jsx'
import { AdminKnockoutCard } from '../components/AdminKnockoutCard.jsx'
import styles from './Admin.module.css'
import navStyles from '../components/TournamentNavigation.module.css'

export default function Admin() {
    const [groupedMatches, setGroupedMatches] = useState(null)
    const [activeGroup, setActiveGroup] = useState(null)
    const [savedResults, setSavedResults] = useState({})
    const [expandedId, setExpandedId] = useState(null)
    const [knockoutSlots, setKnockoutSlots] = useState(null)
    const [activeKnockoutStage, setActiveKnockoutStage] = useState('round_of_32')
    const [expandedKnockoutId, setExpandedKnockoutId] = useState(null)
    const [predLockStatus, setPredLockStatus] = useState(null)
    const [predLockError, setPredLockError] = useState(null)
    const [lockStatus, setLockStatus] = useState(null)
    const [lockError, setLockError] = useState(null)
    const [loadError, setLoadError] = useState(null)

    useEffect(() => {
        getTournamentSettings()
            .then(settings => {
                if (settings.predictions_locked) setPredLockStatus('locked')
                if (settings.group_stage_locked) {
                    setLockStatus('locked')
                    getAdminBracket().then(setKnockoutSlots).catch(() => {})
                }
            })
            .catch(() => {})
    }, [])

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

    async function handleSaveKnockout(slotId, homeGoals, awayGoals, winnerId) {
        await saveKnockoutResult(slotId, homeGoals, awayGoals, winnerId)
        setKnockoutSlots(prev => prev.map(s =>
            s.slot_id === slotId
                ? { ...s, real_home_goals: homeGoals, real_away_goals: awayGoals, real_winner_id: winnerId }
                : s
        ))
    }

    async function handleLockPredictions() {
        if (!confirm('Lock all predictions? Users will no longer be able to edit their group or bracket predictions. This cannot be undone.')) return
        setPredLockStatus('locking')
        setPredLockError(null)
        try {
            await lockPredictions()
            setPredLockStatus('locked')
        } catch {
            setPredLockStatus(null)
            setPredLockError('Failed to lock predictions.')
        }
    }

    async function handleLock() {
        if (!confirm('Lock the group stage? This will seed the real knockout bracket and cannot be undone.')) return
        setLockStatus('locking')
        setLockError(null)
        try {
            await lockGroupStage()
            setLockStatus('locked')
            getAdminBracket().then(setKnockoutSlots).catch(() => {})
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

                <nav className={navStyles.stageNav}>
                    <div className={navStyles.stageRow}>
                        {Object.keys(groupedMatches).map(name => (
                            <button
                                key={name}
                                className={activeGroup === name ? navStyles.active : ''}
                                onClick={() => setActiveGroup(name)}
                            >
                                <span className={navStyles.groupWord}>Group </span>{name.replace('Group ', '')}
                            </button>
                        ))}
                    </div>
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
                <h2>Lock Predictions</h2>
                <p>Prevent all users from editing their group and bracket predictions. Do this before the tournament starts.</p>
                {predLockError && <p className={styles.lockError}>{predLockError}</p>}
                {predLockStatus === 'locked'
                    ? <p className={styles.lockSuccess}>Predictions are locked.</p>
                    : (
                        <button
                            className={styles.lockBtn}
                            onClick={handleLockPredictions}
                            disabled={predLockStatus === 'locking'}
                        >
                            {predLockStatus === 'locking' ? 'Locking…' : 'Lock predictions'}
                        </button>
                    )
                }
            </section>

            {knockoutSlots && (() => {
                const STAGES = [
                    { key: 'round_of_32', label: 'R32' },
                    { key: 'round_of_16', label: 'R16' },
                    { key: 'quarter_final', label: 'QF' },
                    { key: 'semi_final', label: 'SF' },
                    { key: 'final', label: 'Final' },
                ]
                const activeSlots = knockoutSlots.filter(s => s.stage === activeKnockoutStage)
                const filledKnockout = knockoutSlots.filter(s => s.real_home_goals != null).length

                return (
                    <section className={styles.groupStage}>
                        <h2>Knockout Results</h2>
                        <p className={styles.progress}>{filledKnockout} / {knockoutSlots.length} results entered</p>

                        <nav className={navStyles.stageNav}>
                            <div className={navStyles.stageRow}>
                                {STAGES.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        className={activeKnockoutStage === key ? navStyles.active : ''}
                                        onClick={() => { setActiveKnockoutStage(key); setExpandedKnockoutId(null) }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </nav>

                        <div className={styles.matchList}>
                            {activeSlots.map(slot => (
                                <AdminKnockoutCard
                                    key={slot.slot_id}
                                    slot={slot}
                                    isExpanded={expandedKnockoutId === slot.slot_id}
                                    onToggle={() => setExpandedKnockoutId(prev => prev === slot.slot_id ? null : slot.slot_id)}
                                    onSave={handleSaveKnockout}
                                />
                            ))}
                        </div>
                    </section>
                )
            })()}

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
