export const BRACKET_STAGES = [
  { key: 'round_of_32',   label: 'R32' },
  { key: 'round_of_16',   label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final',    label: 'SF' },
  { key: 'final',         label: 'Final' },
]

// Label of what the CURRENT stage's predicted winners represent —
// i.e. the round they qualify into, or 'Champion' once only the final is left.
const NEXT_LABEL = {
  round_of_32: 'R16',
  round_of_16: 'QF',
  quarter_final: 'SF',
  semi_final: 'Final',
  final: 'Champion',
}

export function nextStageLabel(stage) {
  return NEXT_LABEL[stage] ?? stage
}

// Picks the first knockout stage that hasn't fully finished in reality —
// i.e. the stage whose predicted picks represent qualifiers to the next round.
// Once every stage up to the final has a winner, defaults to 'final' (the champion pick).
export function currentKnockoutStage(knockoutMatches) {
  for (const { key } of BRACKET_STAGES) {
    const stageMatches = knockoutMatches.filter(m => m.stage === key)
    const resolvedMatches = stageMatches.filter(m => m.home_team && m.away_team)
    const allDecided = resolvedMatches.length > 0 && resolvedMatches.every(m => m.winner)
    if (!allDecided) return key
  }
  return 'final'
}
