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

function buildLiveQualifiersMap(groupedMatches, values) {
  const map = {}
  const thirds = []

  for (const [groupKey, matches] of Object.entries(groupedMatches)) {
    const groupName = groupKey.replace('Group ', '')
    const standings = computeGroupStandings(matches, values)

    standings.forEach((team, i) => {
      const pos = i + 1
      if (pos <= 2) {
        map[`${pos}${groupName}`] = team
      } else if (pos === 3) {
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
  const [saveGroupStatus, setSaveGroupStatus] = useState(null)

  // ── Bracket ──────────────────────────────────────────────────
  const [slots, setSlots] = useState(null)
  const [picks, setPicks] = useState({})
  const [savedPicks, setSavedPicks] = useState({})
  const [saveBracketStatus, setSaveBracketStatus] = useState(null)

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
    if (!slots || !slotsByLabel) return
    setPicks(prev => {
      let next = { ...prev }
      let changed = false
      for (const { key: stage } of BRACKET_STAGES) {
        for (const slot of slots.filter(s => s.stage === stage)) {
          const pick = next[slot.slot_id]
          if (!pick) continue
          const resolve = src => qualifiersMap[src] ?? next[slotsByLabel[src]?.slot_id] ?? null
          const home = resolve(slot.home_source)
          const away = resolve(slot.away_source)
          const valid = new Set([home?.team_id, away?.team_id].filter(Boolean))
          if (!valid.has(pick.team_id)) {
            delete next[slot.slot_id]
            changed = true
          }
        }
      }
      return changed ? next : prev
    })
  }, [qualifiersMap, slots, slotsByLabel])

  // ── Group handlers ───────────────────────────────────────────
  function handleChange(matchId, home, away) {
    setValues(prev => ({ ...prev, [matchId]: { home, away } }))
  }

  async function handleSaveGroup() {
    setSaveGroupStatus(null)

    const allMatches = Object.values(groupedMatches).flat()
    const filledMatches = allMatches.filter(m => isFilled(values[m.id]))
    if (!filledMatches.length) return

    const hasBracketPicks = Object.keys(picks).length > 0
    if (hasBracketPicks && isGroupDirty) {
      if (!confirm('Saving group predictions will clear your bracket. Continue?')) return
    }

    const payload = filledMatches.map(m => ({
      match_id: m.id,
      pred_home_goals: parseInt(values[m.id].home, 10),
      pred_away_goals: parseInt(values[m.id].away, 10),
    }))

    setSaveGroupStatus('saving')
    try {
      await savePredictions(payload)
      setSavedValues(values)
      if (hasBracketPicks && isGroupDirty) {
        await saveMyBracket([])
        setPicks({})
        setSavedPicks({})
      }
      setSaveGroupStatus('saved')
      setTimeout(() => setSaveGroupStatus(null), 2000)
    } catch {
      setSaveGroupStatus('error')
    }
  }

  // ── Bracket handlers ─────────────────────────────────────────
  function getTeamsForSlot(slot) {
    const resolve = source => qualifiersMap[source] ?? picks[slotsByLabel[source]?.slot_id] ?? null
    return { homeTeam: resolve(slot.home_source), awayTeam: resolve(slot.away_source) }
  }

  function handlePick(slot, team) {
    const stageIndex = BRACKET_STAGES.findIndex(s => s.key === slot.stage)
    const laterKeys = new Set(BRACKET_STAGES.slice(stageIndex + 1).map(s => s.key))
    const laterIds = slots.filter(s => laterKeys.has(s.stage)).map(s => s.slot_id)
    const hasPicks = laterIds.some(id => picks[id])

    if (hasPicks) {
      if (!confirm('Changing this pick will clear all subsequent round selections. Continue?')) return
      setPicks(prev => {
        const next = { ...prev }
        for (const id of laterIds) delete next[id]
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
      setSavedPicks(picks)
      setSaveBracketStatus('saved')
      setTimeout(() => setSaveBracketStatus(null), 2000)
    } catch {
      setSaveBracketStatus('error')
    }
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
                />
              )
            })}
          </div>
        )}
      </main>

      {isGroupTab && !predictionsLocked && (
        <div className={styles.saveBar}>
          <button
            className={styles.saveBtn}
            onClick={handleSaveGroup}
            disabled={saveGroupStatus === 'saving' || !isGroupDirty}
          >
            {saveGroupStatus === 'saving' ? 'Saving…'
              : saveGroupStatus === 'saved' ? '✓ Saved'
              : saveGroupStatus === 'error' ? 'Error — retry'
              : 'Save predictions'}
          </button>
        </div>
      )}

      {predictionsLocked && (
        <div className={styles.saveBar}>
          <p className={styles.saveError}>Predictions are locked</p>
        </div>
      )}

      {isBracketTab && !predictionsLocked && (
        <div className={styles.saveBar}>
          <button
            className={styles.saveBtn}
            onClick={handleSaveBracket}
            disabled={saveBracketStatus === 'saving' || !isBracketDirty}
          >
            {saveBracketStatus === 'saving' ? 'Saving…'
              : saveBracketStatus === 'saved' ? '✓ Saved'
              : saveBracketStatus === 'error' ? 'Error — retry'
              : 'Save bracket'}
          </button>
        </div>
      )}
    </>
  )
}
