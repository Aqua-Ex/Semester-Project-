const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 10000);
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

const truncate = (text, limit) => {
  if (!text) return '';
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 3)}...`;
};

const buildMessages = ({ storySoFar, lastTurnText, previousPrompt, turnNumber, initialPrompt }) => {
  const safeStory = truncate(storySoFar || initialPrompt || 'The story begins...', 1200);
  const safeLastTurn = truncate(lastTurnText || safeStory || 'the latest beat', 240);
  const safePreviousPrompt = truncate(previousPrompt || 'No prior prompt', 200);

  return [
    {
      role: 'system',
      content: [
        'You create challenging constraints for a collaborative storytelling game.',
        'Read the story context and craft ONE concise, surprising instruction that makes the next continuation harder while staying coherent enough to be possible.',
        'Prioritize bizarreness over smooth continuity: force in a wildly out-of-place element (word/phrase/object/character/condition) that barely fits but can be woven in.',
        'The instruction must start with "Continue the story, but..." and reference concrete details from the context.',
        'Examples of surprise elements: a specific pun, an odd material, an unexpected refusal, a strange rule, a pop-culture reference, or an impossible environment.',
        'Keep it under 28 words. Do not write story text, only the instruction.',
      ].join(' '),
    },
    {
      role: 'user',
      content: [
        `Initial scene: ${truncate(initialPrompt || 'Unknown scene', 200)}`,
        `Story so far (${turnNumber - 1} turns): ${safeStory}`,
        `Last turn text: ${safeLastTurn}`,
        `Previous prompt: ${safePreviousPrompt}`,
        'Return one sentence instruction only.',
      ].join('\n'),
    },
  ];
};

const fallbackPrompt = ({ storySoFar, lastTurnText }) => {
  const base = truncate(lastTurnText || storySoFar || 'the current scene', 160);
  return `Continue the story, but collide ${base} with a wildly out-of-place element (think rubber ducks, quantum spaghetti, a disco anthem, or a sudden vow of silence).`;
};

const callChatModel = async (messages, { temperature = 0.5, max_tokens = 100 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty completion from OpenAI');
    }

    return content;
  } finally {
    clearTimeout(timer);
  }
};

export const generateGuidePrompt = async ({
  storySoFar = '',
  lastTurnText = '',
  previousPrompt = '',
  turnNumber = 1,
  initialPrompt = '',
} = {}) => {
  const fallback = fallbackPrompt({ storySoFar, lastTurnText });

  if (!GROQ_API_KEY) {
    return fallback;
  }

  try {
    const messages = buildMessages({
      storySoFar,
      lastTurnText,
      previousPrompt,
      turnNumber,
      initialPrompt,
    });
    const guide = await callChatModel(messages, { temperature: 0.65, max_tokens: 90 });
    console.log('[aiService] model guide:', guide);
    return guide;
  } catch (error) {
    // Fall back to the local prompt format if the API call fails.
    console.warn('[aiService] AI call failed, using fallback prompt:', error);
    return fallback;
  }
};

export { callChatModel };

const buildInitialPromptMessages = (seed) => {
  const topic = truncate(seed || 'Invent a fresh, vivid setting with a clear goal and tension.', 200);
  return [
    {
      role: 'system',
      content: [
        'You write concise, vivid opening prompts for a collaborative story game.',
        'Return exactly 1-2 sentences that set the scene and goal, include a hook, and avoid resolving the plot.',
        'Make it specific and flavorful; avoid generic fantasy tropes; do not add instructions.',
      ].join(' '),
    },
    {
      role: 'user',
      content: `Create a new story opener based on this seed (optional): ${topic}`,
    },
  ];
};

export const generateInitialPrompt = async (seed) => {
  const fallback =
    'This is a sci-fi story where a captain needs to navigate the galaxy on his spaceship with the help of his trusty crew.';

  if (!GROQ_API_KEY) {
    return fallback;
  }

  try {
    const messages = buildInitialPromptMessages(seed);
    const prompt = await callChatModel(messages, { temperature: 0.8, max_tokens: 90 });
    return prompt || fallback;
  } catch (error) {
    console.warn('[aiService] initial prompt generation failed, using fallback:', error);
    return fallback;
  }
};
