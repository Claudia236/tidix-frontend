# Logistica Domestica — App

App multi-piattaforma (Expo / React Native — Android, iOS e **web**) per gestire l'inventario di casa: frigo, freezer, dispensa e sgabuzzino, con scadenze e lista della spesa condivise tra i membri della famiglia.

## Stack

- [Expo](https://expo.dev) SDK 57 + Expo Router (TypeScript)
- React Query per lo stato server (fetch, cache, invalidazione)
- Axios per le chiamate API
- Token JWT salvato con `expo-secure-store` su iOS/Android e `localStorage` sul web

Il design (colori, zone, categorie, logica di scadenza) riprende il prototipo React web incluso in `reference/scorte-di-casa.web-prototype.jsx`.

## Requisiti

- Node.js 20+
- Il [backend](../logistica-domestica-backend) in esecuzione e raggiungibile dal dispositivo/browser
- Per lo sviluppo rapido: app **Expo Go** sul telefono (non serve Android Studio/Xcode)
- Per Android Studio: JDK 17+ e Android Studio con un SDK Android installato (vedi sotto)

## Configurazione

```bash
cp .env.example .env
```

Imposta `EXPO_PUBLIC_API_URL` con l'indirizzo del backend. Il backend è deployato su Render, quindi normalmente basta:

```
EXPO_PUBLIC_API_URL=https://logistica-domestica-backend.onrender.com
```

Se invece stai facendo girare il backend in locale (sviluppo):
- Simulatore iOS / browser sullo stesso PC: `http://localhost:8080`
- Emulatore Android: `http://10.0.2.2:8080`
- Telefono fisico in Expo Go o dispositivo Android reale: usa l'IP della macchina in rete locale, es. `http://192.168.1.10:8080` (deve essere sulla stessa Wi-Fi)

## Avvio rapido (Expo Go)

```bash
npm install
npm start
```

Scansiona il QR code con l'app Expo Go (Android) o con la fotocamera (iOS) per aprire l'app sul telefono.

## Avvio come sito web

```bash
npm install
npm run web
```

Apre l'app nel browser su `http://localhost:8081`. Per generare i file statici da pubblicare su un hosting qualsiasi:

```bash
npx expo export --platform web
```

I file pronti per il deploy vengono creati in `dist/`.

## Aprire ed eseguire in Android Studio

Il progetto nativo Android è già generato ed è incluso nel repository nella cartella `android/` (non serve eseguire `expo prebuild`).

1. Apri Android Studio → **Open** → seleziona la cartella `android/` di questo repo.
2. Lascia che Gradle sincronizzi il progetto (la prima volta scarica le dipendenze, può richiedere qualche minuto).
3. Avvia un emulatore (Device Manager) oppure collega un telefono Android con il debug USB attivo.
4. Premi **Run ▶** in Android Studio, oppure da terminale:

   ```bash
   npm run android
   ```

   (richiede comunque Android Studio/SDK installato; avvia Metro e builda/installa l'app sul device selezionato).

**Se modifichi `app.json`** (icona, nome pacchetto, plugin nativi), la cartella `android/` non si aggiorna da sola: rigenerala con

```bash
npx expo prebuild --platform android --clean
```

(questo sovrascrive `android/` con la configurazione aggiornata).

## Generare un file .apk da installare sul telefono

Non serve necessariamente Android Studio per ottenere un `.apk`: il modo più semplice è **EAS Build**, il servizio cloud gratuito di Expo (`eas.json` in questo repo è già configurato con un profilo `preview` che produce un `.apk` invece dell'`.aab` per lo store).

⚠️ **Importante**: a differenza di `npm start`/`npm run web`, la build EAS gira sui server di Expo e non vede il tuo file `.env` locale (è escluso da git di proposito). L'indirizzo del backend va quindi impostato direttamente in `eas.json`, nel campo `build.preview.env.EXPO_PUBLIC_API_URL` — è già impostato sull'URL pubblico del backend (`https://logistica-domestica-backend.onrender.com`), che funziona da qualunque rete. Se invece vuoi puntare a un backend in esecuzione sul tuo PC (sviluppo), sostituiscilo con l'IP locale della macchina (`ipconfig` su Windows) — in quel caso il telefono deve essere sulla stessa Wi-Fi del PC.

```bash
npm install -g eas-cli
eas login          # crea gratis un account su expo.dev se non ce l'hai
eas build --platform android --profile preview
```

Dopo qualche minuto ottieni un link per scaricare il `.apk` (o un QR code da inquadrare col telefono per installarlo direttamente). Non serve Android Studio né un SDK installato in locale: la build gira sui server di Expo.

Per un uso quotidiano (non solo test), conviene mettere il backend su un hosting pubblico (Render, Railway, Fly.io hanno piani gratuiti) invece che sul tuo PC: così l'app funziona da qualunque rete, non solo da casa.

In alternativa, con Android Studio già aperto sul progetto (vedi sopra): menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Il file finito è in `android/app/build/outputs/apk/debug/app-debug.apk`.

## Struttura

```
app/
  (auth)/            login e registrazione
  (household-setup)/ crea o unisciti a una famiglia (dopo la registrazione)
  (app)/
    (tabs)/           Panoramica · Scorte · Lista Spesa
    item/[id].tsx     modifica/elimina prodotto (modale)
    item/new.tsx       nuovo prodotto (modale)
    household.tsx      dettagli famiglia, codice invito, membri
src/
  api/        client axios + funzioni per auth, famiglia, prodotti
  context/    AuthContext (sessione, token, utente corrente)
  components/ componenti UI riutilizzabili
  constants/  zone, categorie, unità di misura
  theme/      palette colori
  utils/      logica di calcolo scadenze
```

## Flusso applicativo

1. **Registrazione/Login** — ogni persona ha il proprio account.
2. **Famiglia** — al primo accesso l'utente crea una famiglia (ottiene un codice invito da condividere) oppure si unisce a una famiglia esistente inserendo il codice di un familiare. Tutti i membri della stessa famiglia vedono lo stesso inventario.
3. **Inventario** — tab "Scorte": elenco prodotti filtrabile per zona (Frigo/Freezer/Dispensa/Sgabuzzino) e per nome, con +/- rapido sulla quantità.
4. **Panoramica** — conteggio prodotti per zona, avvisi su prodotti scaduti o in scadenza nei prossimi giorni.
5. **Lista della spesa** — generata automaticamente dai prodotti con quantità a zero; toccando la spunta si segna come "ricomprato" (torna a quantità 1).
