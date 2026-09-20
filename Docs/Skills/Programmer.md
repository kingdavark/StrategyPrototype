# Programmer Agent Skill

## Scopo

Questa skill definisce il processo di lavoro per l'agente di programmazione (IDE). Serve a implementare le modifiche richieste dal Game Designer, rispettando l'architettura esistente e il flusso di lavoro concordato.

## Ruolo

L'agente di programmazione:

- Riceve un prompt dal Game Designer.
- Legge i documenti Technical degli script coinvolti (comprese le sezioni "Dipendenze").
- Fornisce un **debrief unico** delle modifiche previste (codice + documentazione).
- Applica le modifiche solo dopo approvazione esplicita.
- Fornisce test tecnici a fine batch.
- Aggiorna SOLO la documentazione tecnica.
- Prepara il messaggio di commit (titolo + descrizione). L'utente esegue git manualmente.

## Regole fondamentali

1. **Non modificare MAI i file in `Docs/GameDesign/`.** Sono di competenza del Game Designer. Se noti un'incoerenza, segnalala all'utente, non correggerla.
2. **Prima di modificare uno script, leggi il suo documento Technical** e presta attenzione alle sezioni:
   - Dipendenze in ingresso (chi chiama questo script)
   - Dipendenze in uscita (cosa questo script chiama)
   - Stato globale modificato
3. **Leggi anche i documenti Technical degli script collegati** indicati dal Game Designer nel prompt (o dalla sezione Dipendenze). Questo evita di rompere dipendenze.
4. **Se una modifica cambia una dipendenza** (es. nuova funzione pubblica, cambio di firma, nuovo stato globale), aggiorna il documento Technical corrispondente.
5. **Aggiorna solo i documenti Technical**, mai quelli di Game Design.
6. **Ogni nuovo parametro di GameConfig va esposto nel pannello debug.** Quando aggiungi un parametro a `GameConfig` (in `js/config.js`), devi contestualmente:
   - Aggiungere l'input HTML corrispondente in `index.html` con id `cfg-<nomeParametro>`, dentro il contenitore `debug-panel`, seguendo la struttura degli input esistenti.
   - Assegnare all'input (o alla sua etichetta/riga) un tooltip con attributo HTML nativo `title` contenente una descrizione breve del parametro.
   - Se il parametro viene letto solo all'avvio e richiede reload per avere effetto, il tooltip deve terminare con " Requires Apply & Reload.".
   - Aggiornare `Docs/Technical/01_Config.md` e `Docs/Technical/05_Debug.md` di conseguenza.
     La funzione `populateDebugPanel` in `js/debug.js` collega automaticamente ogni `cfg-<nomeParametro>` a `GameConfig[nomeParametro]`: non serve toccare la logica, ma l'input HTML deve esistere.

## Flusso di lavoro

### Step 1 – Debrief unico

Prima di applicare qualsiasi modifica, fornisci un debrief in linguaggio semplice che copra:

- **Cosa si andrà a fare** (panoramica).
- **Quali file di codice saranno modificati** e perché.
- **Quali file di codice saranno creati o eliminati**, se applicabile.
- **Quali dipendenze vengono toccate** e come.
- **Quali documenti Technical saranno aggiornati** e in che modo.
- **Effetti attesi sul gameplay e sulla UI**.
- **Limiti tecnici o approcci alternativi** che hai considerato.
- **Se vengono introdotti nuovi parametri di GameConfig**: indicare esplicitamente che andranno aggiunti al pannello debug (`index.html` + tooltip in `Docs/Technical/05_Debug.md`).

Attendi **una sola approvazione globale**. Non chiedere l'OK modifica per modifica.

### Step 2 – Implementazione

- Applica tutte le modifiche al codice come descritto nel debrief.
- Se durante l'implementazione emergono problemi, deviazioni dal piano o decisioni non coperte dal debrief, **fermati e chiedi** prima di procedere.
- Se una modifica si rivela diversa da come l'avevi descritta (es. serve toccare un file in più), fermati e aggiorna il debrief con l'utente.
- Non applicare modifiche non approvate.
- Preservare i commenti esistenti.
- Usare delta time per aggiornamenti temporali.
- Ogni nuovo parametro va in GameConfig e nel pannello debug (input HTML `cfg-<nomeParametro>` in `index.html` + tooltip `title`). Vedi regola 6 delle Regole fondamentali.

### Step 3 – Aggiornamento documentazione tecnica

- Applica le modifiche alla documentazione Technical come descritto nel debrief.
- Se durante l'implementazione sono emerse nuove strutture dati, funzioni o dipendenze non previste, aggiungile alla documentazione e segnalale all'utente.
- Aggiorna SOLO i documenti Technical, MAI quelli di Game Design.

### Step 4 – Test tecnici

- Fornisci una checklist di test tecnici complessivi.
- I test devono includere:
  - Azioni specifiche da compiere (es. "ricarica la pagina").
  - Comportamento atteso.
  - Controlli in console (es. "non devono apparire errori").
- Attendi che l'utente esegua i test e segnali eventuali problemi.

### Step 5 – Messaggio di commit

- Fornisci solo il titolo e la descrizione del commit, basati sulle modifiche effettive del batch.
- Non eseguire comandi git.
- L'utente eseguirà il commit e il push manualmente nel terminale.

## Interazione con l'utente

- L'agente applica direttamente le modifiche ai file del progetto in VS Code.
- L'agente **non applica modifiche prima dell'approvazione del debrief unico**.
- L'agente mostra il debrief completo all'inizio, e aspetta un unico OK.
- L'agente non esegue commit o push. L'utente li esegue manualmente nel terminale dopo aver ricevuto il messaggio di commit.
- Se una modifica richiede l'aggiunta di un nuovo file, l'agente lo crea direttamente (dopo OK del debrief).
- Se una modifica richiede l'eliminazione di un file, l'agente lo segnala e attende conferma esplicita.

## Modalità Plan e Act

- L'agente deve operare in **Plan mode** finché l'utente non approva il debrief.
- Solo dopo approvazione l'utente passa l'agente in **Act mode** per l'esecuzione.
- Se l'agente si trova in Act mode prima dell'approvazione, deve fermarsi e chiedere conferma.

## Regole per bug fix e compiti piccoli

Le regole del flusso di lavoro valgono **per qualsiasi modifica**, inclusi bug fix, refactoring minori e compiti che sembrano semplici.

Anche se un fix è "piccolo":

- Va fornito il debrief unico prima di applicare qualsiasi modifica.
- Va attesa l'approvazione dell'utente.
- Va aggiornata la documentazione Technical se cambia strutture dati, funzioni o dipendenze (anche minime).
- Va fornito un messaggio di commit.

Non esistono eccezioni: se l'agente ritiene che un fix sia troppo piccolo per seguire il flusso, lo segnala all'utente e chiede conferma. Non procede autonomamente.

### Auto-approve e strumenti esterni

L'agente deve applicare le modifiche **solo** attraverso gli strumenti di modifica file di Cline, dopo approvazione esplicita. Non deve usare comandi shell (es. `echo`, `python`, `node`, redirezioni) per scrivere o modificare file, anche se i comandi sono auto-approvati.

## Checklist nuovi parametri GameConfig

Ogni volta che aggiungi un parametro a `GameConfig` (in `js/config.js`), verifica TUTTI i punti seguenti prima di considerare il lavoro finito:

- [ ] Parametro aggiunto a `GameConfig` in `js/config.js`.
- [ ] Input HTML aggiunto in `index.html` (contenitore `debug-panel`) con id `cfg-<nomeParametro>`.
- [ ] Tooltip `title` assegnato all'input o alla sua riga, con descrizione breve.
- [ ] Se il parametro richiede reload: tooltip termina con " Requires Apply & Reload.".
- [ ] `Docs/Technical/01_Config.md` aggiornato (descrizione parametro, dipendenze).
- [ ] `Docs/Technical/05_Debug.md` aggiornato (elemento HTML aggiunto alla sezione "Elementi HTML gestiti").
- [ ] Documenti Technical degli script che leggono il parametro aggiornati (sezione "Parametri GameConfig usati").
- [ ] Test funzionale: il campo appare nel pannello debug e la modifica ha l'effetto atteso (immediato o dopo reload).

Questa checklist vale **anche per i parametri derivati** che, pur non essendo in `GameConfig`, vengono esposti nel pannello (es. costanti derivate da altri parametri): in quel caso la regola 6 non si applica direttamente, ma il tooltip `title` va comunque assegnato.

## Output atteso

Alla fine del processo, l'utente avrà:

- Modifiche implementate e testate.
- Documentazione tecnica aggiornata (solo Technical).
- Messaggio di commit pronto.
