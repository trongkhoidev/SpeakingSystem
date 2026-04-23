import { supabaseFetch, supabaseSave } from '../core/db.js';
import { getEmbedding, cosineSimilarity } from '../utils/embedding.util.js';
import * as aiGateway from './ai-gateway.service.js';
import { SPEAKING_PHRASES } from '../data/speaking_phrases.js';
import { assessPronunciation } from './azure-speech.service.js';

export const speakingService = {
  // ─── Database Operations ──────────────────────────────────────────

  async createSession(userId, title = 'Practice Session') {
    const data = await supabaseSave('speaking_sessions', { user_id: userId, title });
    return data[0];
  },

  async addQuestions(sessionId, questions) {
    const records = questions.map((q, i) => ({
      session_id: sessionId,
      question_text: q.text,
      order_index: i,
      part: q.part || null
    }));
    const data = await supabaseSave('speaking_questions', records);
    return data;
  },

  async saveAnswer(payload) {
    const {
      question_id, user_id, audio_url, student_transcript,
      fluency_score, lexical_score, grammar_score,
      pronunciation_score, overall_band, feedback_json
    } = payload;

    const { supabaseDeleteWhere } = await import('../core/db.js');
    try {
      // Ensure we overwrite instead of adding duplicate entries
      await supabaseDeleteWhere('speaking_answers', { question_id: `eq.${question_id}` });
    } catch(e) {}

    const data = await supabaseSave('speaking_answers', {
      question_id, user_id, audio_url, student_transcript,
      fluency_score, lexical_score, grammar_score,
      pronunciation_score, overall_band, feedback_json
    });
    return data[0];
  },

  // ─── Past Sessions ────────────────────────────────────────────────

  async getUserSessions(userId, limit = 20) {
    const data = await supabaseFetch('speaking_sessions', {
      filters: { user_id: `eq.${userId}` },
      order: 'created_at.desc',
      limit
    });
    return data || [];
  },

  async getSessionQuestions(sessionId) {
    const data = await supabaseFetch('speaking_questions', {
      filters: { session_id: `eq.${sessionId}` },
      order: 'order_index.asc'
    });
    return data || [];
  },

  async getSessionQuestionsWithAnswers(sessionId, userId) {
    const questions = await this.getSessionQuestions(sessionId);
    if (!questions.length) return [];
    
    const qIds = questions.map(q => q.id);
    const answers = await supabaseFetch('speaking_answers', {
      filters: { user_id: `eq.${userId}`, question_id: `in.(${qIds.join(',')})` }
    });
    
    return questions.map(q => {
      const ans = answers.find(a => a.question_id === q.id);
      return { ...q, answer: ans || null };
    });
  },

  async deleteSession(sessionId) {
    // Cascade delete is handled by DB FKs usually, but we call it here.
    const { supabaseDelete } = await import('../core/db.js');
    await supabaseDelete('speaking_sessions', sessionId);
  },

  // ─── Text-to-Speech ───────────────────────────────────────────────

  speakText(text, lang = 'en-GB') {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.88;
    utter.pitch = 1.05;
    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      (v.lang.startsWith('en-GB') || v.lang.startsWith('en-AU')) && !v.localService
    ) || voices.find(v => v.lang.startsWith('en')) || null;
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  },

  stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  },

  // ─── Speech-To-Text (Deepgram or Web Speech API fallback) ────────

  async transcribeAudio(audioBlob) {
    const apiKey = this.getDeepgramKey();

    if (!apiKey) {
      console.warn('No Deepgram key — using Web Speech API transcript fallback');
      return '__USE_LIVE_TRANSCRIPT__';
    }

    const response = await fetch(
      this.getStreamingUrl({ model: 'nova-2', smart_format: 'true', language: 'en', punctuate: 'true' }).replace('wss://api.deepgram.com/v1/listen', 'https://api.deepgram.com/v1/listen'),
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': audioBlob.type || 'audio/webm',
        },
        body: audioBlob,
      }
    );

    if (!response.ok) throw new Error(`Deepgram Error: ${response.status}`);
    const result = await response.json();
    return result.results?.channels[0]?.alternatives[0]?.transcript || '';
  },

  getDeepgramKey() {
    let apiKey = null;
    try {
      const settings = JSON.parse(localStorage.getItem('lexilearn_settings') || '{}');
      apiKey = settings.deepgramApiKey;
    } catch (e) {}
    if (!apiKey) apiKey = import.meta.env?.VITE_DEEPGRAM_API_KEY;
    return apiKey;
  },

  getStreamingUrl(options = {}) {
    const params = new URLSearchParams({
      model: options.model || 'nova-3',
      smart_format: options.smart_format || 'true',
      language: options.language || 'en',
      punctuate: options.punctuate || 'true',
      interim_results: options.interim_results || 'true',
      encoding: options.encoding || 'linear16',
      sample_rate: options.sample_rate || '16000',
      filler_words: 'true',
      multichannel: 'false'
    });
    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  },

  // ─── Stage 0: The Gatekeeper (Relevance Check) ────────────────────

  /**
   * Check if the student's transcript is relevant to the question.
   * Returns: { is_relevant: boolean, relevance_score: number, warning?: string }
   */
  async checkRelevance(questionText, transcript) {
    try {
      // Tier 1: Vector Similarity (Fast & Cheap)
      const [qVec, aVec] = await Promise.all([
        getEmbedding(questionText),
        getEmbedding(transcript)
      ]);
      
      const similarity = cosineSimilarity(qVec, aVec);
      
      // Clear Pass: Above 0.6
      if (similarity > 0.6) {
        return { 
          is_relevant: true, 
          relevance_score: Math.round(similarity * 100), 
          status: 'on-topic', 
          feedback_vn: 'Câu trả lời rất đúng trọng tâm.' 
        };
      }
      
      // Clear Fail: Below 0.4
      if (similarity < 0.4) {
        return { 
          is_relevant: false, 
          relevance_score: Math.round(similarity * 100), 
          status: 'off-topic', 
          feedback_vn: 'Câu trả lời dường như không liên quan đến câu hỏi. Vui lòng tập trung vào chủ đề bài học.' 
        };
      }

      // Tier 2: LLM Fallback (Groq - Uncertain range 0.4 - 0.6)
      const prompt = `You are an IELTS Speaking "Gatekeeper". 
Question: "${questionText}"
Candidate Answer: "${transcript}"
Vector Similarity Score: ${Math.round(similarity * 100)}%

Judge if this is relevant enough to proceed with IELTS grading.
Return JSON ONLY:
{
  "relevance_score": <1-100>,
  "is_relevant": <true/false>,
  "status": "<on-topic|off-topic>",
  "feedback_vn": "<Brief explanation in Vietnamese>"
}`;

      return await aiGateway.callAI('answer_validation', prompt, {
        temperature: 0.1,
        maxTokens: 150,
        jsonMode: true
      });
    } catch (err) {
      console.warn('Gatekeeper fallback to basic check:', err);
      return { is_relevant: true, relevance_score: 100, status: 'on-topic', feedback_vn: 'Hệ thống đang bận, bỏ qua bước kiểm tra.' };
    }
  },

  // ─── Dual Evaluation: Azure Speech + DeepSeek ────────────────────

  /**
   * Run Azure pronunciation assessment + DeepSeek grammar/vocab in parallel.
   * Azure provides: Pronunciation (accuracy), Fluency, Prosody
   * DeepSeek provides: Lexical Resource, Grammar Range & Accuracy
   */
  async evaluateWithAzure(questionText, transcript, audioBlob, part = 1) {
    const [azureResult, deepseekResult] = await Promise.allSettled([
      assessPronunciation(audioBlob, transcript),
      this.evaluateLexicalGrammar(questionText, transcript, part)
    ]);

    const azure = azureResult.status === 'fulfilled' ? azureResult.value : null;
    const deepseek = deepseekResult.status === 'fulfilled' ? deepseekResult.value : null;

    if (!azure && !deepseek) {
      throw new Error('Both Azure and DeepSeek evaluations failed.');
    }

    if (azure) console.log('[Azure] Scores:', azure.accuracyScore, azure.fluencyScore, azure.prosodyScore);
    if (!azure) console.warn('[Azure] Failed, using DeepSeek fallback for all scores');

    return {
      pronunciation_score: azure?.combinedPronunciationBand ?? deepseek?.pronunciation_score ?? 5.0,
      fluency_score: azure?.ieltsFluency ?? deepseek?.fluency_score ?? 5.0,
      lexical_score: deepseek?.lexical_score ?? 5.0,
      grammar_score: deepseek?.grammar_score ?? 5.0,
      prosody_score: azure?.ieltsProsody ?? null,
      azure_scores: azure ? {
        accuracy: azure.accuracyScore,
        fluency: azure.fluencyScore,
        prosody: azure.prosodyScore,
        completeness: azure.completenessScore,
        pronScore: azure.pronScore
      } : null,
      azure_words: azure?.words || [],
      overall_band: this._calcOverallBand(
        azure?.combinedPronunciationBand ?? deepseek?.pronunciation_score ?? 5.0,
        azure?.ieltsFluency ?? deepseek?.fluency_score ?? 5.0,
        deepseek?.lexical_score ?? 5.0,
        deepseek?.grammar_score ?? 5.0
      ),
      strengths: deepseek?.strengths || [],
      weaknesses: deepseek?.weaknesses || [],
      suggestions: deepseek?.suggestions || [],
      vocab_used: deepseek?.vocab_used || [],
      criteria_feedback: (() => {
        const cf = deepseek?.criteria_feedback || {};
        // Enhance pronunciation reasoning with Azure prosody data if available
        if (azure && azure.prosodyScore != null && cf.pronunciation) {
          const prosodyComment = `\n\n**Nhịp điệu & Trọng âm (Prosody):** Bạn đạt ${azure.prosodyScore}/100 điểm kỹ thuật từ Azure. ${
            azure.prosodyScore >= 70 ? 'Cách ngắt nghỉ và nhấn trọng âm của bạn khá tự nhiên.' : 'Bạn cần chú ý hơn đến việc nhấn trọng từ và lên xuống giọng ở cuối câu để tăng tính bản ngữ.'
          }`;
          cf.pronunciation.reasoning += prosodyComment;
        }
        return cf;
      })(),
      improved_sample_answer: deepseek?.improved_sample_answer || '',
      _sources: {
        pronunciation: azure ? 'Azure Speech' : 'DeepSeek (fallback)',
        lexical_grammar: deepseek ? 'DeepSeek' : 'N/A'
      }
    };
  },

  /**
   * DeepSeek-only: Lexical Resource + Grammar (pronunciation handled by Azure)
   */
  async evaluateLexicalGrammar(questionText, transcript, part = 1) {
    const partContext = {
      1: 'IELTS Speaking Part 1 — short familiar topics',
      2: 'IELTS Speaking Part 2 — long turn Cue Card',
      3: 'IELTS Speaking Part 3 — abstract discussion',
    }[part] || 'IELTS Speaking';

    const expertPhrases = JSON.stringify(SPEAKING_PHRASES, null, 2);

    const prompt = `You are a STRICT IELTS Speaking Examiner with 15+ years of experience.
You are evaluating a candidate's response in ${partContext}.

## EVALUATION FRAMEWORK (4 CORE STAGES):
1. **Stage 1: Fluency and Coherence (FC)**
   - Check for **Signposting phrases** (e.g., "To kick things off", "On top of that", "Actually").
   - Check if they follow the **A.R.E.A** structure (Answer - Reason - Example - Alternative) or the **WHY-WHAT-HOW-WHEN-WHO** template.
   - Analyze speed, hesitation, and logic.

2. **Stage 2: Lexical Resource (LR)**
   - Check for **Topic-specific vocabulary**. (Example: Environment -> sustainability, carbon footprint).
   - Check for **Collocations & Idioms** (e.g., "over the moon", "contingent upon").
   - Penalize repetition and generic words (very good, happy).

3. **Stage 3: Grammatical Range & Accuracy (GRA)**
   - Check for **Sentence complexity** (Complex vs Simple sentences).
   - Check for **Tense accuracy** (e.g., Part 2 story should use Past Tenses).
   - Identify systematic errors.

4. **Stage 4: Pronunciation (P)** 
   - (Note: Technical scores are handled by Azure, but you must provide linguistic reasoning based on word choices and clarity in the transcript).

## KNOWLEDGE BASE (USE THESE STRATEGIES & PHRASES):
${expertPhrases}

## QUESTION: "${questionText}"
## CANDIDATE TRANSCRIPT: "${transcript}"

## RESPONSE REQUIREMENTS:
- Use **VIETNAMESE** for reasoning and general feedback.
- Use **ENGLISH** for specific quotes, error corrections, and suggested phrases.
- Be STRICT and professional.

Return ONLY valid JSON:
{
  "fluency_score": <number 0-9 with 0.5 steps>,
  "lexical_score": <number 0-9 with 0.5 steps>,
  "grammar_score": <number 0-9 with 0.5 steps>,
  "pronunciation_score": <number 0-9 with 0.5 steps>,
  "criteria_feedback": {
    "fluency": { 
      "reasoning": "Giải thích bằng tiếng Việt về Signposting, AREA structure và độ trôi chảy. TRÍCH DẪN lỗi bằng tiếng Anh.", 
      "errors": ["Specific moments of repetition or awkward pauses in English."]
    },
    "lexical": { 
      "reasoning": "Giải thích bằng tiếng Việt về Topic Vocabulary và Collocations. Gợi ý từ thay thế bằng tiếng Anh.", 
      "errors": ["Specific incorrect collocations or word choices in English."]
    },
    "grammar": { 
      "reasoning": "Giải thích lỗi thì (tenses) và cấu trúc bằng tiếng Việt. Sửa lại bằng tiếng Anh **in bold**.", 
      "errors": ["Specific tense, agreement, or structure errors in English."]
    },
    "pronunciation": { 
      "reasoning": "Giải thích bằng tiếng Việt về độ rõ ràng và nhịp điệu (intonation). Nhắc đến các **difficult words** bằng tiếng Anh.", 
      "errors": ["Potential mispronunciations in English."]
    }
  },
  "strengths": ["Điểm mạnh + Trích dẫn tiếng Anh"],
  "weaknesses": ["Lỗi sai + Trích dẫn tiếng Anh"],
  "suggestions": ["Lời khuyên + Gợi ý cấu trúc/từ vựng từ Knowledge Base"],
  "improved_sample_answer": "<A Band 8.0+ sample answer for this exact question using the provided strategies>"
}`;

    const aiResponse = await aiGateway.callAI('speaking_eval_full', prompt, {
      temperature: 0.15,
      maxTokens: 1024,
      jsonMode: true,
      systemPrompt: 'You are a strict IELTS Speaking Examiner. Provide REASONING in VIETNAMESE, but use ENGLISH for all keywords, quotes, errors, and linguistic suggestions.'
    });

    if (typeof aiResponse === 'string') {
      try {
        const match = aiResponse.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      } catch (e) {
        console.error('Failed to parse AI response:', aiResponse);
      }
    }
    return aiResponse;
  },

  _calcOverallBand(pron, fluency, lexical, grammar) {
    const avg = (pron + fluency + lexical + grammar) / 4;
    return Math.round(avg * 2) / 2;
  }
};
