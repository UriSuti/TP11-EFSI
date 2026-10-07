import { useEffect, useState } from 'react'
import { GameContext } from './GameContext'
import { elegirPaisAlAzar, nombreEnEspanol, normalizar } from '../utils/paises'
import ScoreBoard from '../components/ScoreBoard'
import Timer from '../components/Timer'
import Flag from '../components/Flag'
import GuessForm from '../components/GuessForm'

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images'
const TIEMPO_POR_BANDERA = 15

function GameProvider() {
  const [paises, setPaises] = useState([])
  const [paisActual, setPaisActual] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [segundos, setSegundos] = useState(TIEMPO_POR_BANDERA)
  const [respuesta, setRespuesta] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  // Al iniciar: traer todos los países y elegir el primero al azar.
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.msg)
        setPaises(json.data)
        setPaisActual(elegirPaisAlAzar(json.data))
      })
      .catch(() => setError('No se pudieron cargar los países. Recarga la página para intentar de nuevo.'))
  }, [])

  // Cuenta regresiva: arranca de nuevo cada vez que cambia el país.
  useEffect(() => {
    if (!paisActual) return
    const intervalo = setInterval(() => setSegundos((s) => s - 1), 1000)
    return () => clearInterval(intervalo)
  }, [paisActual])

  // Si se acaba el tiempo, se muestra la respuesta y se pasa a otro país.
  useEffect(() => {
    if (segundos > 0) return
    setMensaje({ tipo: 'tiempo', texto: `¡Se acabó el tiempo! Era ${nombreEnEspanol(paisActual)}.` })
    siguientePais()
  }, [segundos])

  function siguientePais() {
    setPaisActual(elegirPaisAlAzar(paises, paisActual))
    setSegundos(TIEMPO_POR_BANDERA)
  }

  function esCorrecta(intento) {
    // Algunos países comparten bandera (Francia, Mayotte y Reunión, por ejemplo),
    // así que vale cualquiera de los que tengan la misma.
    const posibles = paises.filter((pais) => pais.flag === paisActual.flag)
    return posibles.some(
      (pais) =>
        normalizar(pais.name) === normalizar(intento) ||
        normalizar(nombreEnEspanol(pais)) === normalizar(intento),
    )
  }

  function adivinar() {
    if (!respuesta.trim()) return

    if (esCorrecta(respuesta)) {
      setPuntos(puntos + 10)
      setMensaje({ tipo: 'acierto', texto: `¡Correcto! Era ${nombreEnEspanol(paisActual)}. +10 puntos` })
      siguientePais()
    } else {
      setPuntos(puntos - 1)
      setMensaje({ tipo: 'error', texto: 'Incorrecto, intenta de nuevo. -1 punto' })
    }
    setRespuesta('')
  }

  const valor = {
    paisActual,
    puntos,
    segundos,
    tiempoPorBandera: TIEMPO_POR_BANDERA,
    respuesta,
    setRespuesta,
    mensaje,
    error,
    adivinar,
  }

  return (
    <GameContext.Provider value={valor}>
      <div className="app">
        <header className="marcador">
          <h1>Adivina el país</h1>
          <ScoreBoard />
        </header>

        <main className="juego">
          <Timer />
          <Flag />
          <GuessForm />
        </main>
      </div>
    </GameContext.Provider>
  )
}

export default GameProvider
