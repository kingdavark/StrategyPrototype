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

**MVP1 – Lo spostamento e la raccolta**

**Obiettivo:** far muovere un gruppo su una mappa continua, fargli
raccogliere una risorsa, tornare, vedere la risorsa accumularsi.

- Mappa 2D generata staticamente (foresta, campo base).

- Un "pop" di 10 raccoglitori.

- Click sulla foresta → il gruppo si muove (velocità costante, linea
  retta o A\* semplice).

- Arrivato, dopo X secondi raccoglie legna.

- Click sul campo base → torna e scarica.

- Contatore legna che sale.

- Pausa/play funzionante.

- Nessun consumo cibo, nessuna riproduzione, nessun errore di posizione.

**MVP1.5 – UI e feedback visivo**

- Barra del tempo (velocità 1x, 2x, pausa).

- Indicatore di posizione:

  - Certa (colore pieno) se nel raggio visivo.

  - Proiettata (desaturata con interpolazione) se fuori dal raggio.

  - Da report (lampeggiante o con indicatore "R") quando arriva un
    messaggio.

- Tooltip base per risorse e pop.

**MVP2 – Consumo e sopravvivenza**

- Il pop consuma cibo ogni giorno.

- Si può assegnare un gruppo a cacciare (raccoglie cibo).

- Se il cibo finisce, il pop muore.

- La foresta ha una "salute" che cala se tagliata troppo intensamente.

- Il giocatore deve bilanciare cacciatori e taglialegna.

**MVP3 – Lavorazione e magazzino**

- La legna grezza va portata all'accampamento e può essere trasformata
  in assi (azione "lavora legna").

- Le assi servono per costruire un magazzino (amplia lo stoccaggio).

- Il cibo in eccesso può deteriorarsi se non immagazzinato
  correttamente.

- Introduzione di una prima forma di tecnologia organica: dopo X cicli
  di taglio, sblocco "ascia migliore" (bonus raccolta).

**MVP4 – Informazione imperfetta e report**

- Il campo base ha una "riserva di cibo" che non conosci esattamente:
  vedi una stima arrotondata.

- Per sapere quanta legna hai realmente, devi inviare qualcuno a
  controllare o aspettare il report di chi torna.

- Raggio visivo del giocatore: dove sei, vedi; il resto è buio o
  sfocato.

- I report possono essere ritardati o imprecisi in base alla distanza.

**MVP5 – Seconda tribù e territorio**

- Una seconda tribù vicina condivide la stessa foresta.

- Se entrambe tagliano, la foresta si esaurisce prima.

- Possibile scontro se i gruppi si incrociano (combattimento basilare).

- Inizio del concetto di "territorio d'uso": la foresta è di chi la sta
  usando.

**Oltre MVP5**

Le iterazioni successive del prototipo seguiranno la progressione
storica (Era 1: stanzialità, agricoltura, prime strutture; Era 2:
metalli, scrittura, amministrazione; ecc.), sbloccando funzionalità
corrispondenti man mano che le fondamenta tecniche lo permettono. La
priorità sarà sempre validare il loop di base prima di aggiungere
complessità.
