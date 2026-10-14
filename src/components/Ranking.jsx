import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function Ranking() {
  const { ranking, ultimaPartida } = useContext(GameContext)

  return (
    <section className="tarjeta">
      <h2>Tabla de posiciones</h2>

      {ranking.length === 0 ? (
        <p className="explicacion">Todavía no hay partidas. ¡Sé el primero!</p>
      ) : (
        <table className="ranking">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((partida, i) => (
              <tr key={partida.id} className={partida.id === ultimaPartida?.id ? 'destacada' : ''}>
                <td>{i + 1}</td>
                <td>{partida.nombre}</td>
                <td>{partida.puntos}</td>
                <td>{new Date(partida.fecha).toLocaleDateString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default Ranking
