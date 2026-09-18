# MVP4 – Informazione imperfetta e report

Nessuna modifica necessaria. Le meccaniche di visibilità (certo, proiettato, da report) e di stima delle scorte sono indipendenti dal tipo di risorsa. Quando le implementeremo, applicheremo l'incertezza a tutte le risorse (cibo vegetale, carne, pesce, legna, assi).

## Testo attuale confermato

- Il campo base ha una "riserva di cibo" che non conosci esattamente: vedi una stima arrotondata.

- Per sapere quanta legna hai realmente, devi inviare qualcuno a controllare o aspettare il report di chi torna.

- Raggio visivo del giocatore: dove hai uomini, vedi; il resto è buio o sfocato.

- I report possono essere ritardati o imprecisi in base alla distanza.

## UI prevista

- Barra del tempo (velocità 1x, 2x, pausa).

- Indicatore di posizione:
  
  - Certa (colore pieno) se nel raggio visivo.
  
  - Proiettata (desaturata con interpolazione) se fuori dal raggio.
  
  - Da report (lampeggiante o con indicatore "R") quando arriva un messaggio.

- Tooltip base per risorse e pop.