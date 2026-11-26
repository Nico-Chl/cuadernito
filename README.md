# Cuadernito

PWA de vocabulaire (révision espacée) et de conjugaison, utilisable hors ligne.
Les données restent sur l'appareil (IndexedDB), avec export/import JSON.

## Stack
React + TypeScript + Vite, Dexie (IndexedDB), vite-plugin-pwa, react-router (HashRouter).

## Commandes
```bash
npm run dev       # développement
npm run build     # build de production (dist/)
npm run preview   # servir le build (nécessaire pour tester le service worker)
node scripts/make-icons.mjs   # régénérer les icônes PNG depuis public/icon.svg
```

## Structure
- `src/db.ts`: schéma de la base (mots, cartes, réglages)
- `src/backup.ts`: export / import de sauvegarde
- `src/i18n.tsx`: langues de l'interface (fr, en)
- `src/pages/`: écrans (accueil, vocabulaire, conjugaison, réglages)
