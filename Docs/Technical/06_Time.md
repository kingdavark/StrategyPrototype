# js/time.js

## Scopo

Gestisce il controllo della velocità di simulazione: pausa, velocità multiple e fornitura del delta di gioco effettivo. È il modulo che permette al mondo di scorrere a ritmi diversi, indipendentemente dal frame rate reale.

## Struttura dati

L'oggetto `TimeManager` contiene:

- `speeds` – array dei moltiplicatori disponibili. Valori attuali: `[0, 0.5, 1, 2, 4, 8]`. Lo `0` corrisponde alla pausa.
- `speedIndex` – indice corrente nell'array `speeds`. Default `2` (1x).
- `lastNonZeroIndex` – indice dell'ultima velocità non-zero, usato per riprendere dopo una pausa. Default `2` (1x).
- `get speed()` – getter che restituisce `speeds[speedIndex]`.

## Metodi

### get speed (getter)

Restituisce il moltiplicatore corrente. Se `speedIndex` è 0, restituisce 0 (pausa).

### setSpeedIndex(newIndex)

Imposta l'indice della velocità corrente. Se `newIndex` è valido (compreso tra 0 e `speeds.length - 1`):

- Aggiorna `speedIndex`.
- Se `newIndex` non è 0, aggiorna anche `lastNonZeroIndex`.
- Stampa in console il nuovo valore con `getSpeedLabel()`.

### increaseSpeed()

Incrementa l'indice di velocità di 1, in modo ciclico (`modulo speeds.length`). Chiama `setSpeedIndex`.

### decreaseSpeed()

Decrementa l'indice di velocità di 1, in modo ciclico (con wrap-around). Chiama `setSpeedIndex`.

### togglePause()

Se il gioco è in pausa (`speedIndex === 0`), riprende ripristinando `lastNonZeroIndex`. Altrimenti, mette in pausa impostando `speedIndex` a 0.

### getGameDelta(deltaSec)

Restituisce il delta di gioco effettivo moltiplicando `deltaSec` per la velocità corrente. Se il gioco è in pausa, restituisce 0.

Formula: `gameDelta = deltaSec * speed`, dove `speed` è il moltiplicatore corrente.

### getSpeedLabel()

Restituisce un'etichetta leggibile per la velocità corrente:

- `0` → `'Paused'`
- `0.5` → `'0.5x'`
- `1` → `'1x'`
- `2` → `'2x'`
- `4` → `'4x'`
- `8` → `'8x'`
- altri valori → `<valore>x`

## Dipendenze in ingresso

- `index.html` – carica lo script dopo `ui.js`.
- `js/main.js` – usa `TimeManager.getGameDelta`, `togglePause`, `setSpeedIndex`, `increaseSpeed`, `decreaseSpeed`, `getSpeedLabel`.

## Dipendenze in uscita

Nessuna. Questo script non chiama altri moduli di gioco.

## Parametri GameConfig usati

Nessuno direttamente. La velocità di gioco è indipendente dai parametri di `GameConfig`, ma influenza indirettamente il consumo, i movimenti e l'avanzamento del giorno tramite il `deltaSec` fornito a `main.js`.

## Stato globale modificato

- `TimeManager.speedIndex`, `TimeManager.lastNonZeroIndex` (interni all'oggetto).

## Note per modifiche

- La velocità non influenza il rendering, solo la logica di gioco tramite `gameDelta`.
- In pausa, `deltaSec` è 0 e nessuna logica di gioco avanza.
- L'array `speeds` può essere modificato per aggiungere o togliere velocità. Se si modificano i valori, aggiornare anche i listener di tastiera in `main.js` (le scorciatoie `0-4` puntano a indici fissi).
- Se si aggiunge un nuovo indice di velocità, aggiornare `getSpeedLabel()` per restituire un'etichetta corretta.