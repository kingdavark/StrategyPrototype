# Prototipo 1

## Panoramica

Il Prototipo 1 copre l'Era 0 (Nomadismo) e getta le basi tecniche per le ere successive. L'obiettivo è validare il loop di sopravvivenza: esplorare, raccogliere, tornare al campo, sopravvivere.

## Logica di sviluppo

Il prototipo parte implementando le fondamenta trasversali del gioco (mappa continua, pop system, informazione imperfetta, tempo reale) e aggiunge funzionalità in parallelo alla progressione storica simulata. Ogni iterazione sblocca nuove meccaniche quando la civiltà del giocatore raggiunge la soglia tecnologica/sociale corrispondente, o quando le fondamenta precedenti sono state validate. In pratica, l'MVP copre l'Era 0 (nomadismo), e le iterazioni successive attivano le ere successive, aggiungendo strati di complessità al sistema già esistente.

## MVP1 – Raccolta cibo e sopravvivenza base

Obiettivo generale: il giocatore controlla un gruppo di raccoglitori, può spostarli su una mappa continua, raccogliere cibo vegetale, vedere le zone impoverirsi e rigenerarsi, e gestire le scorte che vengono consumate nel tempo. Il loop base è: esplorare, raccogliere, tornare al campo, sopravvivere.

### IMPLEMENTATO

#### Batch 1 – Setup Phaser funzionante

- Installazione di Phaser 3 via CDN.

- Struttura base di index.html, main.js, style.css.

- Canvas visualizzato correttamente nel browser.

- Nessuna meccanica di gioco, solo infrastruttura tecnica.

#### Batch 2 – Griglia spaziale e mappa con zone di cibo

- Implementazione della griglia spaziale nascosta (world.js).

- Layer forageDensity con distribuzione non uniforme:
  
  - Zone ad alta densità (macchie di bacche) rappresentate visivamente con colori più intensi.
  
  - Zone a bassa densità con colori tenui.
  
  - Zone a densità zero senza colore.

- Visualizzazione di debug: ogni cella della griglia è colorata in base alla densità, così il giocatore può vedere dove il cibo è più abbondante.

- Meccanica: il mondo contiene risorse diffuse; il giocatore distingue a colpo d'occhio le aree più ricche e decide dove mandare i raccoglitori.

- La densità di cibo è visualizzata con una scala a 7 colori, con intervalli precisi e non sovrapposti:
  
  - 0.90-1.00: verde scuro
  
  - 0.75-0.89: verde medio
  
  - 0.50-0.74: verde chiaro
  
  - 0.25-0.49: giallo
  
  - 0.05-0.24: arancione
  
  - 0.01-0.04: rosso
  
  - 0.00: nessun colore (sfondo)

#### Batch 3 – Pop e movimento

- Definizione della classe base per entità mobili e della classe Pop (units.js).

- Un pop (gruppo di raccoglitori) appare sulla mappa.

- Click su un punto qualsiasi della mappa: il pop si muove in modo continuo, senza scatti, verso quella posizione.

- Meccanica: interazione diretta con il mondo. Non esistono griglie visibili che vincolano il movimento. Il giocatore sposta fisicamente la sua gente.

#### Batch 4 – Raccolta cibo e riduzione della densità

- Quando il pop arriva su una cella con forageDensity maggiore di zero, inizia automaticamente a raccogliere cibo.

- La quantità di cibo raccolta per secondo è proporzionale alla densità locale: zone ricche rendono di più, zone povere di meno.

- La funzione modifyDensity riduce la densità della cella e di quelle vicine (raggio configurabile), simulando un prelievo localizzato.

- Se la densità arriva a zero, quella zona è temporaneamente esaurita e non produce più cibo.

- Meccanica: il giocatore vede le zone impoverirsi dopo la raccolta. Deve decidere se insistere su una zona ricca rischiando di esaurirla, o spostarsi altrove.

Nota: la logica di riduzione della densità è stata successivamente modificata. La raccolta ora riduce solo la cella esatta (reduceCellDensity), non le celle vicine. La modifica è avvenuta durante l'implementazione del punto 4 (Previsioni e avvisi) per evitare di consumare risorse non effettivamente raccolte.

#### Batch 5 – Rientro al campo, scorta e consumo

- Definizione di un punto base (accampamento) sulla mappa.

- Il giocatore può selezionare il numero di abitanti (in base a quelli disponibili nell'accampamento) da mandare a raccogliere una specifica risorsa.

- Un contatore globale mostra le scorte di cibo della tribù.

- Introduzione del consumo: ogni giorno di gioco, una quantità di cibo viene consumata dalle scorte in base alla popolazione totale (campo + spedizioni).

- Quando l'inventario è pieno o le provviste sono insufficienti per il ritorno, la spedizione torna automaticamente al campo, deposita il cibo nelle scorte globali, e i lavoratori rientrano nel Pop.

- Dopo un breve cooldown, la spedizione riparte automaticamente verso la stessa area, se ci sono ancora lavoratori disponibili.

- Se le scorte arrivano a zero, per ora viene mostrato un avviso; in futuro comporterà la morte dei pop.

- Meccanica: il giocatore deve bilanciare la raccolta con il consumo costante. Non basta accumulare, bisogna mantenere un flusso positivo. Il ritorno al campo diventa una decisione strategica: tornare troppo presto spreca tempo di viaggio, tornare troppo tardi rischia di far esaurire le scorte.

#### Batch 6 – Controlli del tempo (pausa, play, velocità)

##### 6.1 – Time Manager (pausa/play/velocità)

- Implementare time.js con velocità multiple (0x, 0.5x, 1x, 2x, 4x, 8x).

- Modificare update in main.js per usare il gameDelta dal TimeManager.

- Tasti rapidi: spazio per pausa, 0/1/2/3/4 per velocità, + e - per aumentare/diminuire.

##### 6.4 – Selezione e ispezione avanzata delle spedizioni

- Completare l'info panel con il percorso tratteggiato.

- Aggiungere la visualizzazione dell'area di raccolta per le spedizioni automatiche.

##### 6.5 – Cancellazione spedizioni

- Tasto C per cancellare la spedizione selezionata.

- La spedizione torna al campo, deposita il cibo, restituisce i lavoratori al pop.

##### 6.2 – Pannello di debug via console

- Rendere accessibili e modificabili da console le variabili chiave (tasso consumo, velocità raccolta, soglia abbandono, cooldown, raggio).

##### 6.3 – Pannello di debug UI (insieme a 6.2)

- Creare un pannello UI sovrapposto al canvas con input per le variabili.

- Collegarlo alle variabili di gioco.

##### 6.6 – Ribilanciamento e parametri esposti

- Ricalcolare le provviste per spedizione e legare tra di loro variabili sulla base di durata effettiva del giorno e velocità di spostamento.

- Esporre tutti i parametri di gioco nel pannello di debug.

- Testare diverse combinazioni per trovare un bilanciamento iniziale.

##### 6.7 – Revisione sistema raccolta risorse

###### 1. Fix bug spedizioni

- Bug 1 – Blocco in returningToCamp: escludere il controllo delle provviste quando lo stato è già returningToCamp. La spedizione deve andare dritta al campo. Risolto.

- Bug 2 – Spedizione torna nell'area invece del campo: la ripartenza delle spedizioni con area assegnata deve usare findBestCellInArea, non areaCenter. Inoltre, le funzioni di ricerca celle devono escludere sempre la cella del campo. Risolto.

- Bug 3 – Ritorno prima di riempire l'inventario: per le spedizioni di gathering, semplificare il consumo. Niente provviste separate per ora: la spedizione parte, raccoglie, torna quando piena o quando il giocatore ordina il rientro. Parzialmente risolto.

Bug ancora aperto: spedizione non va in una cella all'interno dell'area assegnata, ma nella migliore in generale. Attenzione perché in futuro tutte le celle avranno un certo livello di fertilità, e se le spedizioni vanno semplicemente nella migliore non all'interno della zona assegnata, questo è un problema perché consumano magari fertilità dove il giocatore voleva farla riprendere.

###### 2. Raccolta locale e gestione cittadini

- Aggiungere localGatherers al campo (popolazione non assegnata usata per raccolta locale).

- Assegnazione manuale per cella entro il raggio locale: ogni cella ha assignedWorkers.

- Il giocatore clicca su una cella nel raggio e assegna/rimuove lavoratori con tasti o pannello.

- I lavoratori locali non sono entità mobili: producono cibo direttamente al campo.

- Quando un lavoratore viene assegnato a lavorare come gatherer una cella, esso diventa membro del pop dei gatherers anche se non fa parte di una spedizione gatherers.

###### 3. Raggio locale

- Il raggio locale è definito come una giornata di viaggio dai confini del campo.

- Formula: localGatherRadiusKm = walkingSpeedKmh * 24.

- Convertire in pixel con pixelsPerKm.

- Visualizzare il raggio quando il campo è selezionato.

###### 4. Previsioni e avvisi

- Soglia unica di avviso: cellWarningThreshold = 0.25.

- Quando una cella con lavoratori scende sotto la soglia, mostrare un avviso unico.

- Nella schermata città, riepilogo giornaliero:
  
  - Cibo raccolto oggi (gatheredDaily: valore del giorno precedente).
  
  - Cibo consumato oggi (consumedDaily: valore del giorno precedente).
  
  - Cibo rimanente sfruttabile nell'area locale (fino a soglia 0.25) e teorico (fino a 0).
  
  - Lavoratori per pop (al momento avremo solo gatherers), poi suddivisi in gatherers locali e gatherers in spedizioni.

- Queste informazioni saranno offuscate in futuro.

- Per ogni cella mostrare sopra il numero di cittadini che la stanno lavorando (anche in gamestate).

- Per ogni cella, quando selezionata mostrare:
  
  - Cibo raccolto ad oggi (gatheredDaily).
  
  - Cibo rimanente sfruttabile.
  
  - Giorni al raggiungimento soglia 0.25 con attuale ritmo.
  
  - Giorni al raggiungimento soglia 0 con attuale ritmo.
  
  - Aumento di cibo raccolto al giorno se aggiungo qualcuno a lavorarci.
  
  - Giorni in meno che ci vorranno per raggiungere la soglia 0.25 e 0 se aggiungo un lavoratore (rinominati "Days reduced to X if +1 worker").

### DA IMPLEMENTARE

- [ ]  **Campo proporzionale a popolazione e scala**

- La dimensione del campo (raggio visivo) dipende da popolazione totale e da cellSizeInKm.

- Formula da definire, ma basata su radice quadrata della popolazione.

#### 

- [ ]  **Rimozione spedizioni automatiche**

- Il tasto destro sul campo non crea più spedizioni automatiche.

- Restano solo spedizioni manuali verso aree fuori dal raggio locale.

#### 

- [ ]  **Rivedere le formule di scelta celle per distanze in km**

- Le logiche di scelta cella (per spedizioni e per futuri comportamenti) devono usare km reali, non pixel.

- Introdurre getDistanceKm(pixelDist) basata su pixelsPerKm.

- Il punteggio cella deve considerare densità, distanza in km e costo del viaggio.

 

- [ ] **Batch 7 – Rigenerazione base del cibo**

- Le celle con forageDensity si rigenerano lentamente nel tempo (es. una piccola frazione al giorno).

- Una zona completamente esaurita (densità zero) impiega più tempo a iniziare a rigenerare.

- Meccanica: il giocatore non può esaurire una zona per sempre, ma deve ruotare le aree di raccolta per non restare senza cibo. Questo introduce una prima forma di gestione sostenibile delle risorse.

- Nota: la rigenerazione qui implementata sarà una versione semplificata e temporanea. In futuro sarà legata alla tipologia di terreno e seguirà una curva di crescita più realistica (rigenerazione più rapida a densità più alte). I valori attuali andranno poi bilanciati tramite il pannello di debug (Batch 6).

### Dopo il Batch 7

Al termine di MVP1 avremo un loop di sopravvivenza funzionante:

- Il giocatore sposta i raccoglitori sulla mappa.

- Raccoglie cibo in zone a densità variabile.

- Le zone si impoveriscono e si rigenerano.

- Le scorte vengono consumate nel tempo.

- Il tempo può essere controllato con pausa, play e velocità.

### NOTE FINE MVP1

Da riorganizzare e rip rioritizzare in base a quello che ha senso e non è troppo complicato:

1. Tool per disegnare la mappa (apporre foreste, pesci, gathering food ecc. con dei pennelli) [è forse troppo presto].

2. Moltiplicatore provisions (dare + o – provisions alle spedizioni).

3. Consumo di cibo, provisions, velocità ed efficacia spedizione in base a chi la compone (uomini, donne ecc.).

4. Calcolo stanchezza e felicità per spedizioni (che non si annulli quando sono eliminate).

5. Alternanza notte giorno (le spedizioni si fermano di notte)?

6. Creazione di algoritmo per creazione foreste e cibo in base a tipologia terreno delle celle [anche questo forse da vedere più avanti].

7. Non abbiamo minimamente lavorato sulla tipologia del terreno (montagna, acqua, acqua profonda, collina, pianura) e le caratteristiche di esso (foresta, erba ecc.). Questo perché sulla base del tipo di terreno poi dipende il cibo (la pesca è solo nelle acque, le aree di pianura con erba vicino ai fiumi hanno più cibo ecc.). Da forse vedere subito dopo MVP1? Implementiamo già diversi layer di visualizzazione (terreno, cibo, risorse varie ecc.)?

8. Spedizioni multi-pop con dinamiche di coesione interna (es. conflitti o collaborazioni tra individui di etnie/religioni diverse nello stesso gruppo).

9. Campo base che si sposta fisicamente sulla mappa durante le migrazioni o il nomadismo, e conseguente aggiornamento del punto di ritorno per le spedizioni attive.

10. Rotazione automatica delle aree di raccolta da parte delle spedizioni, per evitare l'impoverimento permanente di una singola zona (comportamento di raccolta più conservativo e sostenibile).

11. Algoritmo di raccolta con priorità alle celle a media densità (es. 0.4-0.7) per massimizzare la rigenerazione complessiva dell'area.

12. Rigenerazione e "fertilità" celle sulla base anche del terreno.

13. Meccaniche di frizione/resistenza al cambio di pop della popolazione (o che si evolve nel tempo e inizialmente la basiamo solo sul sesso, tipo uomini giovani infelici se assegnati a gathering perché disonorevole). Da capire come fare distinzione popolazione per sesso ma soprattutto per età senza dover monitorare ogni singolo abitante.

14. Icone diverse per tipologia di pop con di fianco barre informative (tipo provviste o che).

15. Giocatore seleziona manualmente il numero di pop da mandare in spedizione (con anche tasti rapidi di scelta).

16. Aggiungere crescita demografica: più cibo c'è, più la popolazione cresce. Se cibo scarseggia, aumenta il tasso di morte. Se spedizione finisce scorte, iniziano a morire o a consumare cibo raccolto.

17. Da ragionare: in che contesto siamo, quale è la narrativa? Che anno di partenza e con che tecnologie? In quanti anni arrivare a creare una città, in modo che il gioco non risulti troppo lento e noioso all'inizio (ma senza nemmeno fare come civilization che dura questa età come una roba da 10 minuti). Vogliamo fare che in realtà è un gruppo di superstiti che riparte e recupera le tecnologie già apprese? In che anni? Vogliamo fare un gioco diverso per era (quindi tipo qui con meccaniche più stilizzate) tipo come fa spore? Vogliamo andare sul lungo termine come civilization 4 cavemen to cosmos e quindi comunque rendere intriganti le meccaniche di sopravvivenza della tribù (e praticamente fare solo un gioco su questo, magari come primo titolo di una serie).

18. Ragionare sull'acqua.

19. Basare lo sviluppo su: tecnologie cavemen 2 to cosmos con edifici e unità e meccaniche intorno e link di timeline del progresso (wiki e altri link se funzionano).

20. Aggiungere caricamento JSON da Excel per impostare i valori in config.

21. Creare script per simulazioni montecarlo. Da simulare in montecarlo il cambio cella e la quantità di provviste da prendere, ma magari non deve sempre essere perfetto ma dipendere dall'esperienza (dei singoli, della civiltà/città/comunità, del livello tecnologico?).