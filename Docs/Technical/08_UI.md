# js/ui.js

## Scopo

**File attualmente vuoto.** È previsto per ospitare la logica dell'interfaccia utente (pannelli, tooltip, notifiche) in futuro, quando la complessità lo richiederà.

Nel prototipo attuale, la logica di rendering è distribuita tra:

- `js/main.js` – pannelli info, settlement, speed, e rendering sulla scena Phaser.
- `js/debug.js` – pannelli HTML (debug e lavoratori locali).
- `index.html` – struttura HTML dei pannelli.

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

- Quando l'interfaccia diventerà più complessa (tooltip dinamici, notifiche, pannelli di gestione), questa è la sede naturale per quella logica.
- Se si sposta dell'UI qui, aggiornare i documenti Technical degli script che la contenevano (`04_Main.md`, `05_Debug.md`).