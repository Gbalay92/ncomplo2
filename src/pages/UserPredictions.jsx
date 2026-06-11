import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { getUserPredictions, getUserBracket, getUserQualifiers } from '../api/users.js'
import { getFifaThirdAssignment, THIRD_SLOT_KEYS } from '../utils/fifaThirdPlaceTable.js'
import { MatchCard } from '../components/MatchCard.jsx'
import { BracketMatchCard } from '../components/BracketMatchCard.jsx'
import styles from './UserPredictions.module.css'
import navStyles from '../components/TournamentNavigation.module.css'

const BRACKET_STAGES = [
  { key: 'round_of_32',   label: 'R32' },
  { key: 'round_of_16',   label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final',    label: 'SF' },
  { key: 'final',         label: 'Final' },
]


export default function UserPredictions() {
  const { userId } = useParams()
  const location = useLocation()
  const displayName = location.state?.displayName

  const [groupedMatches, setGroupedMatches] = useState(null)
  const [bracket, setBracket] = useState(null)
  const [qualifiersMap, setQualifiersMap] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getUserPredictions(userId), getUserBracket(userId), getUserQualifiers(userId)])
      .then(([preds, brkt, quals]) => {
        if (preds === null) {
          setError('Las predicciones aún no están disponibles')
          return
        }

        const grouped = {}
        for (const m of preds) {
          const key = `Group ${m.group_name}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(m)
        }
        setGroupedMatches(grouped)
        const firstGroup = Object.keys(grouped)[0]
        if (firstGroup) setActiveTab(firstGroup)
        setBracket(brkt ?? [])

        // Build qualifiers map same as BracketPrediction
        const map = {}
        const thirds = []
        for (const q of (quals ?? [])) {
          if (q.position <= 2) {
            map[`${q.position}${q.group_name}`] = q
          } else if (q.position === 3) {
            thirds.push(q)
          }
        }
        const sorted = thirds.sort((a, b) =>
          b.pred_points - a.pred_points || b.pred_gd - a.pred_gd || b.pred_gf - a.pred_gf
        )
        const thirdByGroup = Object.fromEntries(sorted.map(q => [q.group_name, q]))
        const qualifyingGroups = sorted.slice(0, 8).map(q => q.group_name)
        const assignment = getFifaThirdAssignment(qualifyingGroups)
        if (assignment) {
          for (const [slotKey, group] of Object.entries(assignment)) {
            map[slotKey] = thirdByGroup[group]
          }
        } else {
          sorted.slice(0, 8).forEach((q, i) => { map[THIRD_SLOT_KEYS[i]] = q })
        }
        setQualifiersMap(map)
      })
      .catch(() => setError('Error al cargar las predicciones'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className={styles.page}><p>Cargando…</p></div>
  if (error) return <div className={styles.page}><p className={styles.errorMsg}>{error}</p></div>

  const groupNames = Object.keys(groupedMatches)
  const isBracketTab = BRACKET_STAGES.some(s => s.key === activeTab)
  const isGroupTab = !isBracketTab

  const allTabs = [
    ...groupNames.map(name => ({ key: name, label: name.replace('Group ', ''), section: 'Grupos' })),
    ...BRACKET_STAGES.map(s => ({ key: s.key, label: s.label, section: 'Knockout' })),
  ]
  const activeIndex = allTabs.findIndex(t => t.key === activeTab)
  const activeTabMeta = allTabs[activeIndex]
  const paginationLabel = activeTabMeta ? `${activeTabMeta.section} · ${activeTabMeta.label}` : ''

  const activeGroupMatches = isGroupTab ? (groupedMatches[activeTab] ?? []) : []
  const activeBracketSlots = isBracketTab ? bracket.filter(s => s.stage === activeTab) : []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/leaderboard" className={styles.backLink}>← Leaderboard</Link>
        <h1 className={styles.title}>{displayName ?? 'Predicciones'}</h1>
      </header>

      <nav className={navStyles.stageNav}>
        <div className={navStyles.desktopNav}>
          <div className={navStyles.stageRow}>
            <span className={navStyles.stageLabel}>Grupos</span>
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
        <div className={styles.matchList}>
          {activeGroupMatches.map(m => (
            <MatchCard
              key={m.id}
              match={m}
              value={{ home: String(m.pred_home_goals ?? ''), away: String(m.pred_away_goals ?? '') }}
              readOnly={true}
            />
          ))}
        </div>
      )}

      {isBracketTab && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
          {activeBracketSlots.map(slot => {
            const slotsByLabel = Object.fromEntries(bracket.map(s => [s.slot_label, s]))
            const picksByLabel = Object.fromEntries(
              bracket
                .filter(s => s.pred_winner_id)
                .map(s => [s.slot_label, { team_id: s.pred_winner_id, name: s.pred_winner_name, flag_url: s.pred_winner_flag }])
            )
            const resolve = source => qualifiersMap[source] ?? picksByLabel[source] ?? null
            const homeTeam = resolve(slot.home_source)
            const awayTeam = resolve(slot.away_source)
            return (
              <BracketMatchCard
                key={slot.slot_id}
                slot={slot}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                pickedTeamId={slot.pred_winner_id}
                onPick={undefined}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
