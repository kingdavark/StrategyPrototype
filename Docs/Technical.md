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

All’inizio di ogni nuovo batch di lavoro, per mantere il contesto
aggiornato della chat, l'utente eseguirà bundle_context.py e incollerà
il contenuto di project_context.txt come primo messaggio, insieme al
SYNC corrente e al batch su cui si sta lavorando. L'assistente leggerà
il bundle per ricostruire il contesto completo.

## Flusso di lavoro nella chat

Prima di proporre qualsiasi modifica al codice, ai documenti di design,
alla pianificazione di un batch o alla scrittura di nuovo codice,
l'assistente deve:

- Recuperare da GitHub il contenuto aggiornato di tutti i file rilevanti
  per il contesto (documenti di design, TECHNICAL.md, file di codice
  coinvolti).

- Verificare sempre il capitolo 5 del TECHNICAL.md, che disciplina il
  flusso di lavoro.

- Non basarsi unicamente sulla memoria della conversazione, ma
  incrociare le informazioni lette dai file con la cronologia della
  chat.

- Identificare i file direttamente o indirettamente collegati alla
  modifica richiesta (es. se si modifica una funzione in world.js,
  verificare anche main.js e units.js se la utilizzano).

- Se vi sono dubbi o incertezze, invece di produrre una risposta di cui
  non si ha sicurezza al 100%, chiedere per aver maggiori informazioni e
  contesto. Non elaborare nulla per induzione come se fosse una cosa
  certa

- Solo dopo questa verifica, procedere con la proposta di modifica.

Durante la sessione:

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

Alla fine di ogni batch, prima di procedere con il commit, l'assistente
seguirà questa procedura:

1\. **Elencare le modifiche da apportare ai documenti**:

- Specificare quali documenti di design (GDD, Concept, Roadmap)
  necessitano aggiornamenti per riflettere le nuove meccaniche o
  decisioni prese durante il batch.

- Se non ci sono modifiche necessarie ai documenti di design,
  dichiararlo esplicitamente (es. "Nessuna modifica necessaria ai
  documenti di design").

- Specificare se il TECHNICAL.md richiede aggiornamenti per nuove
  strutture dati, funzioni o regole di workflow.

2\. **Attendere la conferma esplicita dell'utente**:

- L'assistente non scriverà la descrizione del commit né darà istruzioni
  per il push fino a quando l'utente non avrà confermato che il lavoro
  sul batch è soddisfacente e che gli aggiornamenti ai documenti sono
  corretti.

- Solo dopo la conferma, l'assistente produrrà il messaggio di commit
  (titolo e descrizione) basato su tutte le modifiche effettivamente
  apportate dall'ultimo commit, inclusi aggiornamenti ai documenti.

3\. **Documenti di design (GDD, Concept, Roadmap)**:

- Si aggiornano solo quando una meccanica di gioco è stata validata e
  ritenuta stabile (es. al termine di un MVP).

- Durante i batch intermedi con aggiustamenti di UI, colori di debug o
  piccole modifiche tecniche, non si modificano.

4\. **TECHNICAL.md**:

- Si aggiorna quando vengono introdotte nuove strutture dati, funzioni,
  pattern architetturali o regole di workflow.

- Non si aggiorna per dettagli implementativi minori.

5\. **Eseguire commit e push** con il messaggio fornito dall'assistente,
che includerà tutte le modifiche (codice e documenti).

## Verifica dell’accesso al repository

Per garantire che l'assistente stia leggendo il contenuto reale del
repository e non basandosi solo sulla cronologia della chat, in fondo al
file TECHNICAL.md è presente un numero progressivo (es. \`SYNC: 1\`).
Dopo ogni push, l'utente cambierà questo numero. All'inizio di ogni
risposta che richiede accesso al repository, l'assistente dovrà
riportare il numero SYNC che ha letto, confermando così di aver
effettivamente consultato i file su GitHub.

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

<!-- -->

- Quando vengono fornite modifiche a file esistenti, l'assistente deve
  preservare i commenti già presenti, a meno che le modifiche stesse non
  li rendano obsoleti o errati.

- Tutte le funzioni di update che modificano posizioni, timer o valori
  nel tempo devono utilizzare il delta time (differenza temporale dal
  frame precedente) per garantire la frame-rate independence. Non si
  devono usare valori fissi per frame.

## Spiegazione delle meccaniche durante l’implementazione

Prima di ogni modifica al codice, l'assistente fornirà una breve
spiegazione che copra:

- **Cosa stiamo per implementare** e in che modo si inserisce nel loop
  di gioco attuale.

- **Quali dinamiche di gameplay introduce o modifica**, e quali nuove
  scelte o vincoli crea per il giocatore.

- **Come si riflette sull'interfaccia o sul mondo visibile** (feedback
  visivo, nuovi elementi grafici, cambiamenti nella percezione dello
  stato del gioco). Anche gli strumenti di debug vengono descritti con
  il loro impatto visivo attuale e il potenziale riutilizzo futuro come
  meccaniche di gioco, mantenendo un chiaro distinguo tra "debug" e
  "gameplay".

- **Funzionalità di debug**: anche gli strumenti di debug
  (visualizzazioni temporanee, tooltip di test, overlay informativi)
  vengono descritti con il loro impatto attuale e il potenziale
  riutilizzo futuro come meccaniche di gioco, mantenendo sempre un
  chiaro distinguo tra "debug" e "gameplay".

- **Spiegazione del codice fornito**: ogni volta che l'assistente
  fornisce un blocco di codice (un intero file o una porzione da
  incollare), lo accompagnerà con una breve spiegazione in linguaggio
  semplice di cosa fa quel codice, qual è la logica generale e come si
  collega al resto del sistema. Questa spiegazione è aggiuntiva rispetto
  ai commenti già presenti nel codice e serve a dare una visione
  d'insieme prima di entrare nei dettagli implementativi.

Questo approccio garantisce che ogni decisione implementativa sia
consapevole e allineata ai pilastri del design, e che il prototipo
evolva in modo coerente.

Inoltre, darà **istruzioni passo passo** per l’implementazione, cioè un
elenco operativo per l'utente, scritto in linguaggio semplice, che
include:

- Quali file aprire in VS Code.

- Cosa incollare esattamente e in quale punto del file.

- Quali tasti premere (es. Ctrl+S per salvare).

- Come eseguire i test manuali per verificare il funzionamento.

In questo modo ogni modifica è comprensibile anche a un non tecnico e
immediatamente testabile.

## Checklist di test al termine di ogni batch

Alla fine di ogni sessione di implementazione, l'assistente fornirà una
checklist di test manuali per verificare che quanto sviluppato funzioni
correttamente. La checklist includerà:

- Azioni specifiche da compiere nel gioco (es. "clicca su una cella
  verde").

- Il comportamento atteso (es. "il pop deve iniziare a muoversi verso la
  cella").

- Eventuali controlli nella console del browser (es. "non devono
  apparire errori rossi").

L'utente eseguirà i test e segnalerà eventuali anomalie prima di
procedere al commit.

## Aggiornamento della documentazione al termine di ogni sessione

Alla fine di ogni sessione, l'assistente ricorderà all'utente di:

- Verificare se i documenti di design (GDD, roadmap, concept) devono
  essere aggiornati per riflettere le nuove meccaniche implementate o le
  decisioni prese durante la sessione.

- Aggiornare il TECHNICAL.md se sono state introdotte nuove strutture
  dati, funzioni o pattern architetturali.

- Fare commit e push di tutti i file modificati (codice e
  documentazione) con un messaggio chiaro.

# Riferimenti incrociati

- I documenti di design completi (Concept Semplificato, Concept
  Completo, Roadmap, GDD Esteso) costituiscono la specifica di
  riferimento per il comportamento del gioco.

- Questo documento descrive l'implementazione tecnica e deve essere
  aggiornato ogni volta che viene presa una decisione architetturale
  rilevante.

SYNC: 112
