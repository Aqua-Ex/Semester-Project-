# StoryGame Backend API Documentation (11/22/25)

**This document describes all API endpoints used by the game's backend.**  

**Base URL (development):**
[http://localhost:3001/](http://localhost:3001/)

---
### Notes
- All endpoints return JSON.
- For easy example enpoint usage, if using VSCode, install the REST Client extension, which will allow you to submit the requests in /backend/src/tools/requests.rest, and view them directly in the IDE.
- Real DB behavior hasn't been implemented yet, feel free to use these example responses to mock what the backend will look like
- Masked/unmasked gamestates for GET /api/game/:gameId haven't been implemented yet, this doc describes what the behavior will look like.

___
## 1. Create a New Game  
**POST /api/game/create**

Creates a new game session and returns an initial AI-generated prompt.

### Request Body
```json
{}
```

### Response
```json
{
    "gameId": "abc123",
    "initialPrompt": "A man enters a room..."
}
```

## 2. Submit a Turn
**POST /api/game/:gameId/turn**

Submits a story entry for the game correlating with the gameId.  
The backend persists the texts and returns a guiding prompt for the next player.


### Request Body
```json
{
    "text": "The hero drew his sword..."
}
```

### Response
```json
{
    "message": "Turn submitted",
    "guidePrompt": "A hero marches into battle, sword drawn..."
}
```

## 3. Get Game State
**GET /api/game/:gameId**

Returns the current state of the game (waiting -> in-progress -> completed), and information on the previous turns.  
If the state is in-progress, a masked (hidden) version is passed, ensuring the game isn't spoiled by making prompts visible.


### Response (in-progress)
```json
{
  "gameId": "abc123",
  "status": "in-progress",
  "turnCount": 3,
  "currentPrompt": "Continue the hero's swordfight with his rival..."
}
```

### Response (completed)
```json
{
  "gameId": "abc123",
  "status": "complete",
  "turns": [
    { "playerId": "p1", "text": "Once upon a time..." },
    { "playerId": "p2", "text": "The stranger entered the forest..." },
    { "playerId": "p3", "text": "A glowing archway appeared..." }
  ]
}
```