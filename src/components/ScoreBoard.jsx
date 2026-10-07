import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function ScoreBoard() {
  const { puntos } = useContext(GameContext)

  return (
    <p className="puntos">
      Puntos: <strong>{puntos}</strong>
    </p>
  )
}

export default ScoreBoard
