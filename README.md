# Adivina el país

Juego web hecho en React: la app muestra la bandera de un país elegido al azar y el jugador tiene que adivinar de qué país es, contra reloj y sumando puntos. Al final de cada partida el puntaje se guarda en una tabla de posiciones.

## Cómo ejecutarlo

Requisito: tener [Node.js](https://nodejs.org/) instalado.

```bash
npm install     # instala las dependencias (solo la primera vez)
npm run dev     # levanta la app en modo desarrollo
```

Después, abrir **http://localhost:5173** en el navegador.

Para generar la versión final optimizada: `npm run build` (queda en la carpeta `dist/`).

## Cómo se juega

1. Al abrir la app se cargan todos los países y aparece la pantalla de inicio, con la tabla de posiciones.
2. El jugador escribe **su nombre** y presiona **Jugar** (el botón se habilita cuando hay un nombre y los países ya cargaron).
3. Cada partida tiene **10 banderas**. Para cada una, el jugador escribe el nombre del país y presiona **Adivinar** (o Enter).
4. Puntaje:
   - **Acierto: +10 puntos** y aparece una bandera nueva.
   - **Error: −1 punto** y se sigue con la misma bandera.
5. Hay **15 segundos por bandera**. Si el tiempo se acaba, se muestra la respuesta correcta y se pasa a otro país, sin cambiar el puntaje. En los últimos 5 segundos el contador se pone rojo.
6. **Pistas:** con el botón **Pedir pista** se revela una letra al azar del nombre del país (en español). Cada pista **resta 2 segundos** del tiempo de esa bandera, pero no quita puntos. Las casillas del nombre aparecen recién con la primera pista. El botón se deshabilita cuando ya no quedan letras por revelar o cuando quedan 2 segundos o menos. Con cada bandera nueva, las pistas empiezan de cero.
7. En la barra superior se ven siempre el nombre del jugador, la bandera en la que va (por ejemplo "Bandera 3/10") y el puntaje.
8. Después de la décima bandera la partida termina: se muestran el puntaje final, el puesto obtenido y la tabla de posiciones con la partida recién jugada resaltada. Desde ahí se puede **jugar de nuevo** con el mismo nombre o **cambiar de jugador**.

Al responder:

- Se acepta el nombre **en inglés o en español** ("Germany" o "Alemania").
- **No importan las mayúsculas ni las tildes**: "peru", "Perú" y "PERU" valen igual.
- Algunos países comparten la misma bandera en la API (por ejemplo Francia, Mayotte y Reunión). En esos casos vale cualquiera de los nombres posibles.
- **Ninguna bandera se repite en una partida**, y la primera de una partida nueva nunca es la última de la anterior. Cuando varios países comparten bandera, aparece una sola vez (como el país principal: Noruega y no Isla Bouvet).
- Si la imagen de una bandera no carga, se reemplaza por otra sin gastar la ronda ni tocar los puntos, y esa bandera no se vuelve a usar.
- El tiempo empieza a correr **recién cuando la bandera se ve**: mientras carga aparece "Cargando bandera..." y no se pueden pedir pistas.

### Tabla de posiciones

- Guarda las **10 mejores partidas**, ordenadas de mayor a menor puntaje. Ante un empate queda arriba la partida que se jugó primero.
- Cada partida es una fila: si alguien juega varias veces, puede aparecer más de una vez.
- Se guarda en el **`localStorage`** del navegador, así que se mantiene aunque se recargue la página o se cierre el navegador. Es propia de cada navegador: no se comparte entre computadoras.

## Cómo funciona por dentro

### La API

Los datos vienen de:

```
GET https://countriesnow.space/api/v0.1/countries/flag/images
```

que devuelve 222 países con este formato:

```json
{
  "error": false,
  "msg": "flags images retrieved",
  "data": [
    { "name": "Argentina", "flag": "https://upload.wikimedia.org/...svg", "iso2": "AR", "iso3": "ARG" }
  ]
}
```

La API da los nombres solo en inglés. El nombre en español se obtiene a partir del código `iso2` con `Intl.DisplayNames`, que viene incluido en JavaScript (por ejemplo `AR` → "Argentina", `DE` → "Alemania").

#### Problemas conocidos de los datos

Los datos de la API no son del todo prolijos, así que la app los corrige al recibirlos o mientras se juega:

| Problema | Ejemplo | Cómo se resuelve |
|---|---|---|
| Varios países con la misma imagen | Noruega e Isla Bouvet; Francia, Mayotte y Reunión; Australia e Islas Heard y McDonald; EE. UU. y sus Islas Ultramarinas | `unoPorBandera()` deja un solo país por bandera para elegir, y al adivinar se aceptan todos los nombres |
| Texto con espacios de más | La URL de Irán empieza con un espacio | `limpiarPaises()` recorta todos los textos |
| Entradas incompletas o inválidas | Sin bandera, sin nombre o con un código ISO desconocido | `limpiarPaises()` las descarta |
| Imágenes que no existen | Cabo Verde e Islas Cocos (error 404), Vaticano y Santo Tomé y Príncipe (error 400) | Si la imagen da error se pasa a otra bandera (ver *Flujo del juego*) |

### Estructura de archivos

```
src/
├── main.jsx                 Punto de entrada: dibuja <GameProvider />
├── App.css                  Estilos de toda la app
├── context/
│   ├── GameContext.js       Crea el contexto con createContext
│   └── GameProvider.jsx     Estado y lógica del juego; dibuja la pantalla que corresponda
├── components/
│   ├── StartScreen.jsx      Pantalla de inicio: nombre del jugador y tabla de posiciones
│   ├── ScoreBoard.jsx       Jugador, número de bandera y puntaje
│   ├── Timer.jsx            Cuenta regresiva
│   ├── Flag.jsx             Bandera a adivinar (o "Cargando bandera...")
│   ├── Hint.jsx             Botón de pista y nombre con las letras reveladas
│   ├── GuessForm.jsx        Formulario para adivinar y mensaje de resultado
│   ├── GameOver.jsx         Fin de partida: puntaje final, puesto y botones
│   └── Ranking.jsx          Tabla de posiciones
└── utils/
    ├── paises.js            Funciones auxiliares: limpiar los datos, un país por bandera, mezclar, nombre en español, quitar tildes
    └── ranking.js           Leer y guardar la tabla de posiciones en localStorage
```

### Todo pasa por el contexto

La app no pasa **ninguna prop** entre componentes: todos los datos se comparten mediante `GameContext`.

- `GameContext.js` crea el contexto con `createContext`.
- `GameProvider.jsx` guarda todo el estado del juego y lo entrega en el `value` de `<GameContext.Provider>`. Además dibuja directamente los componentes de la pantalla que corresponda según la etapa (`inicio`, `jugando` o `fin`), así que todos quedan dentro del entorno del juego.
- Cada componente toma lo que necesita con `useContext(GameContext)`, por ejemplo:

  ```jsx
  const { puntos } = useContext(GameContext)
  ```

```
GameProvider  (estado + lógica)
└── GameContext.Provider
    ├── etapa "inicio"
    │   └── StartScreen  ← jugador, setJugador, paises, error, banderasPorPartida, empezarPartida
    │       └── Ranking  ← ranking, ultimaPartida
    ├── etapa "jugando"
    │   ├── ScoreBoard   ← jugador, ronda, banderasPorPartida, puntos
    │   ├── Timer        ← paisActual, segundos, tiempoPorBandera
    │   ├── Flag         ← paisActual, banderaLista, marcarBanderaLista, descartarBandera
    │   ├── Hint         ← pista, letrasReveladas, segundosPorPista, puedePedirPista, pedirPista
    │   └── GuessForm    ← paisActual, respuesta, setRespuesta, mensaje, adivinar
    └── etapa "fin"
        └── GameOver     ← ultimaPartida, ranking, mensaje, empezarPartida, volverAlInicio
            └── Ranking  ← ranking, ultimaPartida
```

#### Estado guardado en `GameProvider`

| State | Qué guarda |
|---|---|
| `etapa` | Pantalla actual: `'inicio'`, `'jugando'` o `'fin'` |
| `jugador` | Nombre del jugador |
| `paises` | Lista completa de países que trajo la API |
| `paisActual` | País que hay que adivinar ahora |
| `mazo` | Banderas que quedan por salir en la partida, ya mezcladas |
| `banderaLista` | Si la imagen de la bandera actual ya terminó de cargar |
| `banderasRotas` | URLs de imágenes que no cargaron, para no volver a usarlas |
| `ronda` | Número de bandera de la partida (de 1 a 10) |
| `puntos` | Puntaje del jugador |
| `segundos` | Segundos que quedan para la bandera actual |
| `respuesta` | Lo que el jugador está escribiendo en el formulario |
| `letrasReveladas` | Posiciones del nombre del país actual que ya se revelaron con pistas |
| `mensaje` | Último aviso mostrado (acierto, error o tiempo agotado) |
| `error` | Mensaje de error si la API no responde |
| `ranking` | Tabla de posiciones (se lee de `localStorage` al iniciar) |
| `ultimaPartida` | Última partida jugada, para mostrar el resultado y resaltarla en la tabla |

### Flujo del juego

1. **Carga inicial.** Un `useEffect` con dependencias vacías (`[]`) se ejecuta una sola vez al iniciar. Hace el `fetch` a la API y guarda los países en `paises`. Al mismo tiempo, el estado `ranking` arranca con lo que haya guardado en `localStorage` (`cargarRanking()`).
   Los datos pasan antes por `limpiarPaises()` (ver *Problemas conocidos de los datos*).
2. **Empezar partida.** `empezarPartida()` pone los puntos en 0 y la ronda en 1, arma el **mazo** y cambia la etapa a `'jugando'`. El mazo es la lista de banderas únicas (`unoPorBandera()`), sin las rotas ni la última de la partida anterior, mezclada con `mezclar()`. Cada bandera nueva se saca del principio del mazo con `sacarDelMazo()`, así que no se puede repetir. La siguiente bandera del mazo se precarga para que aparezca al instante.
3. **Carga de la imagen.** `Flag` avisa cuando la imagen terminó de cargar (`onLoad` → `marcarBanderaLista()`) o si falló (`onError` → `descartarBandera()`). Si falló, la URL se agrega a `banderasRotas` y se saca otra bandera del mazo sin cambiar la ronda.
4. **Cuenta regresiva.** Otro `useEffect` depende de `paisActual`, `etapa` y `banderaLista`. Solo funciona mientras se juega y con la bandera ya visible: cada vez que cambia el país, arranca un `setInterval` que resta 1 a `segundos` por segundo. Su función de limpieza (`clearInterval`) detiene el intervalo anterior cuando cambia el país, para que nunca haya dos corriendo a la vez.
5. **Tiempo agotado.** Un tercer `useEffect` observa `segundos`. Cuando llega a 0, muestra la respuesta correcta y pasa al siguiente país.
6. **Adivinar.** Cuando el jugador envía el formulario, `adivinar()` compara la respuesta (normalizada, sin tildes ni mayúsculas) con los nombres válidos:
   - si es correcta, suma 10 puntos y pasa al siguiente país;
   - si no, resta 1 punto.
7. **Pistas.** A partir de `paisActual` y `letrasReveladas` se calcula `pista`: el nombre en español letra por letra, marcando cuáles siguen ocultas (espacios, guiones y paréntesis se muestran siempre). `pedirPista()` elige al azar una de las letras ocultas, agrega su posición a `letrasReveladas` y resta 2 a `segundos`.
8. **Siguiente país.** `siguientePais()` suma 1 a la ronda y saca la próxima bandera del mazo, con el contador otra vez en 15 segundos y sin pistas. Si ya era la última bandera, termina la partida.
9. **Fin de partida.** `terminarPartida()` arma la partida (`{ id, nombre, puntos, fecha }`) y la pasa a `agregarAlRanking()`, que la agrega a la tabla, la ordena, se queda con las 10 mejores y la guarda en `localStorage` con `JSON.stringify`. Después cambia la etapa a `'fin'`.

Si `localStorage` no está disponible o tiene datos inválidos, la app arranca con la tabla vacía en lugar de romperse. Y si no carga ninguna imagen (por ejemplo, sin conexión), la partida se corta y la pantalla de inicio muestra un aviso, en lugar de quedar trabada.

### Cambiar la configuración

- **Tiempo por bandera:** constante `TIEMPO_POR_BANDERA` en `src/context/GameProvider.jsx`.
- **Banderas por partida:** constante `BANDERAS_POR_PARTIDA` en `src/context/GameProvider.jsx`.
- **Segundos que cuesta cada pista:** constante `SEGUNDOS_POR_PISTA` en `src/context/GameProvider.jsx`.
- **Cantidad de puestos en la tabla:** constante `MAXIMO_POSICIONES` en `src/utils/ranking.js`.
- **Borrar la tabla de posiciones:** en la consola del navegador, `localStorage.removeItem('adivina-el-pais:ranking')`.

## Tecnologías

- [React 19](https://react.dev/): componentes, `useState`, `useEffect`, `createContext` y `useContext`
- `localStorage` del navegador para guardar la tabla de posiciones
- [Vite](https://vite.dev/): servidor de desarrollo y build
- CSS sin librerías

## Otros archivos

- `chat-historial.md`: historial de la conversación con Claude (asistente de IA) usada durante el desarrollo. Se actualiza solo mediante un hook de Claude Code configurado en `.claude/`.
