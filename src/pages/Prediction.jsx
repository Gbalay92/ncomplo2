import { useState, useEffect, useMemo } from "react"
import { getMatches } from "../api/matches.js"
import { getMyPredictions, savePredictions } from "../api/predictions.js"
import { getMyBracket, saveMyBracket } from "../api/bracket.js"
import { getTournamentSettings } from "../api/tournament.js"
import { MatchCard } from "../components/MatchCard.jsx"
import { BracketMatchCard } from "../components/BracketMatchCard.jsx"
import { GroupStandings } from "../components/GroupStandings.jsx"
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

function computeGroupStandings(matches, values) {
  const teams = {}

  for (const match of matches) {
    if (!teams[match.home_team_id]) {
      teams[match.home_team_id] = {
        team_id: match.home_team_id, name: match.home_team, flag_url: match.home_flag,
        pts: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, gd: 0,
      }
    }
    if (!teams[match.away_team_id]) {
      teams[match.away_team_id] = {
        team_id: match.away_team_id, name: match.away_team, flag_url: match.away_flag,
        pts: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, gd: 0,
      }
    }

    const val = values[match.id]
    if (!isFilled(val)) continue

    const hg = parseInt(val.home, 10)
    const ag = parseInt(val.away, 10)

    teams[match.home_team_id].gf += hg
    teams[match.home_team_id].gc += ag
    teams[match.home_team_id].gd += hg - ag
    teams[match.away_team_id].gf += ag
    teams[match.away_team_id].gc += hg
    teams[match.away_team_id].gd += ag - hg

    if (hg > ag) {
      teams[match.home_team_id].pts += 3; teams[match.home_team_id].w++
      teams[match.away_team_id].l++
    } else if (ag > hg) {
      teams[match.away_team_id].pts += 3; teams[match.away_team_id].w++
      teams[match.home_team_id].l++
    } else {
      teams[match.home_team_id].pts++; teams[match.home_team_id].d++
      teams[match.away_team_id].pts++; teams[match.away_team_id].d++
    }
  }

  return Object.values(teams).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
  )
}

function applyBracketCascade(picks, qualifiersMap, slots) {
  const resolved = { ...qualifiersMap }
  const cleared = new Set()
  const next = { ...picks }
  let changed = false

  for (const { key: stage } of BRACKET_STAGES) {
    for (const slot of slots.filter(s => s.stage === stage)) {
      const home = resolved[slot.home_source] ?? null
      const away = resolved[slot.away_source] ?? null
      const pick = next[slot.slot_id]
      const sourceCleared = cleared.has(slot.home_source) || cleared.has(slot.away_source)

      if (pick) {
        const valid = new Set([home?.team_id, away?.team_id].filter(Boolean))
        if (sourceCleared || !valid.has(pick.team_id)) {
          delete next[slot.slot_id]
          cleared.add(slot.slot_label)
          changed = true
        } else {
          resolved[slot.slot_label] = pick
        }
      } else if (sourceCleared) {
        cleared.add(slot.slot_label)
      }
    }
  }

  return { next, changed }
}

function buildLiveQualifiersMap(groupedMatches, values) {
  const map = {}
  const thirds = []

  for (const [groupKey, matches] of Object.entries(groupedMatches)) {
    const groupName = groupKey.replace('Group ', '')
    const standings = computeGroupStandings(matches, values)
    const allFilled = matches.every(m => isFilled(values[m.id]))

    standings.forEach((team, i) => {
      const pos = i + 1
      if (pos <= 2 && allFilled) {
        map[`${pos}${groupName}`] = team
      } else if (pos === 3 && allFilled) {
        thirds.push({ ...team, group_name: groupName })
      }
    })
  }

  thirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .forEach((t, i) => { map[`3rd_${i + 1}`] = t })

  return map
}

export default function Prediction() {
  // ── Group stage ──────────────────────────────────────────────
  const [groupedMatches, setGroupedMatches] = useState(null)
  const [values, setValues] = useState({})
  const [savedValues, setSavedValues] = useState({})
  // ── Bracket ──────────────────────────────────────────────────
  const [slots, setSlots] = useState(null)
  const [picks, setPicks] = useState({})
  const [savedPicks, setSavedPicks] = useState({})
  const [saveStatus, setSaveStatus] = useState(null)
  const [showWarnings, setShowWarnings] = useState(false)

  // ── Navigation ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(null)
  const [predictionsLocked, setPredictionsLocked] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    Promise.all([getMatches(null, 'group'), getMyPredictions(), getTournamentSettings(), getMyBracket()])
      .then(([matches, preds, settings, bracket]) => {
        setPredictionsLocked(settings.predictions_locked)

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
        setSavedValues(initial)

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
        setSavedPicks(initialPicks)
      })
      .catch(() => setLoadError('Failed to load data'))
  }, [])

  // ── Live qualifiers from current predictions ─────────────────
  const qualifiersMap = useMemo(() => {
    if (!groupedMatches) return {}
    return buildLiveQualifiersMap(groupedMatches, values)
  }, [groupedMatches, values])

  // ── Bracket slot lookup ──────────────────────────────────────
  const slotsByLabel = useMemo(() => {
    if (!slots) return {}
    return Object.fromEntries(slots.map(s => [s.slot_label, s]))
  }, [slots])

  // ── Cascade-clear picks when qualifiers change ───────────────
  useEffect(() => {
    if (!slots) return
    setPicks(prev => {
      const { next, changed } = applyBracketCascade(prev, qualifiersMap, slots)
      return changed ? next : prev
    })
  }, [qualifiersMap, slots])

  // ── Group handlers ───────────────────────────────────────────
  function handleChange(matchId, home, away) {
    setValues(prev => ({ ...prev, [matchId]: { home, away } }))
  }

  async function handleSave() {
    const unfilledGroups = Object.values(groupedMatches).flat().filter(m => !isFilled(values[m.id])).length
    const unpickedSlots = slots.filter(s => {
      const { homeTeam, awayTeam } = getTeamsForSlot(s)
      return homeTeam && awayTeam && !picks[s.slot_id]
    }).length

    if (unfilledGroups > 0 || unpickedSlots > 0) {
      const parts = []
      if (unfilledGroups > 0) parts.push(`${unfilledGroups} partido${unfilledGroups > 1 ? 's' : ''} de grupos sin resultado`)
      if (unpickedSlots > 0) parts.push(`${unpickedSlots} cruce${unpickedSlots > 1 ? 's' : ''} sin ganador`)
      setShowWarnings(true)
      if (!confirm(`${parts.join(' y ')}. ¿Guardar igualmente?`)) return
    }

    setSaveStatus('saving')
    try {
      if (isGroupDirty) {
        const filledMatches = Object.values(groupedMatches).flat().filter(m => isFilled(values[m.id]))
        if (filledMatches.length) {
          await savePredictions(filledMatches.map(m => ({
            match_id: m.id,
            pred_home_goals: parseInt(values[m.id].home, 10),
            pred_away_goals: parseInt(values[m.id].away, 10),
          })))
          setSavedValues(values)
        }
      }
      if (isBracketDirty) {
        await saveMyBracket(Object.entries(picks).map(([slot_id, team]) => ({
          slot_id,
          pred_winner_id: team.team_id,
        })))
        setSavedPicks(picks)
      }
      setSaveStatus('saved')
      setShowWarnings(false)
      setTimeout(() => setSaveStatus(null), 2000)
    } catch {
      setSaveStatus('error')
    }
  }

  // ── Bracket helpers ──────────────────────────────────────────
  function getTeamsForSlot(slot) {
    const resolve = source => qualifiersMap[source] ?? picks[slotsByLabel[source]?.slot_id] ?? null
    return { homeTeam: resolve(slot.home_source), awayTeam: resolve(slot.away_source) }
  }

  function handlePick(slot, team) {
    setPicks(prev => {
      const { next } = applyBracketCascade({ ...prev, [slot.slot_id]: team }, qualifiersMap, slots)
      return next
    })
  }

  // ── Render ───────────────────────────────────────────────────
  if (loadError) return <p>{loadError}</p>
  if (!groupedMatches || !slots) return <p>Loading…</p>

  const groupNames = Object.keys(groupedMatches)
  const isBracketTab = BRACKET_STAGES.some(s => s.key === activeTab)
  const isGroupTab = !isBracketTab

  const activeGroupMatches = isGroupTab ? (groupedMatches[activeTab] ?? []) : []
  const activeBracketSlots = isBracketTab ? slots.filter(s => s.stage === activeTab) : []

  const allTabs = [
    ...groupNames.map(name => ({ key: name, label: name.replace('Group ', ''), section: 'Groups' })),
    ...BRACKET_STAGES.map(s => ({ key: s.key, label: s.label, section: 'Knockout' })),
  ]
  const activeIndex = allTabs.findIndex(t => t.key === activeTab)
  const activeTabMeta = allTabs[activeIndex]
  const paginationLabel = activeTabMeta ? `${activeTabMeta.section} · ${activeTabMeta.label}` : ''

  const isGroupDirty = groupNames.some(name =>
    groupedMatches[name].some(m => {
      const cur = values[m.id]
      const sav = savedValues[m.id]
      if (!cur && !sav) return false
      if (!cur || !sav) return true
      return cur.home !== sav.home || cur.away !== sav.away
    })
  )

  const isBracketDirty = JSON.stringify(
    Object.fromEntries(Object.entries(picks).map(([k, v]) => [k, v.team_id]))
  ) !== JSON.stringify(
    Object.fromEntries(Object.entries(savedPicks).map(([k, v]) => [k, v.team_id]))
  )

  const activeStandings = isGroupTab && activeTab
    ? computeGroupStandings(groupedMatches[activeTab] ?? [], values)
    : []

  return (
    <>
      <main style={{ paddingBottom: '5rem' }}>
        <nav className={navStyles.stageNav}>
          {/* Desktop: two rows */}
          <div className={navStyles.desktopNav}>
            <div className={navStyles.stageRow}>
              <span className={navStyles.stageLabel}>Groups</span>
              {groupNames.map(name => (
                <button
                  key={name}
                  className={activeTab === name ? navStyles.active : ''}
                  onClick={() => setActiveTab(name)}
                >
                  {name.replace('Group ', '')}
                </button>
              ))}
            </div>
            <div className={navStyles.stageRow}>
              <span className={navStyles.stageLabel}>Knockout</span>
              {BRACKET_STAGES.map(({ key, label }) => (
                <button
                  key={key}
                  className={activeTab === key ? navStyles.active : ''}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: pagination */}
          <div className={navStyles.mobilePager}>
            <button
              className={navStyles.pagerBtn}
              onClick={() => setActiveTab(allTabs[activeIndex - 1].key)}
              disabled={activeIndex === 0}
            >◀</button>
            <span className={navStyles.pagerLabel}>{paginationLabel}</span>
            <button
              className={navStyles.pagerBtn}
              onClick={() => setActiveTab(allTabs[activeIndex + 1].key)}
              disabled={activeIndex === allTabs.length - 1}
            >▶</button>
          </div>
        </nav>

        {isGroupTab && (
          <div className={styles.groupLayout}>
            <div className={styles.matchList}>
              {activeGroupMatches.map(match => (
                <MatchCard
                  key={match.match_number}
                  match={match}
                  value={values[match.id]}
                  onChange={handleChange}
                  readOnly={predictionsLocked}
                  incomplete={showWarnings && !isFilled(values[match.id])}
                />
              ))}
            </div>
            <div className={styles.standingsPanel}>
              <GroupStandings standings={activeStandings} />
            </div>
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
                  onPick={predictionsLocked ? undefined : team => handlePick(slot, team)}
                  warn={showWarnings && !!homeTeam && !!awayTeam && !picks[slot.slot_id]}
                />
              )
            })}
          </div>
        )}
      </main>

      <div className={styles.saveBar}>
        {predictionsLocked ? (
          <p className={styles.saveError}>Predictions are locked</p>
        ) : (
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || (!isGroupDirty && !isBracketDirty)}
          >
            {saveStatus === 'saving' ? 'Saving…'
              : saveStatus === 'saved' ? '✓ Saved'
              : saveStatus === 'error' ? 'Error — retry'
              : 'Save predictions'}
          </button>
        )}
      </div>
    </>
  )
}
