/* ============================================
   LexiLearn — Azure Speech Service
   ============================================
   Handles audio conversion, upload, and Azure
   Speech Pronunciation Assessment via Flask backend.
*/

const BACKEND_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') 
  ? `http://${window.location.hostname}:5005` 
  : 'http://localhost:5005';

/**
 * Convert audio blob to WAV format (PCM 16kHz mono)
 * Azure Speech API works best with WAV PCM 16kHz
 */
async function blobToWavBase64(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Resample to 16kHz mono
  const targetRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * targetRate, targetRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampled = await offlineCtx.startRendering();
  const pcmData = resampled.getChannelData(0);

  // Build WAV file
  const wavBuffer = encodeWAV(pcmData, targetRate);
  const base64 = arrayBufferToBase64(wavBuffer);

  await audioCtx.close();
  return base64;
}

/**
 * Encode float PCM data to WAV format
 */
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples (float32 → int16)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Call Hybrid Speech Assessment (Deepgram + Azure) via backend proxy
 * @param {Blob} audioBlob - Recorded audio blob (webm/mp4/wav)
 * @returns {Promise<Object>} Assessment result with scores and phoneme-level data
 */
export async function assessPronunciation(audioBlob, transcript) {
  // Convert to WAV base64
  const audioBase64 = await blobToWavBase64(audioBlob);

  const response = await fetch(`${BACKEND_URL}/api/azure-speech-assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      referenceText: transcript || null
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Azure Speech error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Azure] Assessment success:', data.pronScore);
  
  if (!data.words || data.words.length === 0) {
    console.warn('[Azure] Assessment returned success but empty words array.');
  }

  // Map Azure scores (0-100) to IELTS band (0-9)
  return {
    ...data,
    ieltsAccuracy: mapToIELTS(data.accuracyScore),
    ieltsFluency: mapToIELTS(data.fluencyScore),
    ieltsProsody: mapToIELTS(data.prosodyScore),
    ieltsCompleteness: mapToIELTS(data.completenessScore),
    // New combined band for Pronunciation
    combinedPronunciationBand: calculateCombinedPronBand(data.accuracyScore, data.prosodyScore)
  };
}

/**
 * Combined logic for Pronunciation Band (Accuracy + Prosody)
 * Factors in weighted average and strict penalties for rhythm failure.
 */
function calculateCombinedPronBand(accuracy, prosody) {
  // Weighted Average: 70% accuracy, 30% prosody (rhythm/stress)
  const weightedScore = (accuracy * 0.7) + (prosody * 0.3);
  let band = mapToIELTS(weightedScore);

  // Penalty: If Prosody is very low (< 30), Cap the band at 6.0
  if (prosody < 30 && band > 6.0) {
    band = 6.0;
  }
  
  return band;
}

/**
 * Map a 0-100 Azure score to 0-9 IELTS band, rounded to nearest 0.5
 */
function mapToIELTS(score) {
  // Stricter Non-linear mapping
  if (score >= 95) return 9.0;
  if (score >= 90) return 8.5;
  if (score >= 85) return 8.0;
  if (score >= 80) return 7.5;
  if (score >= 75) return 7.0;
  if (score >= 68) return 6.5;
  if (score >= 60) return 6.0;
  if (score >= 52) return 5.5;
  if (score >= 45) return 5.0;
  if (score >= 35) return 4.0;
  return 3.0;
}

/**
 * Get color class for word-level accuracy
 * @param {number} score - Accuracy score (0-100)
 * @returns {{ color: string, bg: string, label: string }}
 */
export function getWordColor(score) {
  if (score >= 80) return { color: '#16a34a', bg: '#dcfce7', label: 'Good' };
  if (score >= 60) return { color: '#f97316', bg: '#fff7ed', label: 'Fair' };
  return { color: '#ef4444', bg: '#fee2e2', label: 'Needs work' };
}

/**
 * Render word-level pronunciation highlights as HTML, including Phoneme errors
 * @param {Array} words - Array of { word, accuracyScore, errorType, phonemes }
 * @returns {string} HTML string with colored words
 */
export function renderWordHighlights(words) {
  if (!words || !words.length) return '';

  return words.map(w => {
    const { color, bg } = getWordColor(w.accuracyScore);
    const errorBadge = w.errorType && w.errorType !== 'None'
      ? `<span style="font-size:0.55rem;font-weight:800;color:${color};margin-left:2px;vertical-align:super;">${w.errorType}</span>`
      : '';
      
    // Format phonemes if any are bad
    let badPhonemes = '';
    if (w.phonemes && w.phonemes.length > 0) {
      const issues = w.phonemes.filter(p => p.accuracyScore < 80);
      if (issues.length > 0) {
        badPhonemes = `<div style="font-size:0.65rem; color:#ef4444; margin-top:4px; line-height:1.2; font-weight:600;">
          Lỗi âm: ${issues.map(p => `/${p.phoneme}/`).join(', ')}
        </div>`;
      }
    }

    return `<span style="
      display:inline-block;padding:5px 10px;margin:3px;border-radius:10px;
      background:${bg};color:${color};font-weight:700;font-size:0.95rem;
      border:1px solid ${color}25;cursor:default;transition:all 0.2s;
      vertical-align:top;
    " title="Accuracy: ${w.accuracyScore}%">
      <div>${w.word}${errorBadge}</div>
      ${badPhonemes}
    </span>`;
  }).join(' ');
}
