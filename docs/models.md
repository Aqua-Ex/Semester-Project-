# StoryGame Backend Model Documentation (11/22/25)

**This document describes the structure of the objects used in the game.**  

**Base URL (development):**
[http://localhost:3001/](http://localhost:3001/)


___
## 1. Game Object
This object is persisted in the database, and contains a constantly updated record of the game.
```json
{
    "gameId": "string",
    "turns": [
        {
            "playerId": "string",
            "text": "string",
            "round": "number"
        }
    ],
    "status": "waiting | in-progress | complete:
}
```

## 2. Turn Object
This object represents a player's turn, which is then stored inside the Game object. It is also used in the AI prompt generation.
```json
{
    "playerId": "string",
    "text": "string",
    "timestamp": "ISO date"
}
```