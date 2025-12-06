const truncate = (text, limit) => {
    if (text.length <= limit){
        return text;
    }
    return `${text.slice(0, limit - 3)}...`;
};

export const generateGuidePrompt = async (lastLine, turnNumber = 1) => {
    const safeLine = truncate(lastLine || 'the story continues', 120);

    return [
        `Turn ${turnNumber}: keep the collaborative story moving.`,
        'In 2-3 sentences, guide the next player without revealing spoilers.',
        `Inspiration from the last line: "${safeLine}"`
  ].join(' ');
};
