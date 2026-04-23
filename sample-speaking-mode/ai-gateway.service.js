/* ============================================
   LexiLearn — AI Gateway Service
   ============================================
   Central routing layer for all AI calls.
   Routes tasks to the optimal model provider:
   - Groq (Llama 3.3 70B): Speed-critical tasks (vocab, tooltips, distractors)
   - DeepSeek (R1/V3): Reasoning-heavy tasks (Writing/Speaking grading)
   - Gemini (1.5/2.5 Flash): Vision tasks & fallback (Cambridge PDF parsing)
*/

// ─── Provider Config ────────────────────────────────────────────────
const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyName: 'lexilearn_groq_key',
    format: 'openai', // Uses OpenAI-compatible format
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    keyName: 'lexilearn_deepseek_key',
    format: 'openai',
  },
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
    model: 'gemini-2.5-flash',
    keyName: 'lexilearn_gemini_key',
    format: 'gemini',
  },
  gemini_v25: {
    name: 'Gemini 2.5 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
    model: 'gemini-2.5-flash',
    keyName: 'lexilearn_gemini_key',
    format: 'gemini',
  },
  gemini_v15: {
    name: 'Gemini 1.5 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
    model: 'gemini-1.5-flash',
    keyName: 'lexilearn_gemini_key',
    format: 'gemini',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyName: 'lexilearn_openai_key',
    format: 'openai',
  },
};

// ─── Task → Provider Routing ────────────────────────────────────────
const TASK_ROUTING = {
  // Groq primary (speed)
  vocab_extract:      { primary: 'groq', backup: 'gemini' },
  passage_insights:   { primary: 'groq', backup: 'gemini' },
  tooltip:            { primary: 'groq', backup: 'gemini' },
  answer_validation:  { primary: 'groq', backup: 'gemini' },
  distractors:        { primary: 'groq', backup: 'gemini' },
  speaking_prompt:    { primary: 'groq', backup: 'gemini' },
  exercise_gen:       { primary: 'groq', backup: 'deepseek' },
  exam_blocks:        { primary: 'openai', backup: 'groq' },

  // DeepSeek primary (reasoning)
  writing_grade:      { primary: 'deepseek', backup: 'groq' },
  speaking_eval:      { primary: 'deepseek', backup: 'groq' },
  speaking_eval_full: { primary: 'deepseek', backup: 'groq' },

  // Gemini primary (vision / PDF / Audio)
  // Vision / PDF / OCR (Migrated to GPT-4o-mini for cost/quality)
  cambridge_parse:    { primary: 'openai', backup: 'gemini' },
  speaking_eval_audio: { primary: 'gemini', backup: null },
  reading_exam_parser: { primary: 'openai', backup: 'gemini' },

  // Listening Practice AI Tasks
  shadowing_eval:      { primary: 'gemini_v25', backup: 'gemini_v15' },
  shadowing_feedback:  { primary: 'deepseek', backup: 'groq' },
  dictation_feedback:  { primary: 'groq', backup: 'deepseek' },
  listening_stt:       { primary: 'gemini', backup: null }, 
  embedding:           { primary: 'gemini', backup: 'openai' },
};

// ─── Key Management ─────────────────────────────────────────────────

function getProviderKey(providerName) {
  const provider = PROVIDERS[providerName];
  if (!provider) return null;

  // 1. Check direct key
  const directKey = localStorage.getItem(provider.keyName);
  if (directKey) return directKey;

  // 2. Fallback to settings object
  try {
    const settings = JSON.parse(localStorage.getItem('lexilearn_settings') || '{}');
    const settingsKeyMap = {
      groq: 'groqApiKey',
      deepseek: 'deepseekApiKey',
      gemini: 'geminiApiKey',
      gemini_v25: 'geminiApiKey',
    };
    const key = settings[settingsKeyMap[providerName]];
    if (key) return key;
  } catch {}

  // 3. Fallback to Vite environment variables
  const envKeyMap = {
    groq: import.meta.env.VITE_GROQ_API_KEY,
    deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY,
    gemini: import.meta.env.VITE_GEMINI_API_KEY,
    gemini_v25: import.meta.env.VITE_GEMINI_API_KEY,
    openai: import.meta.env.VITE_OPENAI_API_KEY,
  };
  const envKey = envKeyMap[providerName];
  if (envKey) return envKey;

  return null;
}

// ─── Provider Call Adapters ─────────────────────────────────────────

async function callOpenAI(provider, prompt, options = {}) {
  const apiKey = getProviderKey(provider);
  if (!apiKey) throw new Error(`${PROVIDERS[provider].name} API key not configured. Go to Settings to add it.`);

  const config = PROVIDERS[provider];
  const messages = [
    { role: 'system', content: options.systemPrompt || 'You are a helpful assistant. Return ONLY valid JSON unless instructed otherwise.' },
    { role: 'user', content: prompt },
  ];

  const body = {
    model: options.model || config.model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens || 4096,
  };

  // Request JSON output if supported
  if (options.jsonMode !== false) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `${config.name} API Error: ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${config.name} returned an empty response.`);

  if (options.jsonMode !== false) {
    try {
      return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
    } catch (e) {
      console.error(`Malformed JSON from ${config.name}:`, text);
      throw new Error(`Failed to parse ${config.name} response as JSON.`);
    }
  }
  return text;
}

/**
 * specifically for Gemini Embedding API (text-embedding-004)
 */
export async function callGeminiEmbedding(text) {
  const apiKey = getProviderKey('gemini');
  if (!apiKey) throw new Error('Gemini API key (for Embeddings) not configured.');

  const model = 'text-embedding-004';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:embedContent?key=${apiKey}`;

  const body = {
    content: { parts: [{ text }] },
    task_type: 'RETRIEVAL_QUERY'
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini Embedding API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Specifically for OpenAI Embedding API
 */
export async function callOpenAIEmbedding(text) {
  const apiKey = getProviderKey('openai');
  if (!apiKey) throw new Error('OpenAI API key (for Embeddings) not configured.');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Embedding API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function callGemini(prompt, options = {}) {
  const apiKey = getProviderKey('gemini');
  if (!apiKey) throw new Error('Gemini API key not configured. Go to Settings to add it.');

  const config = PROVIDERS.gemini;
  const model = options.model || config.model;
  const url = `${config.baseUrl}/${model}:generateContent?key=${apiKey}`;

  const parts = [];
  if (options.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: options.audioMimeType || 'audio/webm',
        data: options.audioBase64
      }
    });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
    },
  };

  // Removed response_mime_type as it causes 400 errors in some environments.
  // We handle JSON parsing by stripping markdown backticks in the response handling below.

  let response;
  let attempts = 0;
  
  while (attempts < 2) {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.status === 429 && attempts === 0) {
      console.warn(`[Gemini] 429 Rate Limit. Waiting 2s before retry...`);
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
      continue;
    }
    break;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `Gemini API Error: ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');

  if (options.jsonMode !== false) {
    try {
      return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
    } catch (e) {
      console.error('Malformed JSON from Gemini:', text);
      throw new Error('Failed to parse Gemini response as JSON.');
    }
  }
  return text;
}

// ─── Main Gateway ───────────────────────────────────────────────────

/**
 * Central AI call with automatic fallback.
 * @param {string} task - Task key from TASK_ROUTING (e.g. 'vocab_extract', 'writing_grade')
 * @param {string} prompt - The full prompt text
 * @param {object} options - { temperature, maxTokens, jsonMode, model, systemPrompt }
 * @returns {Promise<any>} Parsed JSON response (or raw text if jsonMode=false)
 */
export async function callAI(task, prompt, options = {}) {
  const route = TASK_ROUTING[task];
  if (!route) {
    console.warn(`Unknown AI task "${task}", defaulting to Gemini.`);
    return callGemini(prompt, options);
  }

  const tryProvider = async (providerName) => {
    const config = PROVIDERS[providerName];
    if (!config) throw new Error(`Unknown provider: ${providerName}`);

    if (config.format === 'openai') {
      return await callOpenAI(providerName, prompt, options);
    } else {
      return await callGemini(prompt, options);
    }
  };

  // Try primary
  try {
    const primaryKey = getProviderKey(route.primary);
    if (!primaryKey && route.backup) {
      console.warn(`No API key for ${route.primary}, trying backup ${route.backup}`);
      return await tryProvider(route.backup);
    }
    return await tryProvider(route.primary);
  } catch (primaryErr) {
    console.warn(`Primary (${route.primary}) failed for task "${task}":`, primaryErr.message);

    // Fallback to backup
    if (route.backup) {
      try {
        console.log(`Falling back to ${route.backup} for task "${task}"...`);
        return await tryProvider(route.backup);
      } catch (backupErr) {
        console.error(`Backup (${route.backup}) also failed:`, backupErr.message);
        throw backupErr;
      }
    }
    throw primaryErr;
  }
}

/**
 * Specialized gateway for embeddings with fallback.
 */
export async function callEmbeddingAI(text) {
  const route = TASK_ROUTING.embedding || { primary: 'gemini', backup: 'openai' };
  
  const tryEmbedding = async (providerName) => {
    if (providerName === 'gemini') return await callGeminiEmbedding(text);
    if (providerName === 'openai') return await callOpenAIEmbedding(text);
    throw new Error(`Provider ${providerName} does not support embeddings.`);
  };

  try {
    const primaryKey = getProviderKey(route.primary);
    if (!primaryKey && route.backup) {
      return await tryEmbedding(route.backup);
    }
    return await tryEmbedding(route.primary);
  } catch (err) {
    if (route.backup) {
      console.warn(`Primary embedding (${route.primary}) failed, falling back to ${route.backup}`);
      return await tryEmbedding(route.backup);
    }
    throw err;
  }
}


/**
 * Step 1: Extract word-level IPA from user's spoken audio.
 * Gemini listens and returns what the user actually said phonetically.
 * @param {string} audioBase64 - Base64 encoded audio
 * @param {string} targetText - Reference text (helps Gemini align correctly)
 * @param {string} mimeType - e.g. 'audio/webm'
 * @returns {{ words: Array<{ word: string, spoken_ipa: string }> }}
 */
export async function extractSpeakerIPA(audioBase64, targetText, mimeType = 'audio/webm') {
  const prompt = `You are a phonetics expert. Your only job is to LISTEN to the audio recording and transcribe what the speaker said into IPA notation.

Context (the target sentence): "${targetText}"

Instructions:
1. Listen carefully to the audio. Transcribe EXACTLY what you hear.
2. For each word spoken (including extra words or omissions), provide the IPA notation of how the speaker actually pronounced it.
3. If a word from the target script was omitted, include it with spoken_ipa as null.
4. If the speaker said extra words not in the script, include them with is_insertion: true.

Return ONLY this JSON (no markdown):
{
  "spoken_words": [
    {
      "word": "target word or extra word",
      "spoken_ipa": "/how they actually said it/ or null if omitted",
      "is_insertion": false
    }
  ]
}`;

  return await callAI('shadowing_eval', prompt, {
    audioBase64,
    audioMimeType: mimeType,
    temperature: 0.0,
    jsonMode: true
  });
}

/**
 * Step 2: Compare speaker's IPA against reference IPA word-by-word.
 * This runs LOCALLY — no AI needed for this step.
 * @param {Array<{word: string, ipa: string}>} referenceWords - Pre-cached IPA from documentation
 * @param {Array<{word: string, spoken_ipa: string, is_insertion?: boolean}>} spokenWords - Extracted from audio
 * @returns {{ accuracy: number, words: Array, errors: Array }}
 */
export function compareIPA(referenceWords, spokenWords) {
  const results = [];
  let correctCount = 0;
  let totalCount = referenceWords.length;

  for (const ref of referenceWords) {
    const spoken = spokenWords.find(
      s => !s.is_insertion && s.word.toLowerCase() === ref.word.toLowerCase()
    );

    if (!spoken || spoken.spoken_ipa === null) {
      // Omission
      results.push({ word: ref.word, ref_ipa: ref.ipa, spoken_ipa: null, status: 'Omission' });
    } else {
      // Compare IPA strings (normalized, ignoring stress marks for soft comparison)
      const normalize = (ipa) => ipa
        .replace(/[\/\[\]]/g, '')
        .replace(/[ˈˌ]/g, '') // remove stress marks for soft match
        .toLowerCase()
        .trim();

      const refNorm = normalize(ref.ipa);
      const spokenNorm = normalize(spoken.spoken_ipa);
      const isCorrect = refNorm === spokenNorm;

      if (isCorrect) {
        correctCount++;
        results.push({ word: ref.word, ref_ipa: ref.ipa, spoken_ipa: spoken.spoken_ipa, status: 'Correct' });
      } else {
        // Soft match: check overlap of phonemes
        const overlap = [...refNorm].filter(c => spokenNorm.includes(c)).length;
        const similarity = overlap / Math.max(refNorm.length, spokenNorm.length);
        if (similarity >= 0.7) {
          correctCount += 0.5; // Partial credit
          results.push({ word: ref.word, ref_ipa: ref.ipa, spoken_ipa: spoken.spoken_ipa, status: 'Close' });
        } else {
          results.push({ word: ref.word, ref_ipa: ref.ipa, spoken_ipa: spoken.spoken_ipa, status: 'Mispronunciation' });
        }
      }
    }
  }

  // Penalize insertions
  const insertions = spokenWords.filter(s => s.is_insertion);
  const insertionPenalty = insertions.length * 5;

  const rawAccuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  const accuracy = Math.max(0, Math.round(rawAccuracy - insertionPenalty));

  const errors = results.filter(r => r.status !== 'Correct').map(r => ({
    word: r.word,
    issue: r.status,
    ref_ipa: r.ref_ipa,
    spoken_ipa: r.spoken_ipa,
    tip: r.status === 'Omission' ? 'Bỏ lỡ từ này' :
         r.status === 'Close' ? `Gần đúng: bạn nói ${r.spoken_ipa}, đúng là ${r.ref_ipa}` :
         `Sai âm: bạn nói ${r.spoken_ipa || '—'}, đúng là ${r.ref_ipa}`
  }));

  return { accuracy, words: results, errors, insertions };
}

// ─── Legacy (kept for fallback) ─────────────────────────────────
export async function evaluateShadowing(audioBase64, targetText, mimeType = 'audio/webm') {
  const prompt = `You are an IELTS Pronunciation Expert. Analyze the provided audio against the target script.
Target Script: "${targetText}"

Return ONLY a JSON object:
{
  "overall_accuracy": number,
  "words": [
    {
      "word": "string", 
      "status": "None" | "Mispronunciation" | "Omission" | "Insertion",
      "target_ipa": "string | null",
      "actual_ipa": "string | null",
      "score": number
    }
  ]
}`;

  return await callAI('shadowing_eval', prompt, {
    audioBase64,
    audioMimeType: mimeType,
    temperature: 0.1,
    jsonMode: true
  });
}

// ─── Convenience Exports ────────────────────────────────────────────
export { getProviderKey, PROVIDERS, TASK_ROUTING };
