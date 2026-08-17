# Migrazione backend da Render a Google Cloud Run

Vedi il runbook completo in `MIGRATION.md` del repo `tidix-backend` (branch
`claude/migrate-cloud-run`) per tutti i passaggi lato backend/GCP.

Questo branch (`claude/migrate-cloud-run`) prepara solo il lato frontend: i punti
in cui è hardcoded l'URL di Render sono già stati sostituiti con un placeholder
chiaramente riconoscibile, così un deploy accidentale con questo branch fallirebbe
in modo evidente invece di puntare silenziosamente al vecchio backend Render.

## Cosa fare il giorno della migrazione (dopo aver completato il runbook del backend)

1. Prendi l'URL del servizio Cloud Run (ottenuto al passaggio 7 del runbook backend),
   una cosa tipo `https://tidix-backend-xxxxxxxxxx-ew.a.run.app`.
2. Sostituisci **tutte** le occorrenze di
   `https://TODO-REPLACE-WITH-CLOUD-RUN-URL.a.run.app` con l'URL vero, nei file:
   - `package.json` (script `deploy:web`)
   - `eas.json` (profili `development` e `preview`)
3. Verifica con `npm run typecheck`.
4. Mergia questo branch in `main` (segui il flusso git standard usato finora:
   stash/rebase su `origin/main` se necessario, commit, push, PR, squash merge).
5. Rifai il deploy web (`npm run deploy:web` + push sul branch `gh-pages`, come al
   solito) così la PWA punta al nuovo backend.
6. Rigenera l'APK (`eas build --platform android --profile preview`) così anche
   l'app nativa punta al nuovo backend: gli APK già installati continuano a puntare
   a Render finché non vengono reinstallati con la nuova build.
7. Testa l'app (web + APK) per qualche giorno prima di disattivare il servizio su
   Render, per avere un piano di rollback pronto in caso di problemi.
