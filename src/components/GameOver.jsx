import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import Ranking from './Ranking'

function GameOver() {
  const { ultimaPartida, ranking, mensaje, empezarPartida, volverAlInicio } = useContext(GameContext)

  const posicion = ranking.findIndex((partida) => partida.id === ultimaPartida.id) + 1

  return (
    <>
      {mensaje && <p className={`aviso ${mensaje.tipo}`}>{mensaje.texto}</p>}

      <section className="tarjeta">
        <h2>¡Partida terminada, {ultimaPartida.nombre}!</h2>
        <p className="puntaje-final">{ultimaPartida.puntos} puntos</p>
        <p className="explicacion">
          {posicion > 0
            ? `Quedaste en el puesto ${posicion} de la tabla.`
            : 'Esta vez no alcanzó para entrar en la tabla.'}
        </p>

        <div className="botones">
          <button type="button" className="boton" onClick={empezarPartida}>
            Jugar de nuevo
          </button>
          <button type="button" className="boton secundario" onClick={volverAlInicio}>
            Cambiar jugador
          </button>
        </div>
      </section>

      <Ranking />
    </>
  )
}

export default GameOver
