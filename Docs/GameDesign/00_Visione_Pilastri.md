# Visione e Pilastri

## Concept

**Titolo provvisorio:** Dinastia (o Eredità)

**Genere:** Strategico 4X in tempo reale con elementi gestionali e simulativi. Il giocatore controlla una dinastia, non uno Stato astratto.

## Pilastri del design

1. **Dinastia e interessi personali**
   
   Il giocatore incarna una famiglia con possedimenti propri (terreni, industrie, beni). Può essere a capo di una civiltà, all'opposizione o ridotto a un ruolo marginale. Altre famiglie competono per risorse e influenza. Se si perde il comando, il gioco continua dai propri interessi privati. Tu puoi possedere elementi di una civiltà, e così altre famiglie che potrebbero opporsi a decisioni che danneggiano i loro interessi (es. dichiarare guerra a un partner commerciale).

2. **Risorse limitate e logistica fisica**
   
   Le risorse naturali sono un *continuum* che si degrada o esaurisce: foreste scompaiono se tagliate troppo in fretta, animali si estinguono se cacciati intensamente, campi perdono fertilità se non lasciati riposare, miniere e pozzi hanno un hard cap. Le materie prime vanno trasportate fisicamente da chi le raccoglie. I beni raffinati vanno immagazzinati e possono deteriorarsi. Eserciti e spedizioni consumano provviste durante gli spostamenti. Le rotte commerciali consegnano merci dopo un tempo di viaggio reale.

3. **Tempo reale con controllo del ritmo**
   
   Il mondo scorre sempre. Il giocatore può mettere in pausa, accelerare o rallentare il tempo. Un giorno di gioco dura pochi secondi (regolabile).

4. **Informazione imperfetta e locale**
   
   Tre stati di conoscenza per ogni unità/risorsa: *Certa*, *Da report*, *Proiettata*. Anche dati come felicità, scorte o produzione sono mediati da chi li riporta, con arrotondamenti o errori. Senza un sistema di raccolta informazioni, certe cose non saranno note. Per sapere quanta legna hai realmente, serve qualcuno che la conti e te lo riferisca.

5. **Popolazione simulata (pop system)**
   
   La popolazione è suddivisa in gruppi (pop) con attributi: occupazione, età, cultura, religione, status. Le unità militari sono pop arruolati: se combattono, non producono. Etnia e interessi creano sottogruppi che possono essere sleali (es. eserciti di cultura affine al nemico potrebbero tradire).

6. **Mappa continua senza griglia**
   
   Spazio continuo, niente esagoni o province predefinite. Il territorio è definito dall'uso effettivo: una foresta che usi è "tua" finché nessuno te la contesta. Con il progresso diplomatico si possono tracciare confini. Le strade accelerano il movimento. La suddivisione interna in province è manuale (decidi tu come organizzare l'impero).

7. **Tecnologia organica e indirizzabile**
   
   I progressi emergono dall'attività ripetuta (caccia → armi, raccolta → agricoltura, estrazione → metallurgia). Con lo sviluppo di centri di ricerca (laboratori, università) si può indirizzare lo sviluppo tecnologico e culturale, ma l'innovazione spontanea continua. Due rami principali: tecnologico e culturale/sociale. La tecnologia si diffonde geograficamente per contatto, non istantaneamente ovunque.

8. **Potere variabile e governo customizzabile**
   
   A seconda della forma di governo, il giocatore dà ordini diretti (tribù) o incentivi indiretti (democrazia). Le forme di governo possono essere customizzate. Non sei sempre al comando: talvolta detieni il potere, altre volte devi sopravvivere come emarginato o agire dietro le quinte.

9. **Mondo vivo e simulato**
   
   Variazioni climatiche e stagioni. Migrazioni spinte da benessere e influenza culturale. Malattie ed epidemie. Eventi critici (carestie, rivolte, guerre civili) generati dal sistema quando certe condizioni si accumulano.

10. **Amministrazione interna e deleghe**
    
    La diplomazia traccia confini esterni, ma il giocatore può suddividere il proprio territorio in regioni/province per migliorare la governabilità. Può affidarle a sottoposti (governatori, vassalli) che riportano dati e gestiscono per suo conto. Questi delegati hanno lealtà e competenza variabili, influenzando la qualità dei report e l'efficienza amministrativa.

11. **Storia emergente e simulazione delle crisi**
    
    Non esistono alberi di missioni o percorsi storici prestabiliti. La storia emerge dall'interazione di variabili profonde (economia, demografia, fedeltà, religione, clima). Eventi critici sono generati dal sistema quando squilibri si accumulano. Ogni partita è un racconto unico e storicamente plausibile.

## Meccaniche chiave (sommario)

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

## Stile visivo e interfaccia

- Prototipo: 2D dall'alto (Phaser 3).

- Versione finale: 3D in stile Crusader Kings 3.

- UI minimale ma informativa: mappa, pannelli pop, risorse, tempo.