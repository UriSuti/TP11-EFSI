// La tabla de posiciones se guarda en localStorage, así sobrevive a recargar la página.
const CLAVE = 'adivina-el-pais:ranking'
const MAXIMO_POSICIONES = 10

// localStorage puede fallar (modo privado, datos bloqueados) o tener basura guardada:
// en ese caso arrancamos con el ranking vacío en lugar de romper la app.
export function cargarRanking() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(guardado) ? guardado : []
  } catch {
    return []
  }
}

// Agrega la partida, ordena de mayor a menor puntaje y se queda con los mejores.
// Como el orden es estable, ante un empate queda arriba quien lo logró primero.
export function agregarAlRanking(ranking, partida) {
  const nuevo = [...ranking, partida]
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, MAXIMO_POSICIONES)

  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  } catch {
    // Si no se puede guardar, el ranking igual se ve hasta que se recargue la página.
  }
  return nuevo
}
