<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=0:f59e0b,100:111827&text=TC2DLE&fontAlign=50&fontAlignY=38&fontColor=ffffff&fontSize=58&desc=Daily%20Typical%20Colors%202%20guessing&descAlign=50&descAlignY=62" alt="TC2DLE banner" />
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react&logoColor=fff" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646cff?style=flat&logo=vite&logoColor=ffffff" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript&logoColor=ffffff" />
  <img alt="MUI" src="https://img.shields.io/badge/MUI-5-007fff?style=flat&logo=mui&logoColor=ffffff" />
  <img alt="License: GPL-3.0" src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat" />
</p>

# TC2DLE

TC2DLE is a daily guessing web app for **Typical Colors 2**. It works like a compact DLE-style puzzle: choose weapons, maps, or cosmetics, submit guesses, and use clues to solve the global daily answer.

Weapon, map, cosmetic, and loading-screen data are scraped ahead of time into generated TypeScript files, so the app does not need to scrape the wiki at runtime. Daily answers reset globally at UTC midnight.
Weapon icons, map previews, cosmetic renders, and loading-screen images are also downloaded into the app during scraping, so the deployed game serves them locally instead of depending on Fandom image URLs at runtime.

## Features

- Daily UTC-based weapon, map, and cosmetic answers
- Dedicated `/weapons`, `/maps`, and `/cosmetics` pages
- Cached guesses that survive page reloads
- Mobile-friendly guess layout
- Scraped TC2 weapon/map data and static loading-screen backgrounds
- GitHub Pages deployment workflow

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run scrape
npm run scrape:weapons
npm run scrape:maps
npm run scrape:cosmetics
npm run scrape:loading-screens
```

## Data

Generated data lives in:

- `src/data/generated/weapons.generated.ts`
- `src/data/generated/weapons.generated.ts`
- `src/data/generated/maps.generated.ts`
- `src/data/generated/cosmetics.generated.ts`
- `src/data/generated/loadingScreens.generated.ts`
- `public/tc2-assets/`

Run `npm run scrape` to refresh all datasets and their local image assets.

## Deploy

The app includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that builds the Vite app and deploys `dist` to GitHub Pages on pushes to `main`.
