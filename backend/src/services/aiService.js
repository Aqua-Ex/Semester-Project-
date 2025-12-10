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
        'You generate disruptive constraints for a telephone-style collaborative storytelling game.',
        'Read the story context and craft ONE short instruction that forces the next player to add a new absurd complication that does NOT logically follow from the context.',
        'Prioritize strangeness over continuity: inject a wildly out-of-place element (object/material/event/rule/creature/condition) that would have less than a 1% chance of appearing naturally.',
        'The instruction must start with "Continue the story, but..." and MUST reference one concrete detail from the context.',
        'Acceptable twist types include: an impossible material, a contradictory event, a bizarre transformation, a strange rule everyone must obey, a misplaced modern object, or a surreal interruption.',
        'Keep it under 22 words. Do NOT continue the story—only output the instruction.',
      ].join(' ')

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

const localInitialPrompt = (seed) => {
  const base = truncate(seed || 'a fragile mission with everything on the line', 160).trim();
  const seedLine = base.endsWith('.') ? base.slice(0, -1) : base;
  const openers = [
    'Moments before things go wrong,',
    'Under strange skies,',
    'On the verge of disaster,',
    'Deep in unfamiliar territory,',
    'During a rare alignment,',
  ];
  const hooks = [
    'A ticking clock forces a daring move.',
    'An unlikely ally offers help but demands a price.',
    'A secret rule threatens to flip the plan upside down.',
    'Everyone senses the ground is about to shift.',
    'A rumour hints that nothing here is what it seems.',
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(openers)} ${seedLine}. ${pick(hooks)}`;
};

export const generateInitialPrompt = async (seed) => {
  const fallback = localInitialPrompt(seed);

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
