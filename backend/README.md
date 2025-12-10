# Backend Setup
1. Ensure nvm is installed (```nvm -v```)
2. Move to backend dir and check version (```cd backend; nvm use```)
2a. If the correct version is not installed, install it (the command will default to the correct version) (```nvm install```)
2b. I recommend setting the correct version as the default so you don't need to run ```nvm use``` everytime (```nvm alias default 20```)
3. Install dependencies (```npm install```)
4. Run dev server (```npm run dev```). If you see 
```console
Server running at http://localhost:3001
```
everything has been setup correctly.

## API endpoints (core)
- `POST /api/game/create` — create a game/lobby. Body: `hostName`, `hostId`, `turnDurationSeconds`, `maxTurns`, `maxPlayers`, `mode`.
- `GET /api/game/lobbies` — list open waiting lobbies. Query: optional `limit`, `minCreatedAt`.
- `POST /api/game/:gameId/settings` — host-only lobby update while status is `waiting`. Body: `hostId`, `maxPlayers` (clamped to current player count–7 range).
- `POST /api/game/:gameId/request-join` — request to join a lobby. Body: `playerName`, `playerId`.
- `POST /api/game/:gameId/review-join` — host approves/denies a request. Body: `hostId`, `playerId`, `approve` (boolean).
- `POST /api/game/:gameId/start` — host starts the game. Body: `playerId` (host).
- `POST /api/game/:gameId/turn` — submit a turn. Body: `playerName`, `playerId`, `text`.
- `POST /api/game/:gameId/preview` — preview turn guidance. Body: `playerName`, `playerId`, `text`.
- `GET /api/game/:gameId` — fetch current game state.
- `POST /api/game/:gameId/abandon` — host closes lobby. Body: `playerId`, optional `reason`.
- `POST /api/game/cleanup-lobbies` — admin clean-up for stale waiting lobbies.
- `GET /api/game/user/:userId/history` — latest finished games for a user. Query: optional `limit` (default 5, max 10).
