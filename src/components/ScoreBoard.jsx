import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function ScoreBoard() {
  const { jugador, ronda, banderasPorPartida, puntos } = useContext(GameContext)

  return (
    <div className="estado">
      <span className="jugador">{jugador}</span>
      <span>
        Bandera {ronda}/{banderasPorPartida}
      </span>
      <p className="puntos">
        Puntos: <strong>{puntos}</strong>
      </p>
    </div>
  )
}

export default ScoreBoard
