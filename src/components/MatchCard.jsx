export function MatchCard({ match }) {
    return (
        <div className="match-card">
            <h3>{match.home_team} vs {match.away_team}</h3>
            <p>Date: {match.date}</p>
        </div>
    )
}

// Sub-componente para la información del equipo
const TeamDisplay = ({ flagSrc, teamName, score }) => (
  <div>
    <img src={flagSrc} alt={`Bandera de ${teamName}`} />
    <span>{teamName}</span>
  </div>
);

const MatchCard = ({ match }) => {
  const { 
    home_team, 
    away_team, 
    date,
  } = matchData;

  return (
    <article>

      <section>
        <TeamDisplay 
          flagSrc={match.home_team.flag} 
          teamName={match.home_team.name} 
        />

        <div>
          <span>{match.home_team.score}</span>
          <span>:</span>
          <span>{match.away_team.score}</span>
        </div>

        <TeamDisplay 
          flagSrc={match.away_team.flag} 
          teamName={match.away_team.name} 
        />
      </section>

      {/* Footer: Detalles de tiempo y lugar */}
      <footer>
        <div>
          <time>{match.date}</time>
        </div>
        <small>Auto-saving enabled • Last saved 12s ago</small>
      </footer>
    </article>
  );
};

export default MatchCard;