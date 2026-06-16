import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { getUserPredictions, getUserBracket, getUserQualifiers, getUserProfile } from '../api/users.js'
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

function localDateKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function UserPredictions() {
  const { userId } = useParams()
  const location = useLocation()
  const [displayName, setDisplayName] = useState(location.state?.displayName ?? null)
  const [firstName, setFirstName] = useState(location.state?.firstName ?? null)
  const [lastName, setLastName] = useState(location.state?.lastName ?? null)

  const [groupedMatches, setGroupedMatches] = useState(null)
  const [allGroupMatches, setAllGroupMatches] = useState([])
  const [bracket, setBracket] = useState(null)
  const [qualifiersMap, setQualifiersMap] = useState({})
  const [activeTab, setActiveTab] = useState(null)
  const [groupView, setGroupView] = useState('date')
  const [activeDate, setActiveDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const profilePromise = (!location.state?.displayName)
      ? getUserProfile(userId).then(p => { setDisplayName(p.display_name); setFirstName(p.first_name); setLastName(p.last_name) }).catch(() => {})
      : Promise.resolve()

    Promise.all([getUserPredictions(userId), getUserBracket(userId), getUserQualifiers(userId), profilePromise])
      .then(([preds, brkt, quals]) => {
        if (preds === null) {
          setError('Predictions are not available yet')
          return
        }

        const grouped = {}
        for (const m of preds) {
          const key = `Group ${m.group_name}`
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(m)
        }
        setGroupedMatches(grouped)
        setAllGroupMatches(preds)
        const firstGroup = Object.keys(grouped)[0]
        if (firstGroup) setActiveTab(firstGroup)
        setBracket(brkt ?? [])

        const dateKeys = [...new Set(preds.map(m => localDateKey(m.match_date)))].sort()
        const todayKey = localDateKey(new Date().toISOString())
        setActiveDate(dateKeys.find(k => k >= todayKey) ?? dateKeys[dateKeys.length - 1])

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
      .catch(() => setError('Error loading predictions'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className={styles.page}><p>Loading…</p></div>
  if (error) return <div className={styles.page}><p className={styles.errorMsg}>{error}</p></div>

  const groupNames = Object.keys(groupedMatches)
  const isBracketTab = BRACKET_STAGES.some(s => s.key === activeTab)
  const isGroupTab = !isBracketTab

  const allTabs = [
    ...groupNames.map(name => ({ key: name, label: name.replace('Group ', ''), section: 'Groups' })),
    ...BRACKET_STAGES.map(s => ({ key: s.key, label: s.label, section: 'Knockout' })),
  ]
  const activeIndex = allTabs.findIndex(t => t.key === activeTab)
  const activeTabMeta = allTabs[activeIndex]
  const paginationLabel = activeTabMeta ? `${activeTabMeta.section} · ${activeTabMeta.label}` : ''

  const groupedByDate = {}
  for (const m of allGroupMatches) {
    const key = localDateKey(m.match_date)
    if (!groupedByDate[key]) groupedByDate[key] = []
    groupedByDate[key].push(m)
  }
  const dateKeys = Object.keys(groupedByDate).sort()
  const dateIdx = activeDate ? dateKeys.indexOf(activeDate) : 0

  const activeGroupMatches = groupView === 'group'
    ? (isGroupTab ? (groupedMatches[activeTab] ?? []) : [])
    : (groupedByDate[activeDate] ?? [])

  const showGroupContent = groupView === 'date' || isGroupTab
  const activeBracketSlots = isBracketTab ? bracket.filter(s => s.stage === activeTab) : []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/leaderboard" className={styles.backLink}>← Leaderboard</Link>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{displayName ?? 'Predictions'}</h1>
            {firstName && <p className={styles.realName}>{firstName} {lastName}</p>}
          </div>
          <div className={styles.viewToggle}>
            <button
              className={groupView === 'group' ? styles.toggleActive : ''}
              onClick={() => setGroupView('group')}
            >Group</button>
            <button
              className={groupView === 'date' ? styles.toggleActive : ''}
              onClick={() => setGroupView('date')}
            >Date</button>
          </div>
        </div>
      </header>

      <nav className={navStyles.stageNav}>
        {groupView === 'group' ? (
          <>
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
          </>
        ) : (
          <>
            <div className={navStyles.mobilePager} style={{ display: 'flex' }}>
              <button
                className={navStyles.pagerBtn}
                onClick={() => setActiveDate(dateKeys[dateIdx - 1])}
                disabled={dateIdx <= 0}
              >‹</button>
              <span className={navStyles.pagerLabel}>{activeDate ? formatDateLabel(activeDate) : ''}</span>
              <button
                className={navStyles.pagerBtn}
                onClick={() => setActiveDate(dateKeys[dateIdx + 1])}
                disabled={dateIdx >= dateKeys.length - 1}
              >›</button>
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
          </>
        )}
      </nav>

      {showGroupContent && !isBracketTab && (
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
