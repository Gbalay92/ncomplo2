import styles from './GroupStandings.module.css'

export function GroupStandings({ standings }) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles.teamCol}>Team</th>
            <th>Pts</th>
            <th>GD</th>
            <th>GF</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => {
            const pos = i + 1
            const marker = pos <= 2 ? styles.qualifies : pos === 3 ? styles.third : ''
            return (
              <tr key={team.team_id} className={marker}>
                <td className={styles.pos}>{pos}</td>
                <td className={styles.teamCol}>
                  {team.flag_url && <img src={team.flag_url} width="20" alt={team.name} />}
                  <span>{team.name}</span>
                </td>
                <td className={styles.pts}>{team.pts}</td>
                <td className={team.gd > 0 ? styles.pos_num : team.gd < 0 ? styles.neg_num : ''}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </td>
                <td>{team.gf}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
