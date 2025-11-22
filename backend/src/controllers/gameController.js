export const createGame = async (req, res) => {
    const gameId = Math.random().toString(36).substring(2, 9);

    res.json({
        gameId,
        initialPrompt: "A traveler enters a mysterious forest..."
    });
};

export const submitTurn = async (req, res) => {
    const {gameId} = req.params;
    const {text} = req.body;
    console.log(`New player submission in game '${gameId}':`, text);

    //TODO save to DB, extract last line(s) of prompt, call AI to generate new guiding prompt using last line(s)

    res.json({
        message: "Turn submitted",
        guidePrompt: "Continue the journey of a traveler entering a dangerous forest..."
    });
};

export const getGameState = async (req, res) => {
    const {gameId} = req.params;
    res.json({
        gameId,
        players: [],
        turns: [],
        status: "waiting"
    });
};