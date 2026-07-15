# Stack tecnologico

- **Linguaggio:** JavaScript (ES6+)

- **Motore di rendering 2D:** Phaser 3 (caricato da CDN)

- **Gestione moduli:** inizialmente script globali concatenati;
  possibile migrazione a moduli ES6 con Vite in futuro

- **Struttura file:**

  - index.html – punto di ingresso, carica Phaser e gli script

  - css/style.css – stili per UI HTML sovrapposta

  - js/main.js – inizializzazione di Phaser e configurazione globale

  - js/world.js – griglia spaziale, layer di densità, query spaziali

  - js/units.js – classi per pop, unità, branchi

  - js/resources.js – logica di raccolta, consumo, deterioramento
    (futuro)

  - js/ui.js – interfaccia utente, pannelli, tooltip (futuro)

  - js/time.js – gestione pausa/play/velocità (futuro)

# Griglia spaziale e risorse diffuse

## **Struttura dati**

Il mondo è suddiviso in una griglia rettangolare di celle invisibili, di
dimensione fissa CELL_SIZE (es. 100 pixel).

Ogni cella è un oggetto con le seguenti proprietà:

javascript

{

cx, cy, *// coordinate intere della cella nella griglia*

entities: \[\], *// entità mobili (pop, branchi) attualmente in questa
cella*

forestDensity: 0.0, *// 0..1*

forageDensity: 0.0, *// 0..1 (vegetazione raccoglibile)*

smallGameDensity: 0.0, *// 0..1 (piccola fauna terrestre)*

fishDensity: 0.0, *// 0..1 (pesci, solo in celle d'acqua)*

fertility: 0.5 *// 0..1 (default medio)*

}

La griglia è memorizzata in un array 2D o in una Map con chiave "cx,cy".

## Funzioni principali (world.js)

- worldToCell(x, y) → {cx, cy}: converte coordinate mondo in coordinate
  cella.

- getCell(cx, cy) → oggetto cella (crea la cella se non esiste).

- getEntitiesInRadius(x, y, radius) → array di entità: interroga le
  celle nel raggio e filtra per distanza esatta.

- modifyDensity(x, y, layer, amount, impactRadius): modifica la densità
  del layer indicato nelle celle intorno alla posizione, con decadimento
  radiale.

## Layer di densità attuali (MVP)

| Layer | Proprietà | Descrizione |
|----|----|----|
| Foresta | forestDensity | Densità di alberi. Ridotta dal taglio, rigenerazione lenta. |
| Vegetazione raccoglibile | forageDensity | Bacche, erbe, radici. Ridotta dalla raccolta, rigenerazione stagionale. |
| Piccola fauna terrestre | smallGameDensity | Conigli, uccelli. Ridotta dalla caccia, rigenerazione continua. |
| Pesci | fishDensity | Disponibile solo in celle d'acqua. Ridotto dalla pesca. |
| Fertilità | fertility | Per uso futuro (agricoltura). |

# Entità mobili

## Unità generica

Ogni entità mobile (pop, branco) possiede almeno:

javascript

{

id: string,

type: 'pop' \| 'herd',

x, y, *// posizione continua in pixel*

targetX, targetY, *// destinazione (per movimento)*

speed: 50, *// pixel al secondo a velocità 1x*

state: 'idle' \| 'moving' \| 'working'

}

## Pop (gruppo di persone)

Estende l'unità generica con:

- population: numero di individui nel gruppo

- task: { type: 'gatherWood' \| 'hunt' \| 'forage' \| 'fish' \|
  'trapSmallGame', location: {x, y} }

- inventory: { wood: 0, food: 0 } – risorse trasportate (in futuro
  potranno essere differenziate)

- rations: provviste di cibo portate per il viaggio

## Branco (animali)

- species: es. 'deer', 'bison'

- herdSize: numero di capi

- habitat: tipo di terreno preferito

- Comportamento AI: movimento lento casuale entro l'habitat, fuga se
  minacciato.

# Ciclo di aggiornamento (game loop)

Phaser chiama update(time, delta) a ogni frame. La logica di gioco può
essere disaccoppiata dal rendering per garantire coerenza temporale.

1.  **TimeManager** calcola il tempo di gioco effettivo (gameDelta =
    delta \* speedMultiplier). Se in pausa, gameDelta = 0.

2.  **Movimento:** tutte le unità con stato 'moving' vengono spostate
    verso il target in base a speed e gameDelta.

3.  **Azioni:** all'arrivo a destinazione, l'unità inizia il lavoro
    (raccolta, caccia, pesca). Il lavoro ha una durata in giorni/ore
    all’interno del mondo di gioco (che corrispondono a un tot di
    secondi nella realtà).

4.  **Consumo risorse:** a intervalli regolari di tempo di gioco (es.
    ogni dayLength secondi) tutti i pop consumano cibo dalle scorte
    dell'accampamento.

5.  **Rigenerazione risorse:** a intervalli regolari, le celle della
    griglia rigenerano una frazione di densità per ogni layer (es. +0.01
    per forestDensity al giorno se non tagliata).

# Gestione del codice e collaborazione via chat

## Repository

Il codice è ospitato su un repository Git (GitHub). La chat è usata per
discutere, scrivere snippet e aggiornare la documentazione, **non** come
deposito principale del codice. Il repository contiene tutto il
necessario per eseguire il prototipo localmente.

## Mantenimento del contesto tra chat

All'inizio di una nuova conversazione, per garantire la continuità del
lavoro, è necessario incollare i seguenti documenti aggiornati:

- Concept Semplificato

- Concept Completo (capitolo 1 della Bibbia)

- Roadmap del Prototipo

- Roadmap Generale del Gioco

- GDD Esteso (Bibbia completa)

- Questo documento (TECHNICAL.md)

In questo modo l'assistente avrà piena conoscenza del progetto e potrà
continuare a lavorare senza perdita di contesto.

## Flusso di lavoro nella chat

- **Modifiche a file esistenti:** l'assistente fornisce solo la porzione
  di codice modificata, indicando chiaramente in quale file e in quale
  punto va inserita.

- **Nuovi file:** l'assistente fornisce il contenuto completo.

- Ogni modifica è accompagnata da un breve commento che spiega cosa fa e
  perché.

- L'utente applica le modifiche localmente, testa il codice, e poi
  committa e pusha sul repository.

- **Principio di non-assunzione:** l'assistente non assume nulla se non
  è sicuro al 100%; in caso di dubbio, chiede chiarimenti prima di
  procedere.

- **Approccio iterativo:** prima si condivide e si concorda il design,
  poi si scrive il codice.

## Commenti e auto-documentazione

Il codice è scritto con nomi di variabili e funzioni chiari ed
esplicativi. Ogni file ha un'intestazione che ne descrive lo scopo. Le
funzioni complesse hanno commenti in stile JSDoc.

## Convenzioni di codice

- **Lingua:** tutto il codice, i commenti e i nomi dei file sono
  in **inglese**. Questo include nomi di variabili, funzioni, classi,
  messaggi di commit e documentazione tecnica interna al codice.

- I documenti di design (GDD, roadmap, concept) possono restare in
  italiano, in quanto rivolti alla progettazione e non
  all’implementazione.

- Questa scelta facilita la coerenza, la ricerca di aiuto online e la
  portabilità del progetto.

## Spiegazione delle meccaniche durante l’implementazione

Prima di ogni modifica al codice, l'assistente fornirà una breve
spiegazione che copra:

- **Cosa stiamo per implementare** e in che modo si inserisce nel loop
  di gioco attuale.

- **Quali dinamiche di gameplay introduce o modifica**, e quali nuove
  scelte o vincoli crea per il giocatore.

- **Come si riflette sull'interfaccia o sul mondo visibile** (feedback
  visivo, nuovi elementi grafici, cambiamenti nella percezione dello
  stato del gioco).

Questo approccio garantisce che ogni decisione implementativa sia
consapevole e allineata ai pilastri del design, e che il prototipo
evolva in modo coerente.

# Riferimenti incrociati

- I documenti di design completi (Concept Semplificato, Concept
  Completo, Roadmap, GDD Esteso) costituiscono la specifica di
  riferimento per il comportamento del gioco.

- Questo documento descrive l'implementazione tecnica e deve essere
  aggiornato ogni volta che viene presa una decisione architetturale
  rilevante.
