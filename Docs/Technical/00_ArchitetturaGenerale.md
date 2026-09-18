# Architettura Generale

## Scopo

Questo documento descrive lo stack tecnologico, la struttura dei file, le convenzioni di codice e l'architettura generale del prototipo. Serve come punto di ingresso per comprendere come è organizzato il progetto.

## Stack tecnologico

- Linguaggio: JavaScript (ES6+)

- Motore di rendering 2D: Phaser 3 (caricato da CDN)

- Gestione moduli: inizialmente script globali concatenati; possibile migrazione a moduli ES6 con Vite in futuro

## Struttura file

- `index.html` – punto di ingresso, carica Phaser e gli script

- `css/style.css` – stili per UI HTML sovrapposta

- `js/config.js` – parametri di gioco centralizzati nell'oggetto `GameConfig`

- `js/world.js` – griglia spaziale, layer di densità, query spaziali

- `js/units.js` – classi per pop, unità, spedizioni

- `js/resources.js` – logica di raccolta, consumo, deterioramento (futuro)

- `js/ui.js` – interfaccia utente, pannelli, tooltip (futuro)

- `js/time.js` – gestione pausa/play/velocità

- `js/main.js` – inizializzazione di Phaser e configurazione globale

- `js/debug.js` – pannello di debug e collegamento ai campi HTML

## Ordine di caricamento degli script

L'ordine di caricamento in `index.html` è importante perché gli script sono globali e dipendono l'uno dall'altro:

1. Phaser (CDN)

2. `config.js` (definisce GameConfig e funzioni derivate)

3. `world.js` (usa GameConfig per CELL_SIZE e dimensioni griglia)

4. `units.js` (usa GameConfig e world)

5. `resources.js`

6. `ui.js`

7. `time.js`

8. `main.js` (inizializza la scena Phaser)

9. `debug.js` (collega il pannello HTML, caricato dopo gli elementi DOM)

## Architettura ad alto livello

Il prototipo è organizzato in moduli con responsabilità separate:

- **Configurazione**: `GameConfig` centralizza tutti i parametri di gioco. Nessuna costante di gioco hardcoded nel resto del codice.

- **Mondo**: la griglia spaziale e i layer di densità vivono in `world.js`. Espone funzioni di query e modifica (es. `getCell`, `reduceCellDensity`).

- **Entità**: le classi `Pop`, `Expedition` e l'oggetto `camp` sono in `units.js`. Gestiscono la logica di lavoratori e spedizioni.

- **Tempo**: `TimeManager` in `time.js` controlla la velocità di simulazione e fornisce il delta di gioco.

- **Scena e rendering**: `main.js` crea la scena Phaser, gestisce l'input, disegna griglia, pop, campo e indicatori.

- **Debug**: `debug.js` collega gli input HTML del pannello debug ai parametri di `GameConfig`.

## Ciclo di aggiornamento (game loop)

Phaser chiama `update(time, delta)` a ogni frame. La logica di gioco è disaccoppiata dal rendering per garantire coerenza temporale.

1. **TimeManager** calcola il tempo di gioco effettivo (`gameDelta = delta * speedMultiplier`). Se in pausa, `gameDelta = 0`.

2. **Movimento**: tutte le unità con stato `moving` vengono spostate verso il target in base a `speed` e `gameDelta`.

3. **Azioni**: all'arrivo a destinazione, l'unità inizia il lavoro (raccolta, caccia, pesca). Il lavoro ha una durata in giorni/ore del mondo di gioco che corrispondono a un tot di secondi reali.

4. **Consumo risorse**: a intervalli regolari di tempo di gioco (ogni `dayLength` secondi) tutti i pop consumano cibo dalle scorte dell'accampamento. Le spedizioni attive consumano provviste in modo continuo durante l'aggiornamento, usando i valori derivati da GameConfig. Il consumo della popolazione al campo è applicato a fine giornata.

5. **Rigenerazione risorse**: a intervalli regolari, le celle della griglia rigenerano una frazione di densità per ogni layer.

## Convenzioni di codice

- **Lingua**: tutto il codice, i commenti e i nomi dei file sono in inglese. Questo include nomi di variabili, funzioni, classi, messaggi di commit e documentazione tecnica interna al codice.

- **Documenti di design**: possono restare in italiano, in quanto rivolti alla progettazione e non all'implementazione.

- **Commenti**: preservare i commenti già presenti. Aggiungere nuovi commenti solo se necessari.

- **Delta time**: tutte le funzioni di update che modificano posizioni, timer o valori nel tempo devono utilizzare il delta time. Non si devono usare valori fissi per frame.

- **Ricerca spaziale e raggi**: quando si definisce un raggio (es. `areaRadius`, `localGatherRadius`), la selezione delle celle deve essere sempre limitata da una distanza circolare dal centro, non da una griglia quadrata. Il loop può iterare su un rettangolo di celle, ma ogni cella deve essere testata con `Phaser.Math.Distance.Between(...) <= raggio`.

- **Game state**: le modalità di gioco devono essere separate. Esempio: la selezione del campo attiva lo stato "gestione campo", in cui i click sulla mappa hanno significato diverso. Non si devono mischiare input di stati diversi.

- **Configurazione**: ogni nuovo parametro di gioco deve essere aggiunto a `GameConfig`, esposto nel pannello di debug e usato dinamicamente nel codice, evitando costanti locali derivate.

## Commenti e auto-documentazione

Il codice è scritto con nomi di variabili e funzioni chiari ed esplicativi. Ogni file ha un'intestazione che ne descrive lo scopo. Le funzioni complesse hanno commenti in stile JSDoc.

## Repository

Il codice è ospitato su un repository Git (GitHub). La chat è usata per discutere, scrivere snippet e aggiornare la documentazione, non come deposito principale del codice. Il repository contiene tutto il necessario per eseguire il prototipo localmente.

## Riferimenti incrociati

- I documenti di Game Design costituiscono la specifica di riferimento per il comportamento del gioco.

- I documenti Technical descrivono l'implementazione tecnica e devono essere aggiornati quando vengono prese decisioni architetturali rilevanti.