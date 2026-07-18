# Prototipo 1

## Concept

**Titolo provvisorio:** *Dinastia* (o *Eredità*)

**High Concept**\
Un 4X in tempo reale dove guidi una dinastia, non uno Stato. Parti con
una tribù nomade, la fai diventare stanziale, e gestisci risorse finite,
logistica reale e informazioni imperfette, mentre il tuo potere può
crescere o sgretolarsi. Il mondo non si ferma mai, ma puoi rallentarlo
per decidere.

**Pilastri del design (per il prototipo)**

1.  **Sopravvivenza tangibile** – risorse limitate, logistica fisica,
    consumo di provviste.

2.  **Informazione imperfetta** – ciò che sai dipende da chi te lo dice.
    Le certezze sono poche.

3.  **Tempo reale con controllo del ritmo** – pausa tattica,
    accelerazione, flusso continuo.

**Game Loop minimo**

1.  Osservi la mappa 2D con la tua tribù accampata.

2.  Selezioni un gruppo di persone, le assegni a un compito (cacciare,
    raccogliere legna).

3.  Il gruppo si sposta (tempo reale), consuma cibo durante il viaggio,
    raggiunge la risorsa, la sfrutta, torna.

4.  La risorsa arriva all’accampamento: è disponibile per costruire o
    sfamare.

5.  Puoi mettere in pausa per ripianificare. Puoi accelerare per vedere
    gli effetti nel tempo.

**Cosa testare con il primo prototipo**

- Il loop "assegna compito → spostamento → raccolta → ritorno" è
  comprensibile e divertente?

- La gestione pausa/play/velocità è intuitiva?

- La rappresentazione visiva di posizione certa vs proiettata vs da
  report funziona?

- La mappa continua (senza griglia) e l’interazione click-per-spostarsi
  sono fluide?

**Confini del prototipo**

- Mappa 2D con una foresta, un fiume, una pianura.

- Una tribù di 30 persone, divise in "pop".

- Due risorse raccoglibili: legna e cibo.

- Un accampamento che consuma cibo.

- Pausa/play/accelerazione.

- Movimento con pathfinding base (verso il click).

- Escluso: diplomazia, altre fazioni, tecnologia, miniere, lavorazione
  risorse, politica interna, religione, forme di governo.

**Stack tecnico**\
HTML5, CSS, JavaScript con libreria Phaser 3 (rendering 2D, input,
gestione scene).

**Ispirazioni**

- Crusader Kings 3 (dinastia, informazione imperfetta, tempo reale con
  pausa)

- Victoria 3 / Stellaris (pop system, risorse logistiche)

- Banished / Dawn of Man (sopravvivenza tribale, risorse tangibili)

- King's Orders (report e comunicazione)

## Roadmap

**Logica di sviluppo del prototipo**\
Il prototipo parte implementando le fondamenta trasversali del gioco
(mappa continua, pop system, informazione imperfetta, tempo reale) e
aggiunge funzionalità in parallelo alla progressione storica simulata.
Ogni iterazione sblocca nuove meccaniche quando la civiltà del giocatore
raggiunge la soglia tecnologica/sociale corrispondente, o quando le
fondamenta precedenti sono state validate. In pratica, l'MVP copre l'Era
0 (nomadismo), e le iterazioni successive attivano le ere successive,
aggiungendo strati di complessità al sistema già esistente.

**MVP1 – Raccolta cibo e sopravvivenza base**

Obiettivo generale\
Il giocatore controlla un gruppo di raccoglitori, può spostarli su una
mappa continua, raccogliere cibo vegetale, vedere le zone impoverirsi e
rigenerarsi, e gestire le scorte che vengono consumate nel tempo. Il
loop base è: esplorare, raccogliere, tornare al campo, sopravvivere.

**Batch 1 – Setup Phaser funzionante**

- Installazione di Phaser 3 via CDN.

- Struttura base di index.html, main.js, style.css.

- Canvas visualizzato correttamente nel browser.

- Nessuna meccanica di gioco, solo infrastruttura tecnica.

**Batch 2 – Griglia spaziale e mappa con zone di cibo**

- Implementazione della griglia spaziale nascosta (world.js).

- Layer forageDensity con distribuzione non uniforme:

  - Zone ad alta densità (macchie di bacche) rappresentate visivamente
    con colori più intensi.

  - Zone a bassa densità con colori tenui.

  - Zone a densità zero senza colore.

- Visualizzazione di debug: ogni cella della griglia è colorata in base
  alla densità, così il giocatore può vedere dove il cibo è più
  abbondante.

- Meccanica: il mondo contiene risorse diffuse; il giocatore distingue a
  colpo d'occhio le aree più ricche e decide dove mandare i
  raccoglitori.

- La densità di cibo è visualizzata con una scala a 7 colori, con
  intervalli precisi e non sovrapposti:

  - 0.90-1.00: verde scuro

  - 0.75-0.89: verde medio

  - 0.50-0.74: verde chiaro

  - 0.25-0.49: giallo

  - 0.05-0.24: arancione

  - 0.01-0.04: rosso

  - 0.00: nessun colore (sfondo)

**Batch 3 – Pop e movimento**

- Definizione della classe base per entità mobili e della classe Pop
  (units.js).

- Un pop (gruppo di raccoglitori) appare sulla mappa.

- Click su un punto qualsiasi della mappa: il pop si muove in modo
  continuo, senza scatti, verso quella posizione.

- Meccanica: interazione diretta con il mondo. Non esistono griglie
  visibili che vincolano il movimento. Il giocatore sposta fisicamente
  la sua gente.

**Batch 4 – Raccolta cibo e riduzione della densità**

- Quando il pop arriva su una cella con forageDensity maggiore di zero,
  inizia automaticamente a raccogliere cibo.

- La quantità di cibo raccolta per secondo è proporzionale alla densità
  locale: zone ricche rendono di più, zone povere di meno.

- La funzione modifyDensity riduce la densità della cella e di quelle
  vicine (raggio configurabile), simulando un prelievo localizzato.

- Se la densità arriva a zero, quella zona è temporaneamente esaurita e
  non produce più cibo.

- Meccanica: il giocatore vede le zone impoverirsi dopo la raccolta.
  Deve decidere se insistere su una zona ricca rischiando di esaurirla,
  o spostarsi altrove.

**Batch 5 – Rientro al campo, scorta e consumo**

- Definizione di un punto base (accampamento) sulla mappa.

- Il giocatore può cliccare sull'accampamento per ordinare al pop di
  tornare e scaricare il cibo raccolto.

- Un contatore globale mostra le scorte di cibo della tribù.

- Introduzione del consumo: ogni giorno di gioco (intervallo
  configurabile) una quantità di cibo viene sottratta dalle scorte in
  base al numero di pop presenti.

- Se le scorte arrivano a zero, per ora viene mostrato un avviso; in
  futuro comporterà la morte dei pop.

- Meccanica: il giocatore deve bilanciare la raccolta con il consumo
  costante. Non basta accumulare, bisogna mantenere un flusso positivo.
  Il ritorno al campo diventa una decisione strategica: tornare troppo
  presto spreca tempo di viaggio, tornare troppo tardi rischia di far
  esaurire le scorte.

**Batch 6 – Controlli del tempo (pausa, play, velocità)**

- Implementazione del TimeManager (time.js).

- Tre velocità di simulazione: 1x (normale), 2x (accelerata), 0x
  (pausa).

- Interfaccia minima: pulsanti o tasti per cambiare velocità.

- La raccolta, il movimento e il consumo dipendono dal tempo di gioco
  effettivo, non dal framerate.

- Meccanica: il giocatore può mettere in pausa per pianificare con
  calma, o accelerare quando non ci sono decisioni urgenti. Questo è il
  primo passo verso il pilastro "tempo reale con controllo del ritmo".

**Batch 7 – Rigenerazione base del cibo**

- Le celle con forageDensity si rigenerano lentamente nel tempo (es. una
  piccola frazione al giorno).

- La rigenerazione è più rapida in celle con densità bassa, per simulare
  la ricrescita naturale.

- Una zona completamente esaurita (densità zero) impiega più tempo a
  iniziare a rigenerare.

- Meccanica: il giocatore non può esaurire una zona per sempre, ma deve
  ruotare le aree di raccolta per non restare senza cibo. Questo
  introduce una prima forma di gestione sostenibile delle risorse.

**Dopo il Batch 7\
Al termine di MVP1 avremo un loop di sopravvivenza funzionante:**

- Il giocatore sposta i raccoglitori sulla mappa.

- Raccoglie cibo in zone a densità variabile.

- Le zone si impoveriscono e si rigenerano.

- Le scorte vengono consumate nel tempo.

- Il tempo può essere controllato con pausa, play e velocità.

**NOTE FINE MVP1**

- Tool per disegnare la mappa (apporre foreste, pesci, gathering food
  ecc. con dei pennelli) \[è forse troppo presto\]

- Creazione di algoritmo per creazione foreste e cibo in base a
  tipologia terreno delle celle \[anche questo forse da vedere più
  avanti\]

- Non abbiamo minimamente lavorato sulla tipologia del terreno
  (montagna, acqua, acqua profonda, collina, pianura) e le
  caratteristiche di esso (foresta, erba ecc.). Questo perché sulla base
  del tipo di terreno poi dipende il cibo (la pesca è solo nelle acque,
  le aree di pianura con erba vicino ai fiumi hanno più cibo ecc.). Da
  forse vedere subito dopo MVP1?

**MVP2 – Diversificazione delle fonti di cibo (caccia e pesca)**

MVP2 introduce i branchi mobili (grandi animali) e la pesca in acque
interne. Il giocatore impara a diversificare le fonti di cibo oltre alla
raccolta vegetale. La caccia richiede movimento attivo (inseguire il
branco), mentre la pesca è stanziale ma limitata alle celle d'acqua.

Nuova definizione:

- Branchi di grandi animali appaiono sulla mappa come entità mobili.
  Ogni branco ha una specie, un numero di capi, un habitat preferito e
  un tasso di riproduzione.

- Il giocatore può assegnare un pop alla caccia: deve avvicinarsi al
  branco, e ogni ciclo di caccia riduce i capi e produce carne e pelli.
  Se il branco scende sotto una soglia, si estingue localmente.

- Nelle celle che intersecano fiumi o laghi, il layer fishDensity
  permette la pesca. Funziona come la raccolta vegetale (riduce densità,
  si rigenera), ma solo in acqua.

- L'interfaccia mostra le nuove risorse (carne, pesce) accanto al cibo
  vegetale. Per ora tutte valgono come "cibo", ma vengono registrate
  separatamente per usi futuri.

- Meccanica: la caccia è più redditizia ma richiede inseguimento e può
  esaurire i branchi. La pesca è stabile ma limitata geograficamente. Il
  giocatore deve decidere come allocare i pop tra raccolta, caccia e
  pesca.

**MVP3 – Raccolta legna, lavorazione e strumenti**

MVP3 introduce il layer forestDensity e la raccolta di legna. Poi la
lavorazione (legna → tool) per migliorare la caccia e la raccolta di
cibo in generale. L'ordine logico è: risorsa grezza, lavorazione, tool.

DA RICORDARE A DEEPSEEK: controllare e confermare che gli strumenti in
legna vennero prima di quelli in pietra.

Nuova definizione:

- Attivazione del layer forestDensity sulla griglia. Le foreste sono
  visivamente distinguibili (verde scuro). La raccolta di legna riduce
  la densità localmente, come per il forage.

- Il giocatore può assegnare pop alla raccolta di legna. La legna grezza
  viene trasportata all'accampamento.

- Introduzione della lavorazione: la legna grezza può essere trasformata
  in tool (azione "lavora legna" al campo).

- Costruzione dei tool: consuma legna. I tool possono essere armi per la
  caccia, la pesca o bastoni/ceste per migliorare la raccolta delle
  bacche

- Meccanica: la legna diventa la prima risorsa non commestibile. La
  lavorazione introduce il concetto di catena produttiva. Si gettano le
  basi per la specializzazione dei pop (raccoglitori, taglialegna,
  artigiani).

**MVP4 – Informazione imperfetta e report**

Nessuna modifica necessaria. Le meccaniche di visibilità (certo,
proiettato, da report) e di stima delle scorte sono indipendenti dal
tipo di risorsa. Quando le implementeremo, applicheremo l'incertezza a
tutte le risorse (cibo vegetale, carne, pesce, legna, assi).

Testo attuale confermato:

- Il campo base ha una "riserva di cibo" che non conosci esattamente:
  vedi una stima arrotondata.

- Per sapere quanta legna hai realmente, devi inviare qualcuno a
  controllare o aspettare il report di chi torna.

- Raggio visivo del giocatore: dove hai uomini, vedi; il resto è buio o
  sfocato.

- I report possono essere ritardati o imprecisi in base alla distanza.

<!-- -->

- Barra del tempo (velocità 1x, 2x, pausa).

- Indicatore di posizione:

  - Certa (colore pieno) se nel raggio visivo.

  - Proiettata (desaturata con interpolazione) se fuori dal raggio.

  - Da report (lampeggiante o con indicatore "R") quando arriva un
    messaggio.

- Tooltip base per risorse e pop.

**MVP5 – Seconda tribù e territorio**

Nessuna modifica necessaria. La competizione per le risorse funziona con
qualsiasi tipo di layer o branco.

Testo attuale confermato:

- Una seconda tribù vicina condivide la stessa foresta e le stesse zone
  di cibo.

- Se entrambe raccolgono o cacciano, le risorse si esauriscono prima.

- Possibile scontro se i gruppi si incrociano (combattimento basilare).

- Inizio del concetto di "territorio d'uso": la risorsa è di chi la sta
  usando.

**CONCETTI DA RECUPERARE POI:**

- Deterioramento risorse

**Oltre MVP5**

Le iterazioni successive del prototipo seguiranno la progressione
storica (Era 1: stanzialità, agricoltura, prime strutture; Era 2:
metalli, scrittura, amministrazione; ecc.), sbloccando funzionalità
corrispondenti man mano che le fondamenta tecniche lo permettono. La
priorità sarà sempre validare il loop di base prima di aggiungere
complessità.

Prima però procederemo a raffinare il loop cacciatore/raccoglitore con
lo sviluppo tecnologico della pietra, dei primi edifici e delle prime
strutture sociali e progressi culturali.
