# StoryGame Backend API

Base URL (development): `http://localhost:3001`

All endpoints return JSON. Authentication is not implemented; callers must pass `hostId`/`playerId` in the body where required. See `backend/src/tools/requests.rest` for executable examples with the VS Code REST Client extension.

## Common response shapes
- **game** objects are scrubbed for clients (no `storySoFar`) and include: `id`, `hostId`, `hostName`, `status` (`waiting`, `active`, `timeout`, `finished`), `initialPrompt`, `guidePrompt` (falls back to `initialPrompt` before the first turn), `lastTurn`, `players` (`[{id,name}]`), `turnsCount`, `turnDurationSeconds`, `maxTurns`, `maxPlayers`, `requiresApproval`, `pendingRequests`, `turnDeadline`, `currentPlayer`, `currentPlayerId`, `mode` (`multi`, `single`, `rapid`), timestamps.
- **info** (from `GET /api/game/:gameId`) adds computed fields: `status`, `currentPlayer`, `nextDeadline`, `timeRemainingSeconds`, `remainingTurns`, `maxTurns`, `playerCount`, `maxPlayers`, `isFull`, `scores`, `lastTurn`.
- Error responses follow `{ "error": "message" }` with an appropriate HTTP status.

## Endpoints

### 1) Create a game
`POST /api/game/create`

Creates a lobby and seeds the opener using AI.

Body
```json
{
  "hostName": "Host",           // required (non-empty)
  "hostId": "google-user-id",   // required
  "initialPrompt": "optional seed",
  "turnDurationSeconds": 60,    // clamped 30-600 (rapid uses its own timing)
  "maxTurns": 5,                // clamped 1-50 (rapid defaults 50)
  "maxPlayers": 3,              // clamped 1-7 (defaults: single=1, multi=3, rapid=2)
  "mode": "multi"               // one of multi | single | rapid
}
```

Responses
- `201 Created` `{ "game": { ...game } }`
- `400` on validation failure.

Notes
- `status` is `waiting` for `multi`, `active` for `single`/`rapid`.
- `requiresApproval` defaults to true for `multi`.

### 2) List open lobbies
`GET /api/game/lobbies?limit=25`

Returns waiting multiplayer lobbies.

Query
- `limit` optional (default 25, max 50).

Response
```json
{
  "lobbies": [
    {
      "id": "uuid",
      "hostName": "Host",
      "createdAt": "ISO",
      "playerCount": 1,
      "maxPlayers": 3,
      "requiresApproval": true,
      "pendingRequests": 0
    }
  ]
}
```

### 3) Clean up waiting lobbies
`POST /api/game/cleanup-lobbies`

Marks all `waiting` lobbies as `finished`. Intended for maintenance.

Response: `{ "cleared": <number_of_closed_lobbies> }`

### 4) Request to join a lobby
`POST /api/game/:gameId/request-join`

Adds the player to the host-approval queue for a waiting multiplayer game.

Body
```json
{
  "playerName": "Player 2",   // required (non-empty)
  "playerId": "google-user-2" // required
}
```

Responses
- `202 Accepted` `{ "game": { ...game }, "requested": true }`
- `400/403/404` with `{ "error": "..." }` if invalid, full, wrong mode, or not waiting.
- If already requested/added, returns `{ "game": { ...game } }`.

### 5) Review a join request
`POST /api/game/:gameId/review-join`

Host approves or denies a pending request.

Body
```json
{
  "hostId": "host-user-id",   // required, must match game's hostId
  "playerId": "google-user-2",// required, must exist in pendingRequests
  "approve": true             // boolean, defaults to false
}
```

Responses
- `200 OK` `{ "game": { ...game }, "approved": true|false }`
- `400/403/404` on validation errors or missing request.

### 6) Join a lobby directly
`POST /api/game/:gameId/join`

Adds a player immediately when the lobby does **not** require approval.

Body
```json
{
  "playerName": "Player 2",   // required
  "playerId": "google-user-2" // required
}
```

Responses
- `200 OK` `{ "game": { ...game } }`
- `403` if host approval is required or if not the host.
- `400/404` on other validation issues.

### 7) Start a game
`POST /api/game/:gameId/start`

Begins a waiting multiplayer game (host-only) and sets the first deadline.

Body
```json
{ "playerId": "host-user-id" } // optional but must match hostId if provided
```

Responses
- `200 OK` `{ "game": { ...game } }` (returns current state if already active)
- `400` if fewer than 2 players in multi-mode.
- `403/404` on auth or missing game.

### 8) Preview a turn
`POST /api/game/:gameId/preview`

Returns an AI-generated guide prompt without committing the turn.

Body
```json
{
  "playerName": "Player 2",   // required, must already be in players
  "playerId": "google-user-2",// required
  "text": "Draft turn text"   // required
}
```

Responses
- `200 OK` `{ "preview": "next prompt", "order": 2 }`
- `400/403/404` on validation or missing membership.

### 9) Submit a turn
`POST /api/game/:gameId/turn`

Commits a player's turn, advances the turn order, and (if finished) scores the game.

Body
```json
{
  "playerName": "Player 2",   // required, must match joined player
  "playerId": "google-user-2",// required
  "text": "The story continues..." // required, non-empty
}
```

Responses
- `200 OK` `{ "game": { ...game }, "turn": { ...turn }, "scores": { ... } | null }`
- `409` with `finished: true` if a rapid game times out, or `timedOutPlayer`/`nextPlayer` when a deadline is exceeded.
- `400/403/404` on validation, wrong turn order, or missing membership.

Turn shape
```json
{
  "id": "uuid",
  "order": 1,
  "playerName": "Player 2",
  "playerId": "google-user-2",
  "text": "turn body",
  "promptUsed": "guide used for this turn",
  "guidePrompt": "same as promptUsed",
  "createdAt": "ISO timestamp"
}
```

Scores (when the game finishes)
```json
{
  "players": {
    "Player 2": {
      "creativity": 72,
      "cohesion": 68,
      "prompt_fit": 70,
      "momentum": 70,
      "creativity_note": "short rationale...",
      "cohesion_note": "short rationale...",
      "prompt_fit_note": "short rationale..."
    }
  },
  "summary": "one-line overview"
}
```

### 10) Get game state
`GET /api/game/:gameId`

Returns the current visible game plus computed info. Rapid games auto-finish when past the deadline.

Response
```json
{
  "game": { ...game },
  "info": { ...info }
}
```

Errors: `404` if the game is not found.

### 11) Abandon a game
`POST /api/game/:gameId/abandon`

Host forcibly finishes a lobby or active game.

Body
```json
{
  "playerId": "host-user-id", // required, must match hostId
  "reason": "host_left"       // optional string, stored as endedReason
}
```

Responses
- `200 OK` `{ "game": { ...game } }` (status becomes `finished`)
- `400/403/404` on validation failure.

### 12) Leaderboard
`GET /api/leaderboard?limit=20`

Returns ranked players by top score (test users filtered out).

Query
- `limit` optional (default 20, max 50).

Response
```json
{
  "leaderboard": [
    {
      "userId": "google-user-1",
      "username": "Tester",
      "topScore": 78.3,
      "lastScore": 75.1,
      "gamesPlayed": 4,
      "lastUpdated": "ISO",
      "topGameSummary": {
        "gameId": "uuid",
        "summary": "Game finished",
        "maxTurns": 5,
        "turns": [ { "order": 1, "playerName": "Tester", "text": "..." } ],
        "scores": { "Tester": 78.3 }
      },
      "rank": 1
    }
  ]
}
```
