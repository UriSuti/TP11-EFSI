// La API trae los nombres en inglés; con el código ISO obtenemos el nombre en español.
const nombresEnEspanol = new Intl.DisplayNames(['es'], { type: 'region' })

export function nombreEnEspanol(pais) {
  return nombresEnEspanol.of(pais.iso2)
}

// Minúsculas y sin tildes, para que "peru" cuente igual que "Perú".
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

// Elige un país al azar distinto del actual, para que no se repita dos veces seguidas.
export function elegirPaisAlAzar(paises, actual = null) {
  const opciones = paises.filter((pais) => pais !== actual)
  return opciones[Math.floor(Math.random() * opciones.length)]
}
