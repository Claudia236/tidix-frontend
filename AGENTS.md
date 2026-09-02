# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# GitHub Pages deploy

Il sito su `https://claudia236.github.io/tidix-frontend/` è una build statica (`npm run deploy:web`) pubblicata sul branch `gh-pages`, separata da `main`: non si aggiorna da sola. Dopo OGNI modifica frontend che viene mergiata in `main`, rifai anche il deploy web (vedi sezione README "Pubblicare la versione web (PWA) su GitHub Pages") così il sito resta allineato.

# Swipe nelle liste

Quando aggiungi un gesto di swipe (elimina, segna come fatto/acquistato, ecc.) su una riga di una lista, l'azione NON deve scattare subito al termine dello swipe: mostra sempre un popup di conferma (`showAlert`) prima di eseguirla. Vale per ogni nuovo swipe, anche quelli non distruttivi (es. "vai al dettaglio", "segna pulito"). Riusa il componente condiviso `src/components/SwipeableRow.tsx`.
