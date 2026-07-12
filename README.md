# Logistica Domestica — App

App mobile (Expo / React Native) per gestire l'inventario di casa: frigo, freezer, dispensa e sgabuzzino, con scadenze e lista della spesa condivise tra i membri della famiglia.

## Stack

- [Expo](https://expo.dev) SDK 57 + Expo Router (TypeScript)
- React Query per lo stato server (fetch, cache, invalidazione)
- Axios per le chiamate API
- `expo-secure-store` per salvare il token JWT sul device

Il design (colori, zone, categorie, logica di scadenza) riprende il prototipo React web incluso in `reference/scorte-di-casa.web-prototype.jsx`.

## Requisiti

- Node.js 20+
- Il [backend](../logistica-domestica-backend) in esecuzione e raggiungibile dal telefono/emulatore
- App **Expo Go** sul telefono (oppure un simulatore iOS/Android) — non serve Android Studio o Xcode per lo sviluppo quotidiano

## Configurazione

```bash
cp .env.example .env
```

Imposta `EXPO_PUBLIC_API_URL` con l'indirizzo del backend:

- Simulatore iOS: `http://localhost:8080`
- Emulatore Android: `http://10.0.2.2:8080`
- Telefono fisico in Expo Go: usa l'IP della macchina in rete locale, es. `http://192.168.1.10:8080`, oppure l'URL pubblico del backend se è deployato

## Avvio

```bash
npm install
npm start
```

Scansiona il QR code con l'app Expo Go (Android) o con la fotocamera (iOS) per aprire l'app sul telefono.

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
