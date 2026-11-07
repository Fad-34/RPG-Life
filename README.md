# LIFE RPG

A personal life progression dashboard that turns everyday actions into RPG-style progress. Built with React, TypeScript, Vite, Tailwind CSS v4, Lucide icons and Recharts.

## Features

- Character profile, levels and an XP progression system
- Eight core attributes plus custom attributes
- Daily, weekly, main, side and challenge quests
- One-time, daily and weekly quest recurrence with duplicate XP protection
- Habit tracker with daily/weekly schedules, streaks and a 28-day activity heatmap
- Activity calendar and history
- Achievement milestones
- Analytics based on saved XP events
- Private journal stored in the browser
- Automatic localStorage persistence
- JSON export and restore
- Dark and light themes
- Responsive desktop and mobile layouts
- GitHub Pages deployment through GitHub Actions

## Requirements

- Node.js 22 or later (LTS recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/`).

## Production build

```bash
npm run build
npm run preview
```

The production website is generated in `dist/`.

## Deploy to GitHub Pages

This repository is configured for the project URL:

`https://Fad-34.github.io/RPG-Life/`

1. Push the project to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy LIFE RPG to GitHub Pages** to finish.
5. Visit `https://Fad-34.github.io/RPG-Life/`.

The workflow rebuilds and deploys the application whenever a commit is pushed to `main`. For a differently named repository or GitHub account, update `base` in `vite.config.ts` and the URL in this README.

## Data and privacy

LIFE RPG is a static client-side application. Character progress, quests, habits, XP events and journal entries are saved in the browser's localStorage. Data is not sent to a server and does not automatically synchronize across devices or browsers. Use **Settings → Export your data** to make a JSON backup before clearing browser data or changing devices.

Do not commit exported backups or personal journal data to this public repository. The `.gitignore` excludes common environment files, dependencies and build output.

## Notes

- The initial starter data is clearly labelled and can be removed in Dashboard or Settings.
- Completing a quest awards XP once per recurrence period: once ever for one-time quests, once per local day for daily quests, and once per local week for weekly quests.
- Completing a habit awards 5 XP by default and updates the linked attribute; toggling it off removes that same completion reward. Habits are tracked separately to support consistency without penalizing missed days.
- Journal writing never awards XP.
