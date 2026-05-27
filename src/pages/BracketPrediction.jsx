import { useState, useEffect, useMemo } from 'react'
import { getMyQualifiers, getMyBracket, saveMyBracket } from '../api/bracket.js'
import { BracketMatchCard } from '../components/BracketMatchCard.jsx'
import { getFifaThirdAssignment, THIRD_SLOT_KEYS } from '../utils/fifaThirdPlaceTable.js'
import styles from './BracketPrediction.module.css'
import predStyles from './Prediction.module.css'

const STAGES = [
  { key: 'round_of_32',  label: 'R32' },
  { key: 'round_of_16',  label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final',   label: 'SF' },
  { key: 'final',        label: 'Final' },
]

function buildQualifiersMap(qualifiers) {
  const map = {}
  const thirds = []

  for (const q of qualifiers) {
    if (q.position <= 2) {
      map[`${q.position}${q.group_name}`] = q
    } else if (q.position === 3) {
      thirds.push(q)
    }
  }

  // Sort thirds by predicted performance to get the top 8 qualifying groups
  const sorted = thirds.sort((a, b) =>
    b.pred_points - a.pred_points || b.pred_gd - a.pred_gd || b.pred_gf - a.pred_gf
  )

  // Build a group → qualifier object map for quick lookup
  const thirdByGroup = Object.fromEntries(sorted.map(q => [q.group_name, q]))

  // Apply FIFA Annex C table to assign each third to the correct R32 slot
  const qualifyingGroups = sorted.slice(0, 8).map(q => q.group_name)
  const assignment = getFifaThirdAssignment(qualifyingGroups)

  if (assignment) {
    for (const [slotKey, group] of Object.entries(assignment)) {
      map[slotKey] = thirdByGroup[group]
    }
  } else {
    // Fallback: rank-based assignment (shouldn't happen with valid group data)
    sorted.slice(0, 8).forEach((q, i) => { map[THIRD_SLOT_KEYS[i]] = q })
  }

  return map
}

function getDownstreamSlotIds(slotLabel, slotsByLabel, picks, visited = new Set()) {
  if (visited.has(slotLabel)) return []
  visited.add(slotLabel)

  const affected = []
  for (const slot of Object.values(slotsByLabel)) {
    if (slot.home_source === slotLabel || slot.away_source === slotLabel) {
      if (picks[slot.slot_id]) affected.push(slot.slot_id)
      affected.push(...getDownstreamSlotIds(slot.slot_label, slotsByLabel, picks, visited))
    }
  }
  return affected
}

export default function BracketPrediction() {
  const [qualifiers, setQualifiers] = useState(null)
  const [slots, setSlots] = useState(null)
  const [picks, setPicks] = useState({})
  const [activeStage, setActiveStage] = useState('round_of_32')
  const [saveStatus, setSaveStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getMyQualifiers(), getMyBracket()])
      .then(([quals, bracket]) => {
        setQualifiers(quals)
        setSlots(bracket)

        const initialPicks = {}
        for (const slot of bracket) {
          if (slot.pred_winner_id) {
            initialPicks[slot.slot_id] = {
              team_id: slot.pred_winner_id,
              name: slot.pred_winner_name,
              flag_url: slot.pred_winner_flag,
            }
          }
        }
        setPicks(initialPicks)
      })
      .catch(() => setError('Failed to load bracket data'))
  }, [])

  const qualifiersMap = useMemo(() => {
    if (!qualifiers) return {}
    return buildQualifiersMap(qualifiers)
  }, [qualifiers])

  const slotsByLabel = useMemo(() => {
    if (!slots) return {}
    return Object.fromEntries(slots.map(s => [s.slot_label, s]))
  }, [slots])

  function getTeamsForSlot(slot) {
    const resolve = source =>
      qualifiersMap[source] ?? picks[slotsByLabel[source]?.slot_id] ?? null
    return { homeTeam: resolve(slot.home_source), awayTeam: resolve(slot.away_source) }
  }

  function handlePick(slot, team) {
    const downstream = [...new Set(getDownstreamSlotIds(slot.slot_label, slotsByLabel, picks))]

    if (downstream.length > 0) {
      if (!confirm('Changing this pick will clear your selections for subsequent rounds. Continue?')) return
      setPicks(prev => {
        const next = { ...prev }
        for (const id of downstream) delete next[id]
        next[slot.slot_id] = team
        return next
      })
    } else {
      setPicks(prev => ({ ...prev, [slot.slot_id]: team }))
    }
  }

  async function handleSave() {
    const payload = Object.entries(picks).map(([slot_id, team]) => ({
      slot_id,
      pred_winner_id: team.team_id,
    }))

    setSaveStatus('saving')
    try {
      await saveMyBracket(payload)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
    }
  }

  if (error) return <p>{error}</p>
  if (!slots || !qualifiers) return <p>Loading…</p>
  if (qualifiers.length === 0) return <p>Complete your group stage predictions first.</p>

  const activeSlots = slots.filter(s => s.stage === activeStage)
  const filledCount = Object.keys(picks).length
  const totalSlots = slots.length

  return (
    <>
      <main className={styles.page}>
        <h1>Bracket Prediction</h1>
        <p className={styles.progress}>{filledCount} / {totalSlots} picks made</p>

        <nav className={styles.stageNav}>
          {STAGES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.stageBtn} ${activeStage === key ? styles.active : ''}`}
              onClick={() => setActiveStage(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className={styles.matchList}>
          {activeSlots.map(slot => {
            const { homeTeam, awayTeam } = getTeamsForSlot(slot)
            return (
              <BracketMatchCard
                key={slot.slot_id}
                slot={slot}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                pickedTeamId={picks[slot.slot_id]?.team_id}
                onPick={team => handlePick(slot, team)}
              />
            )
          })}
        </div>
      </main>

      <div className={predStyles.saveBar}>
        <button
          className={predStyles.saveBtn}
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Save bracket'}
        </button>
      </div>
    </>
  )
}
