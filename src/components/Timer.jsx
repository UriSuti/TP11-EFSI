import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function Timer() {
  const { paisActual, segundos, tiempoPorBandera } = useContext(GameContext)

  if (!paisActual) return null

  const porcentaje = (segundos / tiempoPorBandera) * 100
  const pocoTiempo = segundos <= 5

  return (
    <div className={`timer ${pocoTiempo ? 'poco-tiempo' : ''}`}>
      <p>
        Tiempo: <strong>{segundos} s</strong>
      </p>
      <div className="timer-barra">
        <div className="timer-relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

export default Timer
