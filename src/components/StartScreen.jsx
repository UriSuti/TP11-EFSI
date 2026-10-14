import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import Ranking from './Ranking'

function StartScreen() {
  const { jugador, setJugador, paises, error, banderasPorPartida, empezarPartida } = useContext(GameContext)

  const cargando = paises.length === 0 && !error

  function enviar(e) {
    e.preventDefault()
    empezarPartida()
  }

  return (
    <>
      <section className="tarjeta">
        <h2>¿Quién juega?</h2>
        <p className="explicacion">
          Adivina {banderasPorPartida} banderas. Cada acierto suma 10 puntos y cada error resta 1.
        </p>

        <form className="formulario" onSubmit={enviar}>
          <input
            type="text"
            value={jugador}
            onChange={(e) => setJugador(e.target.value)}
            placeholder="Tu nombre"
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={!jugador.trim() || paises.length === 0 || !!error}>
            Jugar
          </button>
        </form>

        {cargando && <p className="aviso">Cargando países...</p>}
        {error && <p className="aviso error">{error}</p>}
      </section>

      <Ranking />
    </>
  )
}

export default StartScreen
