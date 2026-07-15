# Visione e Pilastri

## Concept

**Titolo provvisorio:** *Dinastia* (o *Eredità*)

**Genere**\
Strategico 4X in tempo reale con elementi gestionali e simulativi. Il
giocatore controlla una dinastia, non uno Stato astratto.

**Pilastri del design**

**1. Dinastia e interessi personali**\
Il giocatore incarna una famiglia con possedimenti propri (terreni,
industrie, beni). Può essere a capo di una civiltà, all'opposizione o
ridotto a un ruolo marginale. Altre famiglie competono per risorse e
influenza. Se si perde il comando, il gioco continua dai propri
interessi privati. Tu puoi possedere elementi di una civiltà, e così
altre famiglie che potrebbero opporsi a decisioni che danneggiano i loro
interessi (es. dichiarare guerra a un partner commerciale).

**2. Risorse limitate e logistica fisica**\
Le risorse naturali sono un *continuum* che si degrada o esaurisce:
foreste scompaiono se tagliate troppo in fretta, animali si estinguono
se cacciati intensamente, campi perdono fertilità se non lasciati
riposare, miniere e pozzi hanno un hard cap. Le materie prime vanno
trasportate fisicamente da chi le raccoglie. I beni raffinati vanno
immagazzinati e possono deteriorarsi. Eserciti e spedizioni consumano
provviste durante gli spostamenti. Le rotte commerciali consegnano merci
dopo un tempo di viaggio reale.

**3. Tempo reale con controllo del ritmo**\
Il mondo scorre sempre. Il giocatore può mettere in pausa, accelerare o
rallentare il tempo. Un giorno di gioco dura pochi secondi (regolabile).

**4. Informazione imperfetta e locale**\
Tre stati di conoscenza per ogni unità/risorsa:

- *Certa*: nel raggio visivo del giocatore.

- *Da report*: valida all’ultimo messaggio ricevuto, può essere
  falsificata da nemici o traditori.

- *Proiettata*: posizione stimata in base a velocità e ultime
  informazioni note.

Anche dati come felicità, scorte o produzione sono mediati da chi li
riporta, con arrotondamenti o errori. Senza un sistema di raccolta
informazioni, certe cose non saranno note. Per sapere quanta legna hai
realmente, serve qualcuno che la conti e te lo riferisca.

**5. Popolazione simulata (pop system)**\
La popolazione è suddivisa in gruppi (pop) con attributi: occupazione,
età, cultura, religione, status. Le unità militari sono pop arruolati:
se combattono, non producono. Etnia e interessi creano sottogruppi che
possono essere sleali (es. eserciti di cultura affine al nemico
potrebbero tradire).

**6. Mappa continua senza griglia**\
Spazio continuo, niente esagoni o province predefinite. Il territorio è
definito dall'uso effettivo: una foresta che usi è "tua" finché nessuno
te la contesta. Con il progresso diplomatico si possono tracciare
confini. Le strade accelerano il movimento. La suddivisione interna in
province è manuale (decidi tu come organizzare l'impero).

**7. Tecnologia organica e indirizzabile**\
I progressi emergono dall'attività ripetuta (caccia → armi, raccolta →
agricoltura, estrazione → metallurgia). Con lo sviluppo di centri di
ricerca (laboratori, università) si può indirizzare lo sviluppo
tecnologico e culturale, ma l'innovazione spontanea continua. Due rami
principali: tecnologico e culturale/sociale. La tecnologia si diffonde
geograficamente per contatto, non istantaneamente ovunque.

**8. Potere variabile e governo customizzabile**\
A seconda della forma di governo, il giocatore dà ordini diretti (tribù)
o incentivi indiretti (democrazia). Le forme di governo possono essere
customizzate. Non sei sempre al comando: talvolta detieni il potere,
altre volte devi sopravvivere come emarginato o agire dietro le quinte.

**9. Mondo vivo e simulato**\
Variazioni climatiche e stagioni. Migrazioni spinte da benessere e
influenza culturale. Malattie ed epidemie. Eventi critici (carestie,
rivolte, guerre civili) generati dal sistema quando certe condizioni si
accumulano.

**10. Amministrazione interna e deleghe**\
La diplomazia traccia confini esterni, ma il giocatore può suddividere
il proprio territorio in regioni/province per migliorare la
governabilità. Può affidarle a sottoposti (governatori, vassalli) che
riportano dati e gestiscono per suo conto. Questi delegati hanno lealtà
e competenza variabili, influenzando la qualità dei report e
l'efficienza amministrativa.

**11. Storia emergente e simulazione delle crisi**\
Non esistono alberi di missioni o percorsi storici prestabiliti. La
storia emerge dall'interazione di variabili profonde (economia,
demografia, fedeltà, religione, clima). Eventi critici sono generati dal
sistema quando squilibri si accumulano. Ogni partita è un racconto unico
e storicamente plausibile.

**Meccaniche chiave (sommario)**

- Raccolta, trasporto, lavorazione e stoccaggio di risorse.

- Consumo di cibo e provviste per pop e unità.

- Sistema di pop con demografia, bisogni, fedeltà.

- Movimento e pathfinding su mappa continua.

- Sistema di visibilità e report (certo / da report / proiettato).

- Progresso tecnologico organico + indirizzabile.

- Diplomazia e definizione di confini.

- Dinamiche dinastiche e fazioni interne.

- Combattimento con eserciti composti da pop, rischio tradimento.

- Gestione delle crisi e storia emergente.

**Stile visivo e interfaccia**

- Prototipo: 2D dall'alto (Phaser 3).

- Versione finale: 3D in stile Crusader Kings 3.

- UI minimale ma informativa: mappa, pannelli pop, risorse, tempo.

## Roadmap

**Nota:** la roadmap segue la progressione storica. Ogni era sblocca
nuove possibilità di gameplay. Lo sviluppo del codice può seguire lo
stesso ordine, implementando prima le basi che rendono possibile l'era
successiva.

**Era 0 – Nomadismo (MVP iniziale)**\
*Tecnologie assenti. Comandi diretti del capo tribù.*

- Raccolta e caccia.

- Movimento su mappa continua.

- Consumo cibo e morte per fame.

- Nessuna proprietà privata, nessuna lavorazione.

- Pop generici, poche decine di individui.

- Informazione imperfetta base (visuale diretta vs. proiezione).

**Era 1 – Stanzialità e agricoltura primitiva**\
*Scoperta dell'agricoltura (da raccolta ripetuta) e della
domesticazione.*

- Primi campi coltivabili, fertilità dinamica.

- Villaggio permanente con edifici base (magazzino, falegnameria).

- Lavorazione legno (assi) e conservazione cibo.

- Inizio degrado risorse se sovrasfruttate.

- La popolazione può specializzarsi: contadini, artigiani.

- Prime strade semplici per accelerare trasporto.

- Tecnologia organica: "ascia migliorata", "irrigazione base".

**Era 2 – Età dei metalli e della scrittura**\
*Scoperta della metallurgia e della scrittura (da necessità
amministrative).*

- Estrazione mineraria (hard cap per miniere).

- Lavorazione metalli → strumenti e armi.

- Scrittura: report più accurati, archiviazione dati, possibilità di
  tracciare confini interni.

- Amministrazione interna: province, governatori con lealtà e
  competenza.

- Comparsa di altre famiglie con interessi economici.

- Il potere può essere perso: se deposto, il giocatore continua con i
  propri possedimenti.

**Era 3 – Commercio complesso e diplomazia**\
*Sviluppo della moneta e delle rotte commerciali a lungo raggio.*

- Rotte commerciali con merci che viaggiano fisicamente.

- Diplomazia per tracciare confini con altre civiltà.

- Eserciti composti da pop di diversa estrazione, possibile tradimento.

- Informazione imperfetta applicata a diplomazia (report degli
  ambasciatori).

- Diffusione tecnologica tra civiltà per contatto.

**Era 4 – Governo avanzato e religioni organizzate**\
*Sviluppo di forme di governo complesse e religioni strutturate.*

- Forme di governo customizzabili (monarchia, repubblica, teocrazia...).

- Ordini diventano incentivi se il governo lo richiede.

- Religioni organizzate: influenzano lealtà, cultura e migrazioni.

- Missionari e conversione.

- Università e centri di ricerca per indirizzare tecnologia/cultura.

- Gestione delle crisi: carestie, rivolte, eresie generate dal sistema.

**Era 5 – Globalizzazione e industrializzazione**\
*Scoperte scientifiche, stampa, macchine a vapore...*

- Variazioni climatiche e migrazioni di massa.

- Malattie ed epidemie (diffusione lungo rotte commerciali).

- Tecnologia che accelera e si diffonde più rapidamente.

- Catene produttive complesse, fabbriche, proletariato.

- Ideologie politiche che competono per il potere.

- Potenza di fuoco e logistica militare su larga scala.

**Era 6 – Contemporanea e futuro**\
*Dalla rivoluzione informatica in poi...*

- Reti di comunicazione istantanea (riduzione dell'incertezza
  informativa).

- Economia globale, mercati finanziari.

- Armi di distruzione di massa, diplomazia multilaterale.

- Simulazione di crisi globali (climatiche, pandemiche, nucleari).

# Mappa e territorio

## Griglia spaziale nascosta e layer di densità

Il mondo non ha una griglia visibile, ma internamente utilizza una
griglia uniforme nascosta (**spatial hash**) per ottimizzare le query
spaziali e per memorizzare i dati di densità delle risorse diffuse.

- **Celle della griglia:** quadrate, di dimensione fissa (es. 100×100
  pixel). Ogni cella ha coordinate intere (cx, cy).

- **Scopi della griglia:**

  1.  **Query spaziali rapide:** trovare entità (unità, branchi) vicine
      a una posizione senza scorrere tutti gli oggetti.

  2.  **Memorizzare densità di risorse naturali:** foreste, vegetazione,
      piccola fauna, pesci, fertilità. Questi valori sono continui
      (float 0..1) e vengono modificati localmente durante lo
      sfruttamento.

- **Natura fluida:** la griglia non impone vincoli al movimento o alla
  forma del territorio. I confini delle aree di risorsa emergono
  naturalmente dai valori di densità.

- **Layer di densità previsti (MVP):**

  - *forestDensity* – densità di alberi (0 = nessun albero, 1 = foresta
    fitta)

  - *forageDensity* – vegetazione raccoglibile (bacche, erbe, radici)

  - *smallGameDensity* – piccola fauna terrestre (conigli, uccelli)

  - *fishDensity* – pesci (presente solo nelle celle che intersecano
    corpi idrici)

  - *fertility* – fertilità del suolo per l’agricoltura (futuro)

## Biomi e risorse naturali

*(da sviluppare)*

## Strade e infrastrutture

*(da sviluppare)*

## Confini e province

*(da sviluppare)*

# Risorse ed economia

## Tipi di risorse naturali (prototipo)

**Foreste (legna)**

- **Layer:** forestDensity

- **Sfruttamento:** un’unità che taglia legna riduce la densità nella
  cella e nelle celle adiacenti (raggio di impatto configurabile).

- **Effetto locale:** una foresta può essere disboscata solo in parte
  senza distruggere l’intera area.

- **Rigenerazione:** lenta e costante (in futuro influenzata da clima e
  stagioni).

- **Risorsa prodotta:** legna grezza, trasportata fisicamente
  all’accampamento.

**Vegetazione raccoglibile (bacche, erbe, radici)**

- **Layer:** forageDensity

- **Sfruttamento:** raccolta manuale, riduce la densità locale.

- **Rigenerazione:** stagionale o continua lenta.

- **Risorsa prodotta:** cibo vegetale.

- **Sviluppo futuro:** propedeutico all’agricoltura.

**Fauna minore terrestre (conigli, uccelli, piccola selvaggina)**

- **Layer:** smallGameDensity

- **Sfruttamento:** caccia/cattura con strumenti rudimentali, riduce la
  densità locale.

- **Rigenerazione:** continua, più rapida in aree con vegetazione fitta.

- **Risorsa prodotta:** cibo (carne) e eventuali pelli.

- **Sviluppo futuro:** porta a trappole, armi da caccia, domesticazione.

**Pesci (fiumi, laghi, coste)**

- **Layer:** fishDensity

- **Distribuzione:** presente solo nelle celle che intersecano corpi
  idrici; zero altrove.

- **Sfruttamento:** pesca, riduce la densità locale.

- **Rigenerazione:** continua, influenzata dalla dimensione del corpo
  idrico e dalle stagioni.

- **Risorsa prodotta:** cibo (pesce).

- **Sviluppo futuro:** tecniche di pesca, navigazione, commercio
  marittimo.

**Fauna: grandi animali (branchi mobili)**

- **Modello:** unità autonome (branchi) con posizione (x, y), specie e
  numero di capi.

- **Comportamento:** i branchi si muovono lentamente nell’habitat
  preferito, si riproducono se non disturbati.

- **Caccia:** i cacciatori devono avvicinarsi al branco; ogni ciclo
  riduce i capi e produce cibo (carne e pelli). Sotto una soglia il
  branco si estingue.

- **Visualizzazione:** sprite che si sposta sulla mappa.

**Fertilità del suolo**

- **Layer:** fertility (float 0..1)

- **Utilizzo futuro:** consumata dall’agricoltura, rigenerata dal
  maggese.

- **Per il prototipo attuale:** layer definito ma non ancora utilizzato.

## Lavorazione, stoccaggio e deperimento (futuro MVP3)

- Le risorse grezze (legna, cibo) possono essere lavorate (legna → assi,
  cibo → conserve) per aumentarne il valore o la conservabilità.

- Il cibo non conservato deperisce nel tempo (velocità di deterioramento
  configurabile).

- I magazzini aumentano la capacità di stoccaggio e riducono il
  deterioramento.

# Popolazione e demografia

- Sistema a pop (gruppi di individui con attributi condivisi)

- Attributi: età, occupazione, cultura, religione, status sociale, etnia

- Consumo di cibo, tasso di natalità e mortalità

- Fedeltà e appartenenza a fazioni

# Tecnologia e cultura

- **Progressione organica:** i progressi si sbloccano automaticamente
  quando una determinata attività viene svolta per un certo numero di
  cicli (es. dopo X sessioni di caccia, appare "arco rudimentale").

- **Ricerca indirizzata:** tramite laboratori, università e centri
  culturali si può investire per accelerare specifici filoni
  (tecnologico, culturale, sociale).

- **Diffusione geografica:** le tecnologie si propagano per contatto tra
  civiltà vicine, non appaiono istantaneamente ovunque.

- **Rami:** almeno due principali, *tecnologico* (strumenti, armi,
  costruzioni) e *culturale/sociale* (leggi, religione, forme
  organizzative).

# Governo e amministrazione

- **Forme di governo:** dalla tribù nomade alle democrazie moderne, con
  livelli di controllo variabile (ordini diretti vs. incentivi
  indiretti).

- **Personalizzazione:** le forme di governo possono essere modificate
  nel tempo, con leggi e politiche interne.

- **Deleghe e vassalli:** possibilità di affidare province a governatori
  con lealtà e competenza proprie.

- **Perdita del potere:** se il capo della dinastia viene rimosso, il
  giocatore continua a gestire i propri interessi privati come famiglia.

# Diplomazia e guerra

- **Confini:** la diplomazia permette di tracciare confini riconosciuti
  con altre civiltà; all'interno, i confini amministrativi sono definiti
  dal giocatore.

- **Eserciti:** composti da pop arruolati. La composizione etnica e
  culturale influisce sulla fedeltà e sul rischio di tradimento.

- **Logistica militare:** rifornimenti devono viaggiare fisicamente
  dalle retrovie al fronte.

- **Report e spionaggio:** le informazioni sulle forze nemiche sono
  limitate e soggette a errori (certo / da report / proiettato).

# Informazione e UI

- **Visibilità:** tre stati (certa, da report, proiettata) per ogni
  entità sulla mappa.

- **Gestione dei report:** ritardi e imprecisioni dipendono dalla
  distanza e dall'affidabilità della fonte.

- **Interfaccia utente:** mappa, pannelli per pop e risorse, notifiche
  per eventi critici.

- **Filigrana informativa:** anche le statistiche interne (scorte,
  felicità) sono filtrate da chi le riporta.

# Mondo simulato

- **Clima e stagioni:** influenzano la produttività agricola, la
  rigenerazione delle risorse e la migrazione animale.

- **Migrazioni:** pop si spostano in base a fattori economici, culturali
  e di sicurezza.

- **Malattie:** si diffondono lungo le rotte commerciali e in condizioni
  igieniche precarie.

- **Eventi emergenti:** carestie, rivoluzioni, guerre civili emergono
  quando variabili come scarsità di cibo, oppressione fiscale e tensioni
  etniche superano soglie critiche.

- **Cicli storici**: eventi e modificatori spingono per replicare i
  reali cicli storici

# Piano di sviluppo tecnico

- **Stack:** Phaser 3 per il prototipo 2D; in futuro migrazione a motore
  3D (es. Three.js o Unity) per la versione finale in stile Crusader
  Kings 3.

- **Architettura:** descritta nel documento TECHNICAL.md.

- **Performance:** monitorare il numero di entità e la dimensione della
  griglia spaziale per garantire fluidità con migliaia di pop e branchi.

- **Scalabilità:** la struttura a layer di densità e lo spatial hashing
  sono pensati per supportare mappe molto ampie e simulazioni complesse.
