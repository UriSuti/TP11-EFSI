import { useEffect, useState } from 'react'
import { GameContext } from './GameContext'
import { limpiarPaises, mezclar, nombreEnEspanol, normalizar, unoPorBandera } from '../utils/paises'
import { agregarAlRanking, cargarRanking } from '../utils/ranking'
import ScoreBoard from '../components/ScoreBoard'
import Timer from '../components/Timer'
import Flag from '../components/Flag'
import GuessForm from '../components/GuessForm'
import Hint from '../components/Hint'
import StartScreen from '../components/StartScreen'
import GameOver from '../components/GameOver'

const API_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images'
const TIEMPO_POR_BANDERA = 15
const BANDERAS_POR_PARTIDA = 10
const SEGUNDOS_POR_PISTA = 2

function GameProvider() {
  const [etapa, setEtapa] = useState('inicio') // 'inicio' | 'jugando' | 'fin'
  const [jugador, setJugador] = useState('')
  const [paises, setPaises] = useState([])
  const [paisActual, setPaisActual] = useState(null)
  const [mazo, setMazo] = useState([]) // banderas que quedan por salir en esta partida, ya mezcladas
  const [banderaLista, setBanderaLista] = useState(false) // la imagen actual ya terminó de cargar
  const [banderasRotas, setBanderasRotas] = useState([]) // URLs de imágenes que no cargaron
  const [ronda, setRonda] = useState(1)
  const [puntos, setPuntos] = useState(0)
  const [segundos, setSegundos] = useState(TIEMPO_POR_BANDERA)
  const [respuesta, setRespuesta] = useState('')
  const [letrasReveladas, setLetrasReveladas] = useState([]) // posiciones del nombre ya mostradas
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [ranking, setRanking] = useState(cargarRanking)
  const [ultimaPartida, setUltimaPartida] = useState(null)

  // Al iniciar: traer todos los países. La primera bandera se elige al empezar la partida.
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.msg)
        const validos = limpiarPaises(json.data)
        if (validos.length === 0) throw new Error('La API no trajo países válidos')
        setPaises(validos)
      })
      .catch(() => setError('No se pudieron cargar los países. Recarga la página para intentar de nuevo.'))
  }, [])

  // Cuenta regresiva: solo mientras se juega y con la bandera ya visible, para que una imagen
  // lenta no le coma tiempo al jugador. Arranca de nuevo cada vez que cambia el país.
  useEffect(() => {
    if (etapa !== 'jugando' || !banderaLista) return
    const intervalo = setInterval(() => setSegundos((s) => s - 1), 1000)
    return () => clearInterval(intervalo)
  }, [paisActual, etapa, banderaLista])

  // Precarga la próxima bandera del mazo, así aparece al instante cuando le toque.
  useEffect(() => {
    if (mazo.length > 0) new Image().src = mazo[0].flag
  }, [mazo])

  // Si se acaba el tiempo, se muestra la respuesta y se pasa a otro país.
  useEffect(() => {
    if (etapa !== 'jugando' || segundos > 0) return
    setMensaje({ tipo: 'tiempo', texto: `¡Se acabó el tiempo! Era ${nombreEnEspanol(paisActual)}.` })
    siguientePais(puntos)
  }, [segundos])

  function empezarPartida() {
    if (!jugador.trim() || paises.length === 0 || error) return
    // Un mazo mezclado con una carta por bandera: así ninguna se repite en toda la partida.
    // Se dejan afuera las imágenes que ya fallaron y la última bandera de la partida anterior.
    const nuevoMazo = mezclar(
      unoPorBandera(paises).filter((pais) => !banderasRotas.includes(pais.flag) && pais.flag !== paisActual?.flag),
    )
    setJugador(jugador.trim())
    setPuntos(0)
    setRonda(1)
    setRespuesta('')
    setMensaje(null)
    setEtapa('jugando')
    sacarDelMazo(nuevoMazo)
  }

  // Muestra la primera bandera de `cartas` y guarda el resto como el mazo que queda.
  function sacarDelMazo(cartas) {
    if (cartas.length === 0) {
      // Solo pasa si fallaron todas las imágenes (por ejemplo, sin conexión).
      setError('No se pudieron cargar las imágenes de las banderas. Revisa la conexión y recarga la página.')
      setEtapa('inicio')
      return
    }
    setPaisActual(cartas[0])
    setMazo(cartas.slice(1))
    setBanderaLista(false)
    setSegundos(TIEMPO_POR_BANDERA)
    setLetrasReveladas([])
  }

  // Recibe el puntaje ya actualizado, porque `puntos` todavía no cambió en este render.
  function siguientePais(puntosActuales) {
    if (ronda === BANDERAS_POR_PARTIDA) {
      terminarPartida(puntosActuales)
      return
    }
    setRonda(ronda + 1)
    sacarDelMazo(mazo)
  }

  function marcarBanderaLista() {
    setBanderaLista(true)
  }

  // Si la imagen no carga, se reemplaza por otra bandera sin gastar la ronda ni tocar los puntos,
  // y no se vuelve a usar en lo que queda de la sesión.
  function descartarBandera(flag) {
    if (flag !== paisActual?.flag) return // aviso tardío de una imagen que ya no se muestra
    setBanderasRotas([...banderasRotas, flag])
    sacarDelMazo(mazo)
  }

  function terminarPartida(puntosFinales) {
    const partida = {
      id: Date.now(),
      nombre: jugador,
      puntos: puntosFinales,
      fecha: new Date().toISOString(),
    }
    setRanking(agregarAlRanking(ranking, partida))
    setUltimaPartida(partida)
    setEtapa('fin')
  }

  function volverAlInicio() {
    setEtapa('inicio')
  }

  // La pista es el nombre en español: cada letra se muestra solo si ya fue revelada.
  // Los espacios, guiones y paréntesis se ven siempre, para que se note dónde corta cada palabra.
  const pista = paisActual
    ? [...nombreEnEspanol(paisActual)].map((caracter, i) => ({
        caracter,
        oculto: /\p{L}/u.test(caracter) && !letrasReveladas.includes(i),
      }))
    : []
  const letrasOcultas = pista.map((c, i) => (c.oculto ? i : null)).filter((i) => i !== null)

  // No se puede pedir pista mientras carga la bandera, si ya no quedan letras
  // o si el descuento agotaría el tiempo.
  const puedePedirPista = banderaLista && letrasOcultas.length > 0 && segundos > SEGUNDOS_POR_PISTA

  function pedirPista() {
    if (!puedePedirPista) return
    const posicion = letrasOcultas[Math.floor(Math.random() * letrasOcultas.length)]
    setLetrasReveladas([...letrasReveladas, posicion])
    setSegundos((s) => Math.max(s - SEGUNDOS_POR_PISTA, 0))
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
      siguientePais(puntos + 10)
    } else {
      setPuntos(puntos - 1)
      setMensaje({ tipo: 'error', texto: 'Incorrecto, intenta de nuevo. -1 punto' })
    }
    setRespuesta('')
  }

  const valor = {
    etapa,
    jugador,
    setJugador,
    paises,
    paisActual,
    banderaLista,
    marcarBanderaLista,
    descartarBandera,
    ronda,
    banderasPorPartida: BANDERAS_POR_PARTIDA,
    puntos,
    segundos,
    tiempoPorBandera: TIEMPO_POR_BANDERA,
    respuesta,
    setRespuesta,
    pista,
    letrasReveladas,
    segundosPorPista: SEGUNDOS_POR_PISTA,
    puedePedirPista,
    pedirPista,
    mensaje,
    error,
    ranking,
    ultimaPartida,
    empezarPartida,
    adivinar,
    volverAlInicio,
  }

  return (
    <GameContext.Provider value={valor}>
      <div className="app">
        <header className="marcador">
          <h1>Adivina el país</h1>
          {etapa === 'jugando' && <ScoreBoard />}
        </header>

        <main className="juego">
          {etapa === 'inicio' && <StartScreen />}

          {etapa === 'jugando' && (
            <>
              <Timer />
              <Flag />
              <Hint />
              <GuessForm />
            </>
          )}

          {etapa === 'fin' && <GameOver />}
        </main>
      </div>
    </GameContext.Provider>
  )
}

export default GameProvider
