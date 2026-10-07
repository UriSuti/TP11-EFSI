# Adivina el país

Juego web hecho en React: la app muestra la bandera de un país elegido al azar y el jugador tiene que adivinar de qué país es, contra reloj y sumando puntos.

## Cómo ejecutarlo

Requisito: tener [Node.js](https://nodejs.org/) instalado.

```bash
npm install     # instala las dependencias (solo la primera vez)
npm run dev     # levanta la app en modo desarrollo
```

Después, abrir **http://localhost:5173** en el navegador.

Para generar la versión final optimizada: `npm run build` (queda en la carpeta `dist/`).

## Cómo se juega

1. Al abrir la app se cargan todos los países y aparece una bandera al azar.
2. El jugador escribe el nombre del país y presiona **Adivinar** (o Enter).
3. Puntaje:
   - **Acierto: +10 puntos** y aparece una bandera nueva.
   - **Error: −1 punto** y se sigue con la misma bandera.
4. Hay **15 segundos por bandera**. Si el tiempo se acaba, se muestra la respuesta correcta y se pasa a otro país, sin cambiar el puntaje. En los últimos 5 segundos el contador se pone rojo.
5. El puntaje se ve siempre en la barra superior.

Al responder:

- Se acepta el nombre **en inglés o en español** ("Germany" o "Alemania").
- **No importan las mayúsculas ni las tildes**: "peru", "Perú" y "PERU" valen igual.
- Algunos países comparten la misma bandera en la API (por ejemplo Francia, Mayotte y Reunión). En esos casos vale cualquiera de los nombres posibles.
- El país nuevo nunca es el mismo que el anterior.

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

### Estructura de archivos

```
src/
├── main.jsx                 Punto de entrada: dibuja <GameProvider />
├── App.css                  Estilos de toda la app
├── context/
│   ├── GameContext.js       Crea el contexto con createContext
│   └── GameProvider.jsx     Estado y lógica del juego; dibuja todos los componentes
├── components/
│   ├── ScoreBoard.jsx       Puntaje
│   ├── Timer.jsx            Cuenta regresiva
│   ├── Flag.jsx             Bandera (o "Cargando..." / mensaje de error)
│   └── GuessForm.jsx        Formulario para adivinar y mensaje de resultado
└── utils/
    └── paises.js            Funciones auxiliares: nombre en español, quitar tildes, elegir país al azar
```

### Todo pasa por el contexto

La app no pasa **ninguna prop** entre componentes: todos los datos se comparten mediante `GameContext`.

- `GameContext.js` crea el contexto con `createContext`.
- `GameProvider.jsx` guarda todo el estado del juego y lo entrega en el `value` de `<GameContext.Provider>`. Además dibuja directamente los cuatro componentes, así que todos quedan dentro del entorno del juego.
- Cada componente toma lo que necesita con `useContext(GameContext)`, por ejemplo:

  ```jsx
  const { puntos } = useContext(GameContext)
  ```

```
GameProvider  (estado + lógica)
└── GameContext.Provider
    ├── ScoreBoard   ← puntos
    ├── Timer        ← paisActual, segundos, tiempoPorBandera
    ├── Flag         ← paisActual, error
    └── GuessForm    ← paisActual, respuesta, setRespuesta, mensaje, adivinar
```

#### Estado guardado en `GameProvider`

| State | Qué guarda |
|---|---|
| `paises` | Lista completa de países que trajo la API |
| `paisActual` | País que hay que adivinar ahora |
| `puntos` | Puntaje del jugador |
| `segundos` | Segundos que quedan para la bandera actual |
| `respuesta` | Lo que el jugador está escribiendo en el formulario |
| `mensaje` | Último aviso mostrado (acierto, error o tiempo agotado) |
| `error` | Mensaje de error si la API no responde |

### Flujo del juego

1. **Carga inicial.** Un `useEffect` con dependencias vacías (`[]`) se ejecuta una sola vez al iniciar. Hace el `fetch` a la API, guarda los países en `paises` y elige uno al azar para `paisActual`.
2. **Cuenta regresiva.** Otro `useEffect` depende de `paisActual`. Cada vez que cambia el país, arranca un `setInterval` que resta 1 a `segundos` por segundo. Su función de limpieza (`clearInterval`) detiene el intervalo anterior cuando cambia el país, para que nunca haya dos corriendo a la vez.
3. **Tiempo agotado.** Un tercer `useEffect` observa `segundos`. Cuando llega a 0, muestra la respuesta correcta y pasa al siguiente país.
4. **Adivinar.** Cuando el jugador envía el formulario, `adivinar()` compara la respuesta (normalizada, sin tildes ni mayúsculas) con los nombres válidos:
   - si es correcta, suma 10 puntos y pasa al siguiente país;
   - si no, resta 1 punto.
5. **Siguiente país.** `siguientePais()` elige un país al azar distinto del actual y vuelve a poner el contador en 15 segundos.

### Cambiar la configuración

- **Tiempo por bandera:** constante `TIEMPO_POR_BANDERA` en `src/context/GameProvider.jsx`.

## Tecnologías

- [React 19](https://react.dev/): componentes, `useState`, `useEffect`, `createContext` y `useContext`
- [Vite](https://vite.dev/): servidor de desarrollo y build
- CSS sin librerías

## Otros archivos

- `chat-historial.md`: historial de la conversación con Claude (asistente de IA) usada durante el desarrollo. Se actualiza solo mediante un hook de Claude Code configurado en `.claude/`.
