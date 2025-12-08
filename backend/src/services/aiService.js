const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 10000);
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

const truncate = (text, limit) => {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 3)}...`;
};

const buildMessages = (safeLine, turnNumber) => [
  {
    role: 'system',
    content: [
      'Story mentor: respond with exactly 2-3 sentences.',
      'Advance the plot a little, keep tension, avoid closing threads.',
      'Never spoil hidden outcomes or future reveals.',
      'Do not introduce new characters or events unless the prompt clearly implies them.',
    ].join(' '),
  },
  {
    role: 'user',
    content: `Turn ${turnNumber}. Continue from: "${safeLine}".`,
  },
];

const fallbackPrompt = (safeLine, turnNumber) =>
  [
    'Story mentor: respond with exactly 2-3 sentences.',
    'Advance the plot a little, keep tension, avoid closing threads.',
    'Never spoil hidden outcomes or future reveals.',
    'Do not introduce new characters or events unless the prompt clearly implies them.',
    `Turn ${turnNumber}. Continue from: "${safeLine}".`,
  ].join(' ');

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

export const generateGuidePrompt = async (lastLine, turnNumber = 1) => {
  const safeLine = truncate(lastLine || 'the story continues', 120);

  if (!GROQ_API_KEY) {
    return fallbackPrompt(safeLine, turnNumber);
  }

  try {
    const messages = buildMessages(safeLine, turnNumber);
    const guide = await callChatModel(messages);
    console.log('[aiService] model guide:', guide);
    return guide;
  } catch (error) {
    // Fall back to the local prompt format if the API call fails.
    console.warn('[aiService] AI call failed, using fallback prompt:', error);
    return fallbackPrompt(safeLine, turnNumber);
  }
};

export { callChatModel };
