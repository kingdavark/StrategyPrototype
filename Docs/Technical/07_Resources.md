# js/resources.js

## Scopo

**File attualmente vuoto.** È previsto per ospitare la logica di raccolta, consumo e deterioramento delle risorse in futuro, quando la complessità lo richiederà.

Nel prototipo attuale, la logica di raccolta è distribuita tra:

- `js/world.js` – riduzione della densità della cella (`reduceCellDensity`).
- `js/units.js` – raccolta da parte delle spedizioni.
- `js/main.js` – raccolta locale e previsioni.

## Funzioni principali

Nessuna. File vuoto.

## Dipendenze in ingresso

- `index.html` – carica lo script per ordine di caricamento. Attualmente non contiene codice.

## Dipendenze in uscita

Nessuna.

## Parametri GameConfig usati

Nessuno.

## Stato globale modificato

Nessuno.

## Note per modifiche

- Quando si inizierà a implementare la lavorazione delle risorse (legna → assi), il deterioramento del cibo, o i magazzini, questa è la sede naturale per quella logica.
- Se si sposta della logica qui, aggiornare i documenti Technical degli script che la contenevano (`04_Main.md`, `03_Units.md`).