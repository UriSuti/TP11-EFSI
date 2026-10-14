// La API trae los nombres en inglés; con el código ISO obtenemos el nombre en español.
const nombresEnEspanol = new Intl.DisplayNames(['es'], { type: 'region' })

export function nombreEnEspanol(pais) {
  return nombresEnEspanol.of(pais.iso2)
}

// Minúsculas y sin tildes, para que "peru" cuente igual que "Perú".
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function esUrlValida(texto) {
  try {
    return ['https:', 'http:'].includes(new URL(texto).protocol)
  } catch {
    return false
  }
}

// La API a veces trae datos sucios (por ejemplo, la URL de Irán empieza con un espacio).
// Se limpian los textos y se descartan los países sin nombre, código ISO o URL de bandera válidos.
export function limpiarPaises(datos) {
  return datos
    .map((pais) => ({
      name: String(pais.name ?? '').trim(),
      iso2: String(pais.iso2 ?? '').trim().toUpperCase(),
      flag: String(pais.flag ?? '').trim(),
    }))
    .filter(
      (pais) =>
        pais.name &&
        /^[A-Z]{2}$/.test(pais.iso2) &&
        nombresEnEspanol.of(pais.iso2) !== pais.iso2 &&
        esUrlValida(pais.flag),
    )
}

// "https://.../Flag_of_the_United_States.svg" → "flag of the united states.svg"
function nombreDeArchivo(url) {
  const archivo = url.split('/').pop()
  try {
    return normalizar(decodeURIComponent(archivo).replace(/_/g, ' '))
  } catch {
    return normalizar(archivo)
  }
}

// Algunos países comparten bandera (Noruega e Isla Bouvet, Francia y Mayotte...). Para que no
// aparezca la misma bandera dos veces, queda uno solo por bandera: el que figura en el nombre
// del archivo ("Flag_of_Norway.svg" → Noruega) o, si ninguno figura, el primero.
// Al adivinar se siguen aceptando todos los nombres que comparten esa bandera.
export function unoPorBandera(paises) {
  const porBandera = new Map()
  for (const pais of paises) {
    const elegido = porBandera.get(pais.flag)
    const archivo = nombreDeArchivo(pais.flag)
    const leGanaAlElegido =
      !elegido || (!archivo.includes(normalizar(elegido.name)) && archivo.includes(normalizar(pais.name)))
    if (leGanaAlElegido) porBandera.set(pais.flag, pais)
  }
  return [...porBandera.values()]
}

// Mezcla de Fisher-Yates: devuelve una copia con los elementos en orden aleatorio.
export function mezclar(lista) {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}
