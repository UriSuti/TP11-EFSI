import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function Flag() {
  const { paisActual, error } = useContext(GameContext)

  if (error) return <p className="aviso error">{error}</p>
  if (!paisActual) return <p className="aviso">Cargando países...</p>

  return <img className="bandera" src={paisActual.flag} alt="Bandera del país a adivinar" />
}

export default Flag
