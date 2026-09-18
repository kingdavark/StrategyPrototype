# Time Manager

## Scopo

Questo documento descrive il sistema di controllo del tempo di gioco: pausa, velocità multiple e integrazione con il game loop. Il modulo è implementato in `js/time.js`.

## Definizione

Il `TimeManager` è un oggetto globale che gestisce la velocità di simulazione. Espone un array di moltiplicatori, uno stato interno (indice corrente) e metodi per modificare la velocità.

## Struttura

L'oggetto `TimeManager` contiene:

- `speeds`: array dei moltiplicatori disponibili. Valori attuali: `[0, 0.5, 1, 2, 4, 8]`. Lo `0` corrisponde alla pausa.

- `speedIndex`: indice corrente nell'array `speeds`. Default `2` (1x).

- `lastNonZeroIndex`: indice dell'ultima velocità non-zero, usata per riprendere dopo una pausa. Default `2` (1x).

- `get speed()`: getter che restituisce `speeds[speedIndex]`.

## Metodi

### get speed (getter)

Restituisce il moltiplicatore corrente. Se `speedIndex` è 0, restituisce 0 (pausa).

### setSpeedIndex(newIndex)

Imposta l'indice della velocità corrente. Se `newIndex` è valido (compreso tra 0 e `speeds.length - 1`):

- Aggiorna `speedIndex`.

- Se `newIndex` non è 0, aggiorna anche `lastNonZeroIndex`.

- Stampa in console il nuovo valore con `getSpeedLabel()`.

### increaseSpeed()

Incrementa l'indice di velocità di 1, in modo ciclico (`modulo speeds.length`). Chiama `setSpeedIndex`.

### decreaseSpeed()

Decrementa l'indice di velocità di 1, in modo ciclico (con wrap-around). Chiama `setSpeedIndex`.

### togglePause()

Se il gioco è in pausa (`speedIndex === 0`), riprende ripristinando `lastNonZeroIndex`. Altrimenti, mette in pausa impostando `speedIndex` a 0.

### getGameDelta(deltaSec)

Restituisce il delta di gioco effettivo moltiplicando `deltaSec` per la velocità corrente. Se il gioco è in pausa, restituisce 0.

Formula:

text

gameDelta = deltaSec * speed

dove `speed` è il moltiplicatore corrente.

### getSpeedLabel()

Restituisce un'etichetta leggibile per la velocità corrente:

- `0` → `'Paused'`

- `0.5` → `'0.5x'`

- `1` → `'1x'`

- `2` → `'2x'`

- `4` → `'4x'`

- `8` → `'8x'`

- altri valori → `<valore>x`

## Integrazione con il game loop

In `main.js`, la funzione `update(time, delta)` riceve il delta in millisecondi da Phaser. Il delta viene convertito in secondi reali e passato al TimeManager:

text

realDeltaSec = delta / 1000
deltaSec = TimeManager.getGameDelta(realDeltaSec)
gameTimeSec += deltaSec

Il valore `deltaSec` viene poi usato per tutti gli aggiornamenti di gioco: movimento delle spedizioni, raccolta locale, consumi, avanzamento giorno.

Questo garantisce che la simulazione sia coerente indipendentemente dal frame rate e che velocità multiple o pausa siano rispettate.

## Scorciatoie da tastiera

Le scorciatoie sono definite in `main.js` e gestite tramite `scene.input.keyboard.on('keydown-...')`.

- **Spazio**: chiama `TimeManager.togglePause()` e aggiorna l'indicatore di velocità.

- **Tasti 0, 1, 2, 3, 4**: chiamano `TimeManager.setSpeedIndex(n)` con indici fissi:
  
  - `0` → indice 1 (0.5x)
  
  - `1` → indice 2 (1x)
  
  - `2` → indice 3 (2x)
  
  - `3` → indice 4 (4x)
  
  - `4` → indice 5 (8x)

- **Numpad +** oppure **+**: chiama `TimeManager.increaseSpeed()`. Il tasto `+` standard è gestito anche se richiede Shift sulla tastiera italiana, quindi è presente un handler specifico.

- **Numpad -** oppure **-**: chiama `TimeManager.decreaseSpeed()`.

Tutte le scorciatoie sono bloccate se un input HTML ha il focus (`isInputFocused()`), per evitare conflitti quando si scrive nel pannello debug.

## Indicatore di velocità

In `main.js` è presente un oggetto `Phaser.Text` chiamato `speedText` in alto a sinistra. La funzione `updateSpeedText()` aggiorna il testo con `TimeManager.getSpeedLabel()`. Viene chiamata nei listener di tastiera e ogni frame in `update()`.

## Note

- La velocità non influenza il rendering, solo la logica di gioco tramite `gameDelta`.

- In pausa, `deltaSec` è 0 e nessuna logica di gioco avanza.

- `gameTimeSec` è una variabile globale che accumula il tempo di gioco effettivo trascorso, usata per calcolare la durata delle spedizioni (per il riposo).

- L'array `speeds` può essere modificato per aggiungere o togliere velocità, ma serve coerenza con le scorciatoie in `main.js`.

## Interazioni con altri moduli

- `config.js`: fornisce `dayLengthSeconds`, usato per calcolare l'avanzamento del giorno tramite `deltaSec`.

- `units.js`: le spedizioni usano `deltaSec` per movimento, consumi e raccolta.

- `main.js`: gestisce input, accumula il tempo di gioco (`gameTimeSec`), aggiorna il ciclo giorno e l'indicatore di velocità.

- `debug.js`: non interferisce direttamente, ma il pannello debug può essere aperto anche in pausa.