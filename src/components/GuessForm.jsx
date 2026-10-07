import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function GuessForm() {
  const { paisActual, respuesta, setRespuesta, mensaje, adivinar } = useContext(GameContext)

  if (!paisActual) return null

  function enviar(e) {
    e.preventDefault()
    adivinar()
  }

  return (
    <>
      <form className="formulario" onSubmit={enviar}>
        <input
          type="text"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="¿De qué país es esta bandera?"
          autoFocus
        />
        <button type="submit">Adivinar</button>
      </form>

      {mensaje && <p className={`aviso ${mensaje.tipo}`}>{mensaje.texto}</p>}
    </>
  )
}

export default GuessForm