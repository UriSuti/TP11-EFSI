import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function Flag() {
  const { paisActual, banderaLista, marcarBanderaLista, descartarBandera } = useContext(GameContext)

  return (
    <div className="bandera-contenedor">
      {!banderaLista && <p className="aviso">Cargando bandera...</p>}

      {/* La key hace que cada bandera sea una imagen nueva, con sus propios avisos de carga o error. */}
      <img
        key={paisActual.flag}
        className="bandera"
        src={paisActual.flag}
        alt="Bandera del país a adivinar"
        hidden={!banderaLista}
        onLoad={marcarBanderaLista}
        onError={() => descartarBandera(paisActual.flag)}
      />
    </div>
  )
}

export default Flag
