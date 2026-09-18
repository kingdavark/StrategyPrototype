# Contesto progetto Dinastia

Prototipo di strategico 4X in tempo reale con Phaser 3.

## Documentazione

- Docs/GameDesign/ – logica di gioco, sistemi, UI/UX, formule.
- Docs/Technical/ – descrizione moduli, funzioni, architettura.
- Docs/Skills/ – pipeline di lavoro (Game Designer e Programmer Agent).
- Docs/Roadmap/ – stato di avanzamento.

## Convenzioni

- Codice e commenti in inglese.
- Ogni nuovo parametro va in GameConfig e nel pannello debug.
- Usare delta time per aggiornamenti temporali.
- Non mischiare input di stati diversi (map vs camp).

## Flusso di lavoro

1. Leggi il prompt del Game Designer.
2. Fai un brief generale delle modifiche e attendi OK.
3. Applica le modifiche una per una, con approvazione per ciascuna.
4. Dopo tutte le modifiche del batch, fornisci test tecnici.
5. Aggiorna la documentazione tecnica se necessario.
6. Prepara commit e push.

## File principali

- js/config.js – GameConfig
- js/world.js – griglia spaziale
- js/units.js – Pop, Expedition, Camp
- js/main.js – scena Phaser, input, rendering
- js/debug.js – pannello debug