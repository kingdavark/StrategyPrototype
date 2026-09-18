# World Grid

## Scopo

Questo documento descrive la griglia spaziale nascosta, i layer di densità, le funzioni di query e modifica delle celle. È il modulo che gestisce la mappa continua a livello di dati.

## Struttura dati

Il mondo è suddiviso in una griglia rettangolare di celle invisibili, di dimensione fissa `CELL_SIZE` (configurabile in `GameConfig.cellSize`).

Ogni cella è un oggetto con le seguenti proprietà:

- `cx`, `cy`: coordinate intere della cella nella griglia

- `entities`: array di entità mobili (pop, branchi) attualmente in questa cella

- `forageDensity`: densità di vegetazione raccoglibile (0..1)

- `forestDensity`: densità di alberi (0..1)

- `smallGameDensity`: densità di piccola fauna terrestre (0..1)

- `fishDensity`: densità di pesci (0..1, solo in celle d'acqua)

- `fertility`: fertilità del suolo (0..1, default medio)

- `assignedWorkers`: numero di lavoratori locali assegnati alla cella

- `foodGatheredToday`: cibo raccolto da lavoratori locali oggi

- `gatheredDaily`: cibo raccolto da lavoratori locali nel giorno precedente

- `warningShown`: flag per evitare avvisi ripetuti

La griglia è memorizzata in un array 2D (`grid`). L'accesso avviene tramite `grid[cy][cx]`.

## Costanti derivate

- `CELL_SIZE = GameConfig.cellSize`

- `GRID_COLS = Math.ceil(GameConfig.worldWidth / CELL_SIZE)`

- `GRID_ROWS = Math.ceil(GameConfig.worldHeight / CELL_SIZE)`

Queste costanti sono definite all'avvio e non cambiano durante la sessione. Per applicare modifiche a `cellSize`, `worldWidth` o `worldHeight` è necessario ricaricare la pagina.

## Funzioni principali

### worldToCell(worldX, worldY)

Converte coordinate mondo (pixel) in coordinate cella. Restituisce un oggetto `{ cx, cy }`. Usa `Math.floor` per determinare la cella.

### getCell(cx, cy)

Restituisce l'oggetto cella alle coordinate date. Se la cella non esiste, la crea con valori di default (densità 0, nessun lavoratore, nessun flag). Le celle vengono create in modo lazy.

### createGrid()

Inizializza tutte le celle della griglia chiamando `getCell` per ogni coordinata. Viene chiamata una sola volta in fase di `create()`.

### initializeForageDensity()

Popola i valori iniziali di `forageDensity` creando alcune patch circolari con densità decrescente dal centro verso il bordo. Usa una semplice funzione `setPatch(centerCX, centerCY, radius, peakDensity)` che applica un falloff lineare.

### getEntitiesInRadius(worldX, worldY, radius)

Restituisce le entità mobili entro un raggio da una posizione. Attualmente restituisce un array vuoto, ma in futuro interrogherà le celle della griglia e filtrerà per distanza esatta.

### reduceCellDensity(cell, amount)

Riduce la densità di una singola cella senza decadimento radiale. Usata per la raccolta di risorse.

- Prende in input un oggetto `cell` (ottenuto da `getCell`) e un `amount` positivo.

- Sottrae `amount` da `cell.forageDensity` e clampa il risultato tra 0 e 1.

- Non tocca altre celle.

Questa funzione sostituisce la precedente `modifyDensity` per la raccolta. La logica di modifica puntuale è stata scelta per evitare di consumare risorse di celle vicine in modo non voluto.

### modifyDensity(worldX, worldY, layer, amount, impactRadius)

Funzione attualmente commentata nel codice. Modifica la densità del layer indicato nelle celle intorno alla posizione, con decadimento radiale lineare. È riservata a futuri effetti ad area (es. incendi, disboscamento diffuso). Non è usata dalla raccolta.

## Layer di densità attuali

- **Foresta** (`forestDensity`): densità di alberi. Ridotta dal taglio, rigenerazione lenta.

- **Vegetazione raccoglibile** (`forageDensity`): bacche, erbe, radici. Ridotta dalla raccolta, rigenerazione stagionale.

- **Piccola fauna terrestre** (`smallGameDensity`): conigli, uccelli. Ridotta dalla caccia, rigenerazione continua.

- **Pesci** (`fishDensity`): disponibile solo in celle d'acqua. Ridotto dalla pesca.

- **Fertilità** (`fertility`): per uso futuro (agricoltura).

## Note tecniche

- La griglia è pensata per supportare mappe molto ampie e simulazioni complesse, ma attualmente la dimensione è limitata a `worldWidth x worldHeight` in pixel.

- La creazione delle celle è lazy: una cella viene creata solo quando viene richiesta per la prima volta. Tuttavia, all'avvio `createGrid()` popola tutte le celle, quindi la creazione lazy serve solo per sicurezza.

- I valori di densità sono float tra 0 e 1. La funzione `reduceCellDensity` garantisce che non scendano mai sotto 0 né superino 1.

- La ricerca di celle con densità avviene tramite iterazione sulle coordinate di griglia e test di distanza con `Phaser.Math.Distance.Between`.

## Interazioni con altri moduli

- `config.js`: fornisce `GameConfig` per dimensioni e parametri di densità.

- `units.js`: usa `getCell` e `reduceCellDensity` per la raccolta delle spedizioni.

- `main.js`: usa `getCell` per il rendering della griglia, la raccolta locale e le previsioni.

- `debug.js`: in fase di debug può mostrare la densità delle celle.