import { callChatModel } from './aiService.js';
import { db } from '../firebase.js';

const buildScoringMessages = (game, turns) => {
  const turnsText = turns
    .map((t) => {
      const promptLine = t.promptUsed || t.guidePrompt || 'No prompt provided.';
      return `Turn ${t.order} by ${t.playerName}\nPrompt: ${promptLine}\nText: ${t.text}`;
    })
    .join('\n\n');

  return [
    {
      role: 'system',
      content: [
        'You are a fair, concise story-game judge.',
        'Score each player on a 0-100 scale for these metrics:',
        '1) Creativity & Enrichment (original, vivid, on-tone additions).',
        '2) Cohesion & Continuity (respects existing context, no contradictions).',
        '3) Prompt Fit (explicitly weaves in the provided prompt/constraint).',
        'Baseline is low: start each metric at 20; raise into 40-60 for moderate evidence; 70-85 for strong evidence; 86-100 only for excellent contributions.',
        'If a turn is under 15 words or merely restates prior text, cap all scores at 35-45.',
        'Creativity: >60 only if new, on-tone details (characters, events, hooks) are added; 90-100 only if vivid and highly original.',
        'Cohesion: >60 only if it clearly respects prior context and avoids contradictions; 90-100 only if it tightly integrates prior elements.',
        'Prompt Fit: >60 only if the text clearly uses the provided prompt; cap at 35 if the prompt is ignored or contradicted.',
        'Use any integer 0-100; avoid rounding to the nearest 10. Prefer distinct values for players with different contributions.',
        'Example scores: 47 (short but on-tone), 63 (solid continuation), 78 (strong advance), 92 (excellent, vivid and cohesive).',
        'Return JSON only: { "players": { "Name": { "creativity": n, "creativity_note": "1 sentence", "cohesion": n, "cohesion_note": "1 sentence", "prompt_fit": n, "prompt_fit_note": "1 sentence" }, ... }, "summary": "one-line overall" }',
        'Keep summary under 12 words. Do not add any text outside the JSON. Do not truncate.',
        'Each note must be a single concise sentence. Be strict but fair. Do not add new story content.',
      ].join(' '),
    },
    {
      role: 'user',
      content: [
        'Evaluate each player based on their contributions.',
        `Initial scene: ${game.initialPrompt || 'Unknown opening'}`,
        'Here is the story so far (prompt then text for each turn):',
        turnsText || 'No turns.',
      ].join('\n\n'),
    },
  ];
};

const fetchTurns = async (gameId) => {
  const snap = await db
    .collection('games')
    .doc(gameId)
    .collection('turns')
    .orderBy('order', 'asc')
    .get();
  return snap.docs.map((doc) => doc.data());
};

export const scoreGame = async (game) => {
  const turns = await fetchTurns(game.id);
  const messages = buildScoringMessages(game, turns);
  const raw = await callChatModel(messages, { temperature: 0.25, max_tokens: 320 });
  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  };
  let parsed = tryParse(raw);

  if (!parsed) {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      parsed = tryParse(raw.slice(first, last + 1));
    }
  }

  if (parsed) {
    const playersByName = new Map((game.players || []).map((p) => [p.name, p.id]));
    const jitterScore = (score, name) => {
      if (!Number.isFinite(score)) return score;
      if (score % 10 !== 0) return score;
      const id = playersByName.get(name) || name;
      const hash = [...String(id)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const offset = hash % 2 === 0 ? -2 : 2;
      const jittered = Math.max(0, Math.min(100, score + offset));
      // ensure not landing on a half step like 41 for 40 per requirement while clamping to bounds
      return jittered;
    };

    Object.entries(parsed.players || {}).forEach(([name, metrics]) => {
      if (!metrics) return;
      const promptFit =
        metrics.prompt_fit ??
        metrics.promptFit ??
        metrics.prompt_alignment ??
        metrics.promptAlignment ??
        metrics.momentum;
      const continuity = metrics.cohesion ?? metrics.continuity;
      if (typeof metrics.prompt_fit === 'undefined' && typeof promptFit !== 'undefined') {
        metrics.prompt_fit = promptFit;
      }
      if (typeof metrics.momentum === 'undefined' && typeof promptFit !== 'undefined') {
        metrics.momentum = promptFit;
      }
      if (typeof metrics.cohesion === 'undefined' && typeof continuity !== 'undefined') {
        metrics.cohesion = continuity;
      }

      ['creativity', 'cohesion', 'momentum', 'prompt_fit'].forEach((k) => {
        if (metrics && Object.prototype.hasOwnProperty.call(metrics, k)) {
          metrics[k] = jitterScore(Number(metrics[k]), name);
        }
      });
    });
    return parsed;
  }

  return { error: 'Failed to parse model response', raw };
};
