import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

function Hint() {
  const { pista, letrasReveladas, segundosPorPista, puedePedirPista, pedirPista } = useContext(GameContext)

  // Se agrupan las letras por palabra, para que en nombres largos el renglón corte entre palabras.
  const palabras = [[]]
  pista.forEach((c) => {
    if (c.caracter === ' ') palabras.push([])
    else palabras[palabras.length - 1].push(c)
  })

  return (
    <div className="pista">
      {/* El nombre aparece recién con la primera pista: mostrarlo antes ya delataría su largo. */}
      {letrasReveladas.length > 0 && (
        <p className="pista-nombre" aria-label="Pista del nombre">
          {palabras.map((palabra, i) => (
            <span key={i} className="pista-palabra">
              {palabra.map((c, j) => (
                <span key={j} className={c.oculto ? 'pista-letra oculta' : 'pista-letra'}>
                  {c.oculto ? '' : c.caracter}
                </span>
              ))}
            </span>
          ))}
        </p>
      )}

      {/* preventDefault en mousedown: así el botón no le saca el foco al campo de respuesta. */}
      <button
        type="button"
        className="boton secundario"
        onMouseDown={(e) => e.preventDefault()}
        onClick={pedirPista}
        disabled={!puedePedirPista}
      >
        Pedir pista (−{segundosPorPista} s)
      </button>
    </div>
  )
}

export default Hint
