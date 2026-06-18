import styles from './GroupStandings.module.css'
import { FlagImg } from './FlagImg.jsx'

export function GroupStandings({ standings }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles.teamCol}>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GC</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => {
            const pos = i + 1
            const marker = pos <= 2 ? styles.qualifies : pos === 3 ? styles.third : ''
            const played = team.w + team.d + team.l
            return (
              <tr key={team.team_id} className={marker}>
                <td className={styles.pos}>{pos}</td>
                <td className={styles.teamCol}>
                  <FlagImg src={team.flag_url} width={20} alt={team.name} />
                  <span>{team.name}</span>
                </td>
                <td>{played}</td>
                <td>{team.w}</td>
                <td>{team.d}</td>
                <td>{team.l}</td>
                <td>{team.gf}</td>
                <td>{team.gc}</td>
                <td className={team.gd > 0 ? styles.pos_num : team.gd < 0 ? styles.neg_num : ''}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </td>
                <td className={styles.pts}>{team.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
