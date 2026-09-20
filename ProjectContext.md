# Contesto progetto Dinastia

Prototipo di strategico 4X in tempo reale con Phaser 3.

## Documentazione

- Docs/GameDesign/ – logica di gioco, sistemi, UI/UX, formule. **Non modificare mai questi file.**
- Docs/Technical/ – descrizione di ogni script, sue funzioni, dipendenze in ingresso e in uscita.
- Docs/Skills/ – pipeline di lavoro (Game Designer e Programmer Agent).
- Docs/Roadmap/ – stato di avanzamento.

## Convenzioni

- Codice e commenti in inglese.
- Ogni nuovo parametro va in GameConfig e nel pannello debug.
- Usare delta time per aggiornamenti temporali.
- Non mischiare input di stati diversi (map vs camp).
- La raccolta riduce solo la cella esatta, non le celle vicine.

## Flusso di lavoro

1. Leggi il prompt del Game Designer.
2. Leggi i documenti Technical degli script coinvolti e le loro sezioni "Dipendenze".
3. Fai un brief generale delle modifiche e attendi OK.
4. Applica le modifiche una per una, con approvazione per ciascuna.
5. Dopo tutte le modifiche del batch, fornisci test tecnici.
6. Aggiorna SOLO i documenti Technical, mai quelli di Game Design.
7. Prepara il messaggio di commit (titolo + descrizione). L'utente esegue git.

## Regole

- **Non modificare mai i file in `Docs/GameDesign/`.** Se noti un'incoerenza, segnalala all'utente, non correggerla tu.
- Prima di modificare uno script, leggi il suo documento Technical e le sezioni "Dipendenze in ingresso" e "Dipendenze in uscita".
- Se una modifica cambia una dipendenza o un'interfaccia usata da altri script, aggiorna il documento Technical corrispondente.
- Segui la skill `Docs/Skills/Programmer.md` per il flusso completo.

## File principali

- `js/config.js` – GameConfig e parametri
- `js/world.js` – griglia spaziale e densità
- `js/units.js` – Pop, Expedition, camp
- `js/main.js` – scena Phaser, input, rendering, raccolta locale
- `js/debug.js` – pannello debug e assegnazione lavoratori
- `js/time.js` – controllo velocità di gioco