import { escapeHtml } from '../../utils/helpers.js';
import { speakingService } from '../../services/speaking.service.js';
import { showToast } from '../../components/Toast.js';
import { getCurrentUser, supabaseFetch, supabaseSave } from '../../utils/supabase.js';
import { renderIcon } from '../../utils/icons.js';
import { renderWordHighlights } from '../../services/azure-speech.service.js';
import { SPEAKING_PHRASES } from '../../data/speaking_phrases.js';

/**
 * speaking_practice_optimized.js
 * 
 * A comprehensive, single-file module for the Speaking Mode.
 * This file handles state, UI rendering, speech recognition, and evaluation logic.
 */

export async function renderSpeakingPractice(container, opts = {}) {
  if (typeof container === 'string') container = document.querySelector(container);
  if (!container) return;

  const onBack = opts.onBack || null;

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────
  const state = {
    view: 'input', // 'input', 'practice', 'finish'
    sessionTitle: 'Speaking Practice ' + new Date().toLocaleDateString('en-GB'),
    questions: [],
    activeIndex: 0,
    currentSessionId: null,
    pastSessions: [],
    
    // Recording & Transcription
    recordState: 'idle', // 'idle', 'recording', 'processing', 'feedback'
    liveTranscript: '',
    interimTranscript: '',
    recordedBlob: null,
    stream: null,
    recognition: null,
    socket: null,
    socketActive: false,

    // UI State
    sessionsLoaded: false,
    expandedSidebarIdx: null,
    isFallback: false,
    keyHandler: null
  };

  // ─── CORE LOGIC (Integrated) ──────────────────────────────────────

  /**
   * Initialize Web Speech API for real-time visual feedback.
   * Note: Final evaluation uses the high-quality recording sent to Azure/Deepgram.
   */
  const initSpeechRecognition = () => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return null;

    const rec = new SpeechAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          state.liveTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      state.interimTranscript = interim;
      updateLiveTranscriptUI();
    };

    rec.onerror = (e) => {
      if (!['no-speech', 'aborted'].includes(e.error)) {
        console.warn('[STT Error]', e.error);
      }
    };

    return rec;
  };

  const updateLiveTranscriptUI = () => {
    const el = document.getElementById('sp-live-transcript');
    if (!el) return;
    
    const text = (state.liveTranscript + state.interimTranscript).trim();
    el.textContent = text || '';
    el.setAttribute('data-text', text);
    el.scrollTop = el.scrollHeight;
  };

  /**
   * Start recording audio and transcription
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.stream = stream;
      state.recordState = 'recording';
      state.liveTranscript = '';
      state.interimTranscript = '';
      
      // 1. Start Visual STT
      if (!state.recognition) state.recognition = initSpeechRecognition();
      if (state.recognition) state.recognition.start();

      // 2. Start Audio Capture for Evaluation
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        state.recordedBlob = new Blob(chunks, { type: 'audio/webm' });
        processRecording();
      };
      
      state.recorder = mediaRecorder;
      mediaRecorder.start();
      
      renderPracticeView();
    } catch (err) {
      showToast('Không thể truy cập microphone.', 'error');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (state.recordState !== 'recording') return;
    
    if (state.recorder) state.recorder.stop();
    if (state.recognition) {
       try { state.recognition.stop(); } catch(e) {}
    }
    if (state.stream) state.stream.getTracks().forEach(t => t.stop());
    
    state.recordState = 'processing';
    renderPracticeView();
  };

  /**
   * Send recording to AI for evaluation
   */
  const processRecording = async () => {
    const q = state.questions[state.activeIndex];
    const transcript = state.liveTranscript.trim() || 'No transcript available';

    try {
      // We use the speakingService for the heavy evaluation logic to maintain backend compatibility,
      // but we wrap it in our UI state management.
      const feedback = await speakingService.evaluateWithAzure(
        q.text, 
        transcript, 
        state.recordedBlob, 
        q.part
      );

      // Save to database
      const user = getCurrentUser();
      await speakingService.saveAnswer({
        question_id: q.db_id,
        user_id: user.id,
        student_transcript: transcript,
        fluency_score: feedback.fluency_score,
        lexical_score: feedback.lexical_score,
        grammar_score: feedback.grammar_score,
        pronunciation_score: feedback.pronunciation_score,
        overall_band: feedback.overall_band,
        feedback_json: feedback
      });

      q.status = 'answered';
      q.feedback = feedback;
      state.recordState = 'feedback';
      renderPracticeView();
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi phân tích câu trả lời: ' + err.message, 'error');
      state.recordState = 'idle';
      renderPracticeView();
    }
  };

  // ─── UI RENDERERS ─────────────────────────────────────────────────

  const renderInputView = () => {
    cleanup();
    container.innerHTML = `
      ${getGlobalStyles()}
      <div class="sp-container animate-fade-in-up">
        <header class="sp-header">
          <div class="sp-header-title">
            <span class="sp-icon-box orange">${renderIcon('mic', 24)}</span>
            <div>
              <h1>IELTS Speaking Coach</h1>
              <p>Practice with AI Examiner & get instant band 9.0 feedback</p>
            </div>
          </div>
          ${onBack ? `<button id="btn-sp-back" class="sp-btn-outline">${renderIcon('arrowLeft', 16)} Back</button>` : ''}
        </header>

        <main class="sp-input-grid">
          <section class="sp-card sp-setup-card">
            <div class="sp-card-body">
              <div class="sp-form-group">
                <label>Session Title</label>
                <input type="text" id="sp-session-title" placeholder="e.g., Daily Practice" value="${escapeHtml(state.sessionTitle)}" />
              </div>
              <div class="sp-form-group">
                <label>Target Questions</label>
                <textarea id="sp-question-input" placeholder="Paste your IELTS questions here, one per line...">${escapeHtml(state.questionInput || '')}</textarea>
                <div class="sp-input-hint">
                  ${renderIcon('info', 12)} Tip: AI auto-detects Part 1, 2, or 3 based on content.
                </div>
              </div>
              <div class="sp-actions">
                <button id="btn-start-practice" class="sp-btn-primary">
                  Start Session Now ${renderIcon('play', 18)}
                </button>
              </div>
            </div>
          </section>

          <section class="sp-history-section">
            <div class="sp-section-heading">
              <h3>${renderIcon('history', 16)} Recent Activity</h3>
            </div>
            <div id="sp-sessions-list" class="sp-sessions-list">
              <div class="sp-loading-shimmer" style="height: 100px; border-radius: 20px;"></div>
            </div>
          </section>
        </main>
      </div>
    `;

    attachInputEvents();
    loadPastSessions();
  };

  const renderPracticeView = () => {
    const q = state.questions[state.activeIndex];
    if (!q) return renderInputView();

    const progress = ((state.activeIndex + 1) / state.questions.length) * 100;
    const rs = state.recordState;
    const partName = q.part === 2 ? 'Long Turn (Part 2)' : (q.part === 3 ? 'Discussion (Part 3)' : 'Introduction (Part 1)');

    container.innerHTML = `
      ${getGlobalStyles()}
      <div class="sp-practice-layout animate-fade-in">
        <aside class="sp-sidebar">
          <div class="sp-sidebar-header">
            <button id="btn-exit" class="sp-btn-back">${renderIcon('chevronLeft', 16)} Exit</button>
            <div class="sp-progress-mini">
              <div class="sp-progress-bar"><div class="sp-progress-fill" style="width: ${progress}%"></div></div>
              <span>${state.activeIndex + 1}/${state.questions.length}</span>
            </div>
          </div>
          
          <div class="sp-session-progress">
            <h4>SESSION PROGRESS</h4>
            <div class="sp-question-nodes">
              ${state.questions.map((item, idx) => `
                <div class="sp-q-node ${idx === state.activeIndex ? 'active' : ''} ${item.feedback ? 'done' : ''}" data-idx="${idx}">
                  <span class="sp-q-num">${idx + 1}</span>
                  <div class="sp-q-info">
                    <p class="truncate">${escapeHtml(item.text)}</p>
                    ${item.feedback ? `<span class="sp-node-band">Band ${item.feedback.overall_band}</span>` : '<span class="sp-node-status">Pending</span>'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>

        <main class="sp-content">
          <div class="sp-question-card glass animate-fade-in-up">
            <div class="sp-q-header">
              <span class="sp-badge part-${q.part}">${partName}</span>
              <button id="btn-tts" class="sp-btn-icon" title="Speak question">${renderIcon('volume2', 20)}</button>
            </div>
            
            <h2 class="sp-active-question">"${escapeHtml(q.text)}"</h2>

            <div class="sp-interaction-zone">
              ${rs === 'idle' ? `
                <div class="sp-state-idle">
                  <div class="sp-instruction">Ready to speak? Click the mic or press Space.</div>
                  <button id="btn-record" class="sp-mic-btn idle">
                    ${renderIcon('mic', 36)}
                    <span class="sp-btn-hint">SPACE</span>
                  </button>
                </div>
              ` : ''}

              ${rs === 'recording' ? `
                <div class="sp-state-recording">
                  <div class="sp-live-transcript-container">
                    <div class="sp-stt-label">LIVE TRANSCRIPT (STT)</div>
                    <div id="sp-live-transcript" class="sp-live-transcript" data-placeholder="Listening carefully..."></div>
                  </div>
                  <div class="sp-record-pulse">
                    <div class="pulse-ring"></div>
                    <button id="btn-stop" class="sp-mic-btn active">
                      <div class="sp-stop-square"></div>
                    </button>
                  </div>
                  <div class="sp-status-text">Recording... Press Enter or Space to finish</div>
                </div>
              ` : ''}

              ${rs === 'processing' ? `
                <div class="sp-state-processing">
                  <div class="sp-ai-loader">
                    <div class="wave"></div><div class="wave"></div><div class="wave"></div>
                  </div>
                  <h3>AI Examiner is evaluating...</h3>
                  <p>Analyzing pronunciation, grammar, and lexical range.</p>
                </div>
              ` : ''}

              ${rs === 'feedback' ? `
                <div class="sp-state-feedback animate-fade-in">
                   ${renderFeedback(q.feedback)}
                   <div class="sp-practice-actions">
                     <button id="btn-retry" class="sp-btn-outline">Retry Answer</button>
                     <button id="btn-next" class="sp-btn-primary">
                       ${state.activeIndex < state.questions.length - 1 ? 'Next Question' : 'Complete Session'} ${renderIcon('chevronRight', 16)}
                     </button>
                   </div>
                </div>
              ` : ''}
            </div>
          </div>
        </main>
      </div>
    `;

    attachPracticeEvents();
    if (rs === 'idle') {
      setTimeout(() => speakingService.speakText(q.text), 500);
    }
  };

  const renderFeedback = (fb) => {
    if (!fb) return '';
    return `
      <div class="sp-feedback-grid">
        <div class="sp-score-circle-wrapper">
          <div class="sp-score-circle" style="--score: ${fb.overall_band * 10}%">
            <span class="sp-score-val">${fb.overall_band}</span>
            <span class="sp-score-lbl">OVERALL</span>
          </div>
          <div class="sp-score-breakdown">
             <div class="sp-score-item"><span>Fluency</span> <strong>${fb.fluency_score}</strong></div>
             <div class="sp-score-item"><span>Lexical</span> <strong>${fb.lexical_score}</strong></div>
             <div class="sp-score-item"><span>Grammar</span> <strong>${fb.grammar_score}</strong></div>
             <div class="sp-score-item"><span>Pronun.</span> <strong>${fb.pronunciation_score}</strong></div>
          </div>
        </div>

        <div class="sp-feedback-content">
          <div class="sp-tab-container">
            <div class="sp-tabs">
              <button class="sp-tab active" data-tab="analysis">Feedback</button>
              <button class="sp-tab" data-tab="vocabulary">Vocabulary</button>
              <button class="sp-tab" data-tab="sample">Model Answer</button>
            </div>
            
            <div class="sp-tab-panes">
              <div class="sp-pane active" id="pane-analysis">
                <div class="sp-feedback-scroll">
                  <div class="sp-transcript-review">
                    <h5>Your Transcript</h5>
                    <p>${fb.azure_words && fb.azure_words.length > 0 ? renderWordHighlights(fb.azure_words) : escapeHtml(fb.transcript)}</p>
                  </div>
                  <div class="sp-criteria-list">
                    ${Object.entries(fb.criteria_feedback || {}).map(([key, val]) => `
                      <div class="sp-criterion">
                        <h6 class="capitalize">${key}</h6>
                        <p>${val.reasoning || val}</p>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div class="sp-pane" id="pane-vocabulary">
                <div class="sp-vocab-list">
                  ${fb.vocab_used && fb.vocab_used.length > 0 ? fb.vocab_used.map(v => `
                    <div class="sp-vocab-tag">
                      <span class="term">${v.term}</span>
                      <span class="def">${v.context || ''}</span>
                    </div>
                  `).join('') : '<p class="text-slate-400">No advanced vocabulary detected.</p>'}
                </div>
              </div>

              <div class="sp-pane" id="pane-sample">
                <div class="sp-sample-answer">
                  <p>${fb.improved_sample_answer || 'Sample answer not generated.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ─── HELPERS & UTILITIES ──────────────────────────────────────────

  const loadPastSessions = async () => {
    const user = getCurrentUser();
    if (!user) return;
    try {
      state.pastSessions = await speakingService.getUserSessions(user.id);
      renderSessionsList();
    } catch (e) { console.error(e); }
  };

  const renderSessionsList = () => {
    const listEl = document.getElementById('sp-sessions-list');
    if (!listEl) return;

    if (state.pastSessions.length === 0) {
      listEl.innerHTML = `<div class="sp-empty-state">No past sessions found. Start your first one!</div>`;
      return;
    }

    listEl.innerHTML = state.pastSessions.map(s => `
      <div class="sp-session-card animate-fade-in" data-id="${s.id}">
        <div class="sp-session-info">
          <h6>${escapeHtml(s.title)}</h6>
          <span>${renderIcon('calendar', 10)} ${new Date(s.created_at).toLocaleDateString()}</span>
        </div>
        <div class="sp-session-meta">
           <button class="btn-delete-session" data-id="${s.id}">${renderIcon('trash', 14)}</button>
           ${renderIcon('chevronRight', 16)}
        </div>
      </div>
    `).join('');

    // Attach list events
    listEl.querySelectorAll('.sp-session-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-delete-session')) return;
        loadSessionDetails(card.dataset.id, card.querySelector('h6').textContent);
      }
    });

    listEl.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Delete this session permanently?')) {
          await speakingService.deleteSession(btn.dataset.id);
          loadPastSessions();
        }
      };
    });
  };

  const loadSessionDetails = async (id, title) => {
    showToast('Loading session data...', 'info');
    try {
      const user = getCurrentUser();
      const questions = await speakingService.getSessionQuestionsWithAnswers(id, user.id);
      
      state.questions = questions.map(q => ({
        id: 'q_' + q.id,
        db_id: q.id,
        text: q.question_text,
        part: q.part,
        status: q.answer ? 'answered' : 'pending',
        feedback: q.answer ? q.answer.feedback_json : null
      }));
      
      state.currentSessionId = id;
      state.sessionTitle = title;
      state.activeIndex = 0;
      state.view = 'practice';
      state.recordState = 'idle';
      render();
    } catch (err) {
      showToast('Error loading session.', 'error');
    }
  };

  const attachInputEvents = () => {
    const btn = document.getElementById('btn-start-practice');
    if (!btn) return;

    btn.onclick = async () => {
      const title = document.getElementById('sp-session-title').value.trim();
      const raw = document.getElementById('sp-question-input').value.trim();
      if (!raw) return showToast('Please enter at least one question.', 'warning');

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> Initializing...`;

      const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      state.questions = lines.map((text, i) => {
        let part = 1;
        const lower = text.toLowerCase();
        if (lower.includes('part 2') || lower.includes('describe a') || lower.includes('describe an')) part = 2;
        if (lower.includes('part 3')) part = 3;
        const cleanText = text.replace(/^(\d+[.):\-]\s*|part\s*\d+:?\s*)/i, '').trim() || text;
        return { text: cleanText, part, status: 'pending' };
      });

      try {
        const user = getCurrentUser();
        const session = await speakingService.createSession(user.id, title || state.sessionTitle);
        state.currentSessionId = session.id;
        const savedQs = await speakingService.addQuestions(session.id, state.questions);
        
        state.questions = state.questions.map((q, i) => ({ 
          ...q, 
          db_id: savedQs[i]?.id,
          id: 'q_' + (savedQs[i]?.id || Date.now() + i)
        }));

        state.view = 'practice';
        state.activeIndex = 0;
        state.recordState = 'idle';
        render();
      } catch (err) {
        showToast('Failed to start session.', 'error');
        btn.disabled = false;
        btn.textContent = 'Start Session Now';
      }
    };

    const backBtn = document.getElementById('btn-sp-back');
    if (backBtn) backBtn.onclick = onBack;
  };

  const attachPracticeEvents = () => {
    // Record Button
    const recBtn = document.getElementById('btn-record');
    if (recBtn) recBtn.onclick = startRecording;

    const stopBtn = document.getElementById('btn-stop');
    if (stopBtn) stopBtn.onclick = stopRecording;

    // TTS
    const ttsBtn = document.getElementById('btn-tts');
    if (ttsBtn) ttsBtn.onclick = () => speakingService.speakText(state.questions[state.activeIndex].text);

    // Feedback Controls
    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) retryBtn.onclick = () => {
      state.recordState = 'idle';
      renderPracticeView();
    };

    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.onclick = () => {
      if (state.activeIndex < state.questions.length - 1) {
        state.activeIndex++;
        state.recordState = 'idle';
        renderPracticeView();
      } else {
        state.view = 'finish';
        renderFinalView();
      }
    };

    // Tabs
    container.querySelectorAll('.sp-tab').forEach(tab => {
      tab.onclick = () => {
        container.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.sp-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`pane-${tab.dataset.tab}`).classList.add('active');
      };
    });

    // Exit
    const exitBtn = document.getElementById('btn-exit');
    if (exitBtn) exitBtn.onclick = () => {
      if (confirm('Exit practice session? Progress is saved.')) {
        state.view = 'input';
        render();
      }
    };

    // Keyboard
    if (!state.keyHandler) {
      state.keyHandler = (e) => {
        if (state.view !== 'practice') return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.code === 'Space') {
          e.preventDefault();
          if (state.recordState === 'idle') startRecording();
          else if (state.recordState === 'recording') stopRecording();
        } else if (e.code === 'Enter' && state.recordState === 'recording') {
          e.preventDefault();
          stopRecording();
        }
      };
      document.addEventListener('keydown', state.keyHandler);
    }
  };

  const renderFinalView = () => {
    cleanup();
    const avgBand = (state.questions.reduce((acc, q) => acc + (q.feedback?.overall_band || 0), 0) / state.questions.length).toFixed(1);
    
    container.innerHTML = `
      ${getGlobalStyles()}
      <div class="sp-final-view animate-fade-in-up">
        <div class="sp-success-card glass">
          <div class="sp-confetti">✨</div>
          <h1>Session Complete!</h1>
          <p>You've completed ${state.questions.length} IELTS Practice questions.</p>
          
          <div class="sp-final-stats">
            <div class="sp-stat">
              <span class="val">${avgBand}</span>
              <span class="lbl">Estimated Band</span>
            </div>
          </div>

          <div class="sp-actions">
            <button id="btn-done" class="sp-btn-primary">Finish & Close</button>
            <button id="btn-restart" class="sp-btn-outline">Practice More</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-done').onclick = () => {
       if (onBack) onBack(); else { state.view = 'input'; render(); }
    };
    document.getElementById('btn-restart').onclick = () => {
       state.view = 'input';
       render();
    };
  };

  const cleanup = () => {
    if (state.keyHandler) {
      document.removeEventListener('keydown', state.keyHandler);
      state.keyHandler = null;
    }
    speakingService.stopSpeaking();
    if (state.stream) state.stream.getTracks().forEach(t => t.stop());
    if (state.recognition) { try { state.recognition.stop(); } catch(e) {} }
  };

  const render = () => {
    if (state.view === 'input') renderInputView();
    else if (state.view === 'practice') renderPracticeView();
    else if (state.view === 'finish') renderFinalView();
  };

  function getGlobalStyles() {
    return `
      <style>
        :root {
          --sp-primary: #f97316;
          --sp-primary-hover: #ea580c;
          --sp-bg: #f8fafc;
          --sp-card-bg: #ffffff;
          --sp-text: #0f172a;
          --sp-text-muted: #64748b;
          --sp-glass: rgba(255, 255, 255, 0.7);
        }

        .sp-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', system-ui, sans-serif; height: 100%; }
        
        .sp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .sp-header-title { display: flex; gap: 20px; align-items: center; }
        .sp-header h1 { font-size: 2.25rem; font-weight: 900; color: var(--sp-text); letter-spacing: -0.025em; border: none; padding:0; margin:0; }
        .sp-header p { font-size: 1rem; color: var(--sp-text-muted); margin-top: 4px; font-weight: 500; }
        
        .sp-icon-box { 
          width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .sp-icon-box.orange { background: linear-gradient(135deg, #fb923c, #f97316); color: white; }

        .sp-input-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 32px; }
        @media (max-width: 900px) { .sp-input-grid { grid-template-columns: 1fr; } }

        .sp-card { background: var(--sp-card-bg); border: 1.5px solid #e2e8f0; border-radius: 32px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05); }
        .sp-card-body { padding: 40px; }

        .sp-form-group { margin-bottom: 24px; }
        .sp-form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .sp-form-group input, .sp-form-group textarea {
          width: 100%; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 16px; 
          font-size: 0.95rem; font-weight: 600; color: var(--sp-text); transition: all 0.2s; outline: none;
        }
        .sp-form-group input:focus, .sp-form-group textarea:focus { border-color: var(--sp-primary); background: #fff; box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }
        .sp-form-group textarea { height: 180px; resize: none; line-height: 1.6; }
        .sp-input-hint { font-size: 0.75rem; color: var(--sp-text-muted); margin-top: 10px; display: flex; align-items: center; gap: 6px; font-weight: 500; }

        .sp-btn-primary {
          background: linear-gradient(135deg, #f97316, #ef4444); color: white; padding: 18px 36px; border-radius: 18px;
          font-size: 1rem; font-weight: 800; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 12px;
          box-shadow: 0 8px 20px -4px rgba(249,115,22,0.4); transition: all 0.2s;
        }
        .sp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px -4px rgba(249,115,22,0.5); }
        .sp-btn-primary:active { transform: translateY(0); }
        .sp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .sp-btn-outline {
          background: #fff; border: 2px solid #e2e8f0; color: var(--sp-text-muted); padding: 14px 24px; border-radius: 16px;
          font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
        }
        .sp-btn-outline:hover { border-color: #cbd5e1; color: var(--sp-text); background: #f8fafc; }

        .sp-sessions-list { display: flex; flex-direction: column; gap: 12px; }
        .sp-session-card {
          background: white; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 16px 20px;
          display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s;
        }
        .sp-session-card:hover { border-color: var(--sp-primary); transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .sp-session-info h6 { font-size: 0.95rem; font-weight: 800; color: var(--sp-text); margin: 0; }
        .sp-session-info span { font-size: 0.75rem; color: var(--sp-text-muted); font-weight: 600; margin-top: 2px; display: block; }
        .sp-session-meta { display: flex; items-center; gap: 12px; color: #cbd5e1; }
        .btn-delete-session { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 4px; border-radius: 8px; transition: all 0.2s; }
        .btn-delete-session:hover { color: #ef4444; background: #fee2e2; }

        /* Practice View Layout */
        .sp-practice-layout { display: flex; height: calc(100vh - 40px); background: #f8fafc; position: fixed; inset: 0; z-index: 1000; overflow: hidden; }
        .sp-sidebar { width: 320px; background: white; border-right: 1.5px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; }
        .sp-content { flex: 1; padding: 40px; display: flex; items-center; justify-content: center; overflow-y: auto; background-image: radial-gradient(#e2e8f0 1.5px, transparent 1.5px); background-size: 32px 32px; }
        
        .sp-sidebar-header { padding: 32px 24px; border-bottom: 1px solid #f1f5f9; }
        .sp-btn-back { background: none; border: none; color: var(--sp-text-muted); font-size: 0.9rem; font-weight: 800; cursor: pointer; display: flex; items-center; gap: 6px; margin-bottom: 20px; padding: 0; }
        .sp-btn-back:hover { color: var(--sp-text); }
        .sp-progress-mini { display: flex; items-center; gap: 12px; }
        .sp-progress-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
        .sp-progress-fill { height: 100%; background: linear-gradient(90deg, #f97316, #ef4444); transition: width 0.3s; }
        .sp-progress-mini span { font-size: 0.75rem; font-weight: 800; color: var(--sp-text-muted); }

        .sp-session-progress { padding: 24px; flex: 1; overflow-y: auto; }
        .sp-session-progress h4 { font-size: 0.7rem; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 20px; }
        .sp-question-nodes { display: flex; flex-direction: column; gap: 12px; }
        .sp-q-node { padding: 12px; border-radius: 16px; border: 1.5px solid transparent; display: flex; gap: 14px; items-center; cursor: default; transition: all 0.2s; }
        .sp-q-node.active { border-color: var(--sp-primary); background: #fff7ed; }
        .sp-q-node.done { opacity: 0.8; }
        .sp-q-num { width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; display: flex; items-center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: #64748b; flex-shrink: 0; }
        .active .sp-q-num { background: var(--sp-primary); color: white; }
        .done .sp-q-num { background: #dcfce7; color: #16a34a; }
        .sp-q-info { flex: 1; min-width: 0; }
        .sp-q-info p { margin: 0; font-size: 0.85rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sp-node-band { font-size: 0.7rem; font-weight: 800; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 100px; margin-top: 4px; display: inline-block; }
        .sp-node-status { font-size: 0.7rem; font-weight: 600; color: #94a3b8; margin-top: 2px; display: block; }

        .sp-question-card { width: 100%; max-width: 800px; border-radius: 40px; padding: 48px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 50px -10px rgba(0,0,0,0.1); }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); }
        
        .sp-q-header { display: flex; justify-content: space-between; items-center; margin-bottom: 24px; }
        .sp-badge { font-size: 0.7rem; font-weight: 900; padding: 6px 14px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.05em; }
        .part-1 { background: #eff6ff; color: #2563eb; }
        .part-2 { background: #fff7ed; color: #ea580c; }
        .part-3 { background: #f5f3ff; color: #7c3aed; }
        
        .sp-active-question { font-size: 2.25rem; font-weight: 800; color: var(--sp-text); line-height: 1.2; letter-spacing: -0.03em; margin: 0 0 40px; text-align: center; }

        .sp-interaction-zone { min-height: 280px; display: flex; items-center; justify-content: center; }
        
        .sp-state-idle { text-align: center; }
        .sp-instruction { font-size: 0.9rem; color: var(--sp-text-muted); font-weight: 600; margin-bottom: 24px; }

        /* Mic Button */
        .sp-mic-btn { width: 100px; height: 100px; border-radius: 50%; border: none; cursor: pointer; position: relative; display: flex; items-center; justify-content: center; color: white; transition: all 0.3s; }
        .sp-mic-btn.idle { background: linear-gradient(135deg, #f97316, #ef4444); box-shadow: 0 10px 25px -5px rgba(249,115,22,0.4); }
        .sp-mic-btn.idle:hover { transform: scale(1.1); box-shadow: 0 15px 30px -5px rgba(249,115,22,0.5); }
        .sp-mic-btn.active { background: #ef4444; box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.4); animation: mic-pulse 2s infinite; }
        .sp-stop-square { width: 32px; height: 32px; background: white; border-radius: 6px; }
        @keyframes mic-pulse { 0% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 30px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); } }

        .sp-btn-hint { position: absolute; bottom: -32px; font-size: 0.65rem; font-weight: 900; background: #e2e8f0; color: #475569; padding: 3px 10px; border-radius: 6px; }

        /* Live Transcript Area */
        .sp-state-recording { width: 100%; display: flex; flex-direction: column; items-center; gap: 32px; }
        .sp-live-transcript-container { width: 100%; }
        .sp-stt-label { font-size: 0.6rem; font-weight: 900; color: var(--sp-primary); margin-bottom: 8px; text-align: center; }
        .sp-live-transcript {
          background: rgba(241, 245, 249, 0.5); border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px; min-height: 100px; max-height: 150px; overflow-y: auto;
          font-size: 1.1rem; font-weight: 500; font-style: italic; color: var(--sp-text); text-align: center; line-height: 1.6; position: relative;
        }
        .sp-live-transcript:empty::before { content: attr(data-placeholder); color: #94a3b8; }

        /* Evaluation View */
        .sp-state-feedback { width: 100%; }
        .sp-feedback-grid { display: grid; grid-template-columns: 240px 1fr; gap: 40px; }
        @media (max-width: 768px) { .sp-feedback-grid { grid-template-columns: 1fr; } }
        
        .sp-score-circle-wrapper { text-align: center; }
        .sp-score-circle {
          width: 160px; height: 160px; border-radius: 50%; border: 12px solid #f1f5f9; margin: 0 auto 24px;
          display: flex; flex-direction: column; items-center; justify-content: center; position: relative;
          background: white; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        .sp-score-circle::after {
          content: ''; position: absolute; inset: -12px; border-radius: 50%;
          border: 12px solid var(--sp-primary); border-top-color: transparent; border-right-color: transparent;
          transform: rotate(calc(var(--score) * 3.6deg)); transition: transform 1s ease-out;
        }
        .sp-score-val { font-size: 3rem; font-weight: 900; color: var(--sp-text); line-height: 1; }
        .sp-score-lbl { font-size: 0.7rem; font-weight: 900; color: var(--sp-text-muted); margin-top: 4px; }
        
        .sp-score-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sp-score-item { background: #f8fafc; padding: 8px; border-radius: 10px; font-size: 0.75rem; text-align: left; }
        .sp-score-item span { color: #64748b; font-weight: 600; display: block; }
        .sp-score-item strong { color: var(--sp-text); font-weight: 800; font-size: 0.9rem; }

        .sp-tab-container { background: white; border: 1.5px solid #f1f5f9; border-radius: 20px; overflow: hidden; height: 320px; display: flex; flex-direction: column; }
        .sp-tabs { display: flex; background: #f8fafc; padding: 6px; gap: 4px; }
        .sp-tab { flex: 1; border: none; background: none; padding: 10px; font-size: 0.75rem; font-weight: 800; color: #64748b; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .sp-tab.active { background: white; color: var(--sp-text); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        .sp-tab-panes { flex: 1; overflow: hidden; }
        .sp-pane { display: none; height: 100%; padding: 24px; overflow-y: auto; }
        .sp-pane.active { display: block; }
        
        .sp-feedback-scroll h5, .sp-vocab-list h5 { font-size: 0.7rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; }
        .sp-transcript-review p { font-size: 0.9rem; line-height: 1.6; color: #475569; font-style: italic; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
        .sp-criterion { margin-bottom: 20px; }
        .sp-criterion h6 { font-size: 0.85rem; font-weight: 800; color: var(--sp-text); margin: 0 0 6px; }
        .sp-criterion p { font-size: 0.85rem; color: #64748b; line-height: 1.6; margin: 0; }
        
        .sp-vocab-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .sp-vocab-tag { background: #f0f9ff; border: 1px solid #e0f2fe; padding: 10px 14px; border-radius: 14px; }
        .sp-vocab-tag .term { font-weight: 800; color: #0369a1; display: block; font-size: 0.9rem; }
        .sp-vocab-tag .def { font-size: 0.75rem; color: #7dd3fc; margin-top: 2px; }

        .sp-sample-answer p { font-size: 1rem; line-height: 1.7; color: #475569; font-weight: 500; }

        .sp-practice-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 32px; }

        /* Loader */
        .sp-ai-loader { display: flex; gap: 10px; margin-bottom: 24px; }
        .wave { width: 12px; height: 40px; background: linear-gradient(to bottom, #f97316, #ef4444); border-radius: 100px; animation: wave 1s infinite ease-in-out; }
        .wave:nth-child(2) { animation-delay: 0.1s; }
        .wave:nth-child(3) { animation-delay: 0.2s; }
        @keyframes wave { 0%, 100% { height: 40px; } 50% { height: 80px; } }

        /* Final View */
        .sp-final-view { position: fixed; inset: 0; background: var(--sp-bg); z-index: 2000; display: flex; items-center; justify-content: center; padding: 20px; }
        .sp-success-card { max-width: 500px; width: 100%; text-align: center; padding: 60px 40px; border-radius: 40px; border: 1.5px solid #e2e8f0; }
        .sp-confetti { font-size: 4rem; margin-bottom: 24px; }
        .sp-stat { display: flex; flex-direction: column; items-center; margin: 32px 0; }
        .sp-stat .val { font-size: 4.5rem; font-weight: 900; color: var(--sp-text); line-height: 1; }
        .sp-stat .lbl { font-size: 0.8rem; font-weight: 800; color: var(--sp-primary); text-transform: uppercase; letter-spacing: 0.1em; }
        
        .spinner-sm { border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%; width: 18px; height: 18px; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Animations */
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    `;
  }

  // Initial Render
  render();
}
