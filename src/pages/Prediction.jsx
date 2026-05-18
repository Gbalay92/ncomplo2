import { useState, useEffect, useMemo } from "react"
import { getMatches } from "../api/matches.js"
import { getMyPredictions, savePredictions } from "../api/predictions.js"
import { getMyQualifiers, getMyBracket, saveMyBracket } from "../api/bracket.js"
import { MatchCard } from "../components/MatchCard.jsx"
import { BracketMatchCard } from "../components/BracketMatchCard.jsx"
import styles from './Prediction.module.css'
import navStyles from '../components/TournamentNavigation.module.css'

const BRACKET_STAGES = [
  { key: 'round_of_32',   label: 'R32' },
  { key: 'round_of_16',   label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final',    label: 'SF' },
  { key: 'final',         label: 'Final' },
]

function isFilled(v) {
  return v && v.home !== '' && v.away !== '' && !isNaN(parseInt(v.home, 10)) && !isNaN(parseInt(v.away, 10))
}

function buildQualifiersMap(qualifiers) {
  const map = {}
  const thirds = []
  for (const q of qualifiers) {
    if (q.position <= 2) map[`${q.position}${q.group_name}`] = q
    else if (q.position === 3) thirds.push(q)
  }
  thirds
    .sort((a, b) => b.pred_points - a.pred_points || b.pred_gd - a.pred_gd || b.pred_gf - a.pred_gf)
    .forEach((q, i) => { map[`3rd_${i + 1}`] = q })
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

export default function Prediction() {
  // ── Group stage ──────────────────────────────────────────────
  const [groupedMatches, setGroupedMatches] = useState(null)
  const [values, setValues] = useState({})
  const [saveGroupStatus, setSaveGroupStatus] = useState(null)
  const [incompleteIds, setIncompleteIds] = useState(new Set())
  const [bracketAvailable, setBracketAvailable] = useState(false)

  // ── Bracket ──────────────────────────────────────────────────
  const [slots, setSlots] = useState(null)
  const [qualifiers, setQualifiers] = useState(null)
  const [picks, setPicks] = useState({})
  const [saveBracketStatus, setSaveBracketStatus] = useState(null)

  // ── Navigation ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(null)
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
        setActiveTab(`Group ${matches[0].group_name}`)

        const initial = {}
        for (const p of preds) {
          initial[p.match_id] = { home: String(p.pred_home_goals), away: String(p.pred_away_goals) }
        }
        setValues(initial)
        setBracketAvailable(preds.length === matches.length)
      })
      .catch(() => setLoadError('Failed to load data'))
  }, [])

  useEffect(() => {
    if (!bracketAvailable) return
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
      .catch(() => {})
  }, [bracketAvailable])

  // ── Group handlers ───────────────────────────────────────────
  function handleChange(matchId, home, away) {
    setValues(prev => ({ ...prev, [matchId]: { home, away } }))
  }

  async function handleSaveGroup() {
    setIncompleteIds(new Set())
    setSaveGroupStatus(null)

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

    setSaveGroupStatus('saving')
    try {
      await savePredictions(payload)
      setSaveGroupStatus('saved')
      setBracketAvailable(true)
      setTimeout(() => setSaveGroupStatus(null), 2000)
    } catch {
      setSaveGroupStatus('error')
    }
  }

  // ── Bracket handlers ─────────────────────────────────────────
  const qualifiersMap = useMemo(() => {
    if (!qualifiers) return {}
    return buildQualifiersMap(qualifiers)
  }, [qualifiers])

  const slotsByLabel = useMemo(() => {
    if (!slots) return {}
    return Object.fromEntries(slots.map(s => [s.slot_label, s]))
  }, [slots])

  function getTeamsForSlot(slot) {
    const resolve = source => qualifiersMap[source] ?? picks[slotsByLabel[source]?.slot_id] ?? null
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

  async function handleSaveBracket() {
    const payload = Object.entries(picks).map(([slot_id, team]) => ({
      slot_id,
      pred_winner_id: team.team_id,
    }))
    setSaveBracketStatus('saving')
    try {
      await saveMyBracket(payload)
      setSaveBracketStatus('saved')
      setTimeout(() => setSaveBracketStatus(null), 2000)
    } catch {
      setSaveBracketStatus('error')
    }
  }

  // ── Render ───────────────────────────────────────────────────
  if (loadError) return <p>{loadError}</p>
  if (!groupedMatches) return <p>Loading…</p>

  const groupNames = Object.keys(groupedMatches)
  const isBracketTab = BRACKET_STAGES.some(s => s.key === activeTab)
  const isGroupTab = !isBracketTab

  const incompleteGroups = new Set(
    groupNames.filter(name => groupedMatches[name].some(m => incompleteIds.has(m.id)))
  )

  const activeGroupMatches = isGroupTab ? (groupedMatches[activeTab] ?? []) : []
  const activeBracketSlots = isBracketTab && slots ? slots.filter(s => s.stage === activeTab) : []

  return (
    <>
      <main style={{ paddingBottom: '5rem' }}>
        <nav className={navStyles.groupsNav}>
          {groupNames.map(name => (
            <button
              key={name}
              className={[
                activeTab === name ? navStyles.active : '',
                incompleteGroups.has(name) ? navStyles.incomplete : '',
              ].join(' ')}
              onClick={() => setActiveTab(name)}
            >
              {name}
            </button>
          ))}

          {bracketAvailable && BRACKET_STAGES.map(({ key, label }, i) => (
            <button
              key={key}
              className={activeTab === key ? navStyles.active : ''}
              onClick={() => setActiveTab(key)}
              style={i === 0 ? { borderLeft: '2px solid var(--border)', marginLeft: '0.25rem', paddingLeft: '1rem' } : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        {isGroupTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1rem' }}>
            {activeGroupMatches.map(match => (
              <MatchCard
                key={match.match_number}
                match={match}
                value={values[match.id]}
                onChange={handleChange}
                incomplete={incompleteIds.has(match.id)}
              />
            ))}
          </div>
        )}

        {isBracketTab && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {activeBracketSlots.map(slot => {
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
        )}
      </main>

      {isGroupTab && (
        <div className={styles.saveBar}>
          {incompleteIds.size > 0 && <p className={styles.saveError}>Fill in all matches before saving</p>}
          <button className={styles.saveBtn} onClick={handleSaveGroup} disabled={saveGroupStatus === 'saving'}>
            {saveGroupStatus === 'saving' ? 'Saving…' : saveGroupStatus === 'saved' ? '✓ Saved' : saveGroupStatus === 'error' ? 'Error — retry' : 'Save predictions'}
          </button>
        </div>
      )}

      {isBracketTab && (
        <div className={styles.saveBar}>
          <button className={styles.saveBtn} onClick={handleSaveBracket} disabled={saveBracketStatus === 'saving'}>
            {saveBracketStatus === 'saving' ? 'Saving…' : saveBracketStatus === 'saved' ? '✓ Saved' : saveBracketStatus === 'error' ? 'Error — retry' : 'Save bracket'}
          </button>
        </div>
      )}
    </>
  )
}
