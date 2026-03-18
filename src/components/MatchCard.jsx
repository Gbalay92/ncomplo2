import styles from './Matches.module.css'
import { useEffect, useState } from 'react'
import countryCodes from '../countries.json'

function TeamDisplay({ teamName, score }) {
  const [flagCode, setFlagCode] = useState('aq')
  
	useEffect(() => {
    const code = countryCodes[teamName]
    if (code) {
      setFlagCode(code)
    } else {
      console.warn(`No se encontró el código de país para ${teamName}`)
    }
  }, [teamName])
	

	return (
		<div className={styles.countryDisplay}>
			<article className={styles.flagContainer}>
			<img src={`https://flagcdn.com/16x12/${flagCode}.png`}
					srcSet={`https://flagcdn.com/32x24/${flagCode}.png 2x,
						https://flagcdn.com/48x36/${flagCode}.png 3x`}
					width="16"
					height="12" 
					alt={`Bandera de ${teamName}`}/>
				</article>
			<span>{teamName}</span>
		</div>
		)
}

export function MatchCard({ match }) {
  const { 
    home_team, 
    away_team, 
  } = match

  return (
    <article className={styles.matchCard}>

      <section className={styles.matchInfo}>
        <TeamDisplay 
          teamName={match.home_team} 
        />

        <div className={styles.scoreContainer}>
          <span>{home_team.score}</span>
					<input className={styles.scoreInput} type="text" placeholder='0' />
          <span>:</span>
					<input className={styles.scoreInput} type="text" placeholder='0' />
          <span>{away_team.score}</span>
        </div>

        <TeamDisplay 
          teamName={match.away_team} 
        />
      </section>

      {/* Footer: Detalles de tiempo y lugar */}
      <footer>
        <div>
          <time>{match.date}</time>
        </div>
      </footer>
    </article>
  )
}

export default MatchCard