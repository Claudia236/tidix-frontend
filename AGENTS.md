# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GitHub Pages deploy

Il sito su `https://claudia236.github.io/tidix-frontend/` è una build statica (`npm run deploy:web`) pubblicata sul branch `gh-pages`, separata da `main`: non si aggiorna da sola. Dopo OGNI modifica frontend che viene mergiata in `main`, rifai anche il deploy web (vedi sezione README "Pubblicare la versione web (PWA) su GitHub Pages") così il sito resta allineato.

# Swipe nelle liste

Quando aggiungi un gesto di swipe su una riga di una lista, riusa il componente condiviso `src/components/SwipeableRow.tsx`. Regola sulla conferma:
- Se l'azione modifica subito dei dati (elimina, segna pulito/acquistato, ecc.), mostra sempre un popup di conferma (`showAlert`) prima di eseguirla, anche se non distruttiva.
- Se l'azione si limita a navigare altrove (apre un'altra schermata o un form, es. "vai al dettaglio", "aggiungi a scorte") senza cambiare nulla subito, NON serve popup: si può sempre tornare indietro senza conseguenze. Vale anche per lo stesso pulsante/azione raggiungibile a tocco, non solo via swipe.
