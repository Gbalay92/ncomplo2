# ncomplo2

Frontend for the World Cup 2026 predictions app. Built with React and Vite.

## Stack

- **Framework**: React 19
- **Router**: React Router 7
- **Bundler**: Vite 7
- **Styles**: CSS Modules
- **Auth**: Cookie-based (handled by the API)

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (e.g. `https://api.ncomplo.com`) |

## Project structure

```
src/
├── api/                    # API client functions
│   ├── client.js           # Base fetch wrapper with auth retry
│   ├── auth.js
│   ├── matches.js
│   ├── predictions.js
│   ├── bracket.js
│   ├── leaderboard.js
│   ├── tournament.js
│   └── users.js
├── components/             # Reusable UI components
├── context/
│   └── AuthContext.jsx     # Global auth state
├── hooks/
│   └── useRouter.jsx       # Navigation helper
├── pages/                  # Route-level components
└── App.jsx                 # Routes definition
```

## Pages

| Path | Auth | Description |
|---|---|---|
| `/` | — | Home — today's matches, podium, CTA button |
| `/login` | — | Login form |
| `/register` | — | Registration form |
| `/prediction` | ✓ | Own predictions — group stage + bracket |
| `/leaderboard` | ✓ | Ranked leaderboard with podium |
| `/user/:userId` | ✓ | Read-only view of another user's predictions |
| `/profile` | ✓ | User profile |
| `/admin` | ✓ Admin | Admin panel |

## Key features

- **Group predictions** — predict scores for all group stage matches; live standings update as you fill them in.
- **Bracket predictions** — pick winners for each knockout round; picks cascade-clear automatically when upstream results change.
- **Save with warnings** — unified save button with confirmation dialog and yellow highlights for unfilled matches/picks.
- **Leaderboard** — podium for top 3, expandable rows showing today's predictions inline, link to full predictions view.
- **Today's matches** — home widget showing live match schedule with results when available.

## Auth flow

All API requests include `credentials: 'include'` so cookies are sent automatically. On a 401 response the client retries once after calling `/auth/refresh`. The `AuthContext` exposes `user`, `isLoggedIn`, `logIn`, `register` and `handleLogout`.

## Deployment

```bash
npm run build   # outputs to dist/
```

The `dist/` folder is a standard SPA. A `_redirects` file (Netlify) is included to handle client-side routing (`/* → /index.html`).
