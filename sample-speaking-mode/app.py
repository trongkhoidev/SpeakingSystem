import os
import json
import base64
import io
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import google.generativeai as genai
import PIL.Image
import concurrent.futures
import azure.cognitiveservices.speech as speechsdk
from deepgram import DeepgramClient, PrerecordedOptions
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from the parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

def get_api_key():
    return os.environ.get("GEMINI_API_KEY")

def ocr_page_task(p_num, p_data):
    """Fallback OCR task using pytesseract."""
    try:
        import pytesseract
        img = PIL.Image.open(io.BytesIO(p_data))
        text = pytesseract.image_to_string(img)
        return p_num, text
    except Exception as e:
        return p_num, f"[OCR Error: {str(e)}]"

def split_into_tests(text):
    """
    Identifies test boundaries in a full book text.
    """
    import re
    # Look for "TEST 1", "TEST 2", etc.
    test_matches = list(re.finditer(r'(?i)TEST\s*[:#-]?\s*(\d+)', text))
    if not test_matches:
        return None
        
    tests_found = []
    for i in range(len(test_matches)):
        start_idx = test_matches[i].start()
        end_idx = test_matches[i+1].start() if i+1 < len(test_matches) else len(text)
        test_text = text[start_idx:end_idx]
        test_num = int(test_matches[i].group(1))
        tests_found.append({"test_num": test_num, "text": test_text})
            
    return tests_found

@app.route('/api/parse-cambridge', methods=['POST'])
def parse_cambridge():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file_bytes = request.files['file'].read()
        api_key = request.form.get('apiKey', get_api_key())
        
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = doc.page_count
        print(f"Processing PDF with {total_pages} pages...")

        full_text_parts = [None] * total_pages
        ocr_tasks = []

        # 1. Extraction / OCR pass
        for i in range(total_pages):
            page = doc[i]
            page_text = page.get_text().strip()
            if len(page_text) < 150:
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                ocr_tasks.append((i, pix.tobytes("png")))
            else:
                full_text_parts[i] = page_text

        if ocr_tasks:
            with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
                futures = {executor.submit(ocr_page_task, p_num, p_data): p_num for p_num, p_data in ocr_tasks}
                for future in concurrent.futures.as_completed(futures):
                    p_num, text = future.result()
                    full_text_parts[p_num] = text

        full_text = ""
        for i, text in enumerate(full_text_parts):
            full_text += f"\n--- Page {i + 1} ---\n{text or '[No content]'}"

        # 2. Split into tests and use AI for each
        tests_metadata = split_into_tests(full_text)
        if not tests_metadata:
             return jsonify({"error": "Could not identify any Tests in this PDF. Please ensure it is a standard Cambridge IELTS book."}), 400

        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", api_key))
        
        book_structure = {
            "title": f"Cambridge IELTS (Parsed)",
            "book_num": 0,
            "tests": []
        }
        
        # Try to find book number from full text
        import re
        book_num_match = re.search(r'(?i)IELTS\s*(\d+)', full_text[:5000])
        if book_num_match:
            book_structure["book_num"] = int(book_num_match.group(1))
            book_structure["title"] = f"Cambridge IELTS {book_structure['book_num']}"

        print(f"Identified {len(tests_metadata)} tests. Calling AI for each...")
        
        for t_meta in tests_metadata[:4]: # Max 4 tests per book
            print(f"Parsing Test {t_meta['test_num']} with AI...")
            test_prompt = f"""You are an IELTS expert. Parse this text from Test {t_meta['test_num']} of a Cambridge IELTS book. 
Identify:
1. All Reading Passages (usually 3).
2. For each passage, extract the full text.
3. For each passage, extract ALL questions (MCQs, TFNG, Matching, Fill-in-the-blanks).

Return ONLY valid JSON:
{{
  "title": "Test {t_meta['test_num']}",
  "test_num": {t_meta['test_num']},
  "sections": [
    {{
      "title": "Passage Title",
      "content": "Full passage text...",
      "questions": [
        {{
          "question_num": 1,
          "type": "mcq",
          "text": "The text states...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "A",
          "explanation": "Brief reason"
        }}
      ]
    }}
  ]
}}
Text for Test {t_meta['test_num']}:
{t_meta['text'][:40000]}"""

            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": test_prompt}],
                    response_format={"type": "json_object"}
                )
                res_json = response.choices[0].message.content
                test_data = json.loads(res_json.strip())
                book_structure["tests"].append(test_data)
            except Exception as ai_err:
                print(f"AI Error for Test {t_meta['test_num']}: {ai_err}")
                continue

        return jsonify(book_structure)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/parse-assignment-page', methods=['POST'])
def parse_assignment_page():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file_bytes = request.files['file'].read()
        page_num = int(request.form.get('pageNum', 1)) - 1 # 0-indexed internally
        api_key = request.form.get('apiKey', get_api_key())
        
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if page_num < 0 or page_num >= doc.page_count:
            return jsonify({"error": f"Invalid page number. Document has {doc.page_count} pages."}), 400
            
        page = doc[page_num]
        
        # 1. Render page to image
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # Zoom for better quality
        img_bytes = pix.tobytes("png")
        img = PIL.Image.open(io.BytesIO(img_bytes))
        
        # 2. Setup OpenAI
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", api_key))
        
        # Convert image to base64 for Vision
        import base64
        img_b64 = base64.b64encode(img_bytes).decode('utf-8')

        prompt = """You are an IELTS expert and structural analyzer. 
Analyze this page from a Cambridge IELTS book. 
Extract:
1. Passage Number (or title if any, usually Passage 1/2/3).
2. The full text of the passage (cleanly formatted, maintaining paragraphs).
3. The list of Questions.
4. Type of questions (Matching Headings, True/False/Not Given, Summary Completion, MCQs, etc.).

Return ONLY valid JSON with the following exact structure:
{
  "passage_title": "Passage Title",
  "passage_num": 1, 
  "content": "Full passage text...",
  "question_range": "1-13",
  "question_types": ["Matching Headings", "True/False/Not Given"],
  "questions": [
    {
      "question_num": 1,
      "type": "tfng",
      "text": "The text states that X happened.",
      "options": [],
      "correct_answer": "TRUE"
    }
  ]
}
Note: If correct answers are not explicitly on this page, leave correct_answer as null.
"""

        print(f"Calling OpenAI for page {page_num + 1}...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{img_b64}"}
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"}
        )
        res_json = response.choices[0].message.content
        return jsonify(json.loads(res_json.strip()))

    except Exception as e:
        print(f"Error parse_assignment_page: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ─── Azure Speech Pronunciation Assessment ──────────────────────────
import requests as http_requests

AZURE_SPEECH_KEY_GLOBAL = os.environ.get("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION_GLOBAL = os.environ.get("AZURE_SPEECH_REGION", "")
DEEPGRAM_API_KEY_GLOBAL = os.environ.get("DEEPGRAM_API_KEY", "")

from dotenv import dotenv_values
ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')

@app.route('/api/azure-speech-assess', methods=['POST'])
def azure_speech_assess():
    """
    Hybrid Speech Assessment:
      1. Deepgram (Nova-3) for accurate Reference Text
      2. Azure Speech SDK for precise Phoneme-level Pronunciation Assessment
    Expects JSON body:
      - audioBase64: base64-encoded audio data (wav/webm/ogg)
    Returns JSON with Accuracy, Fluency, Prosody, and word/phoneme details.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        audio_b64 = data.get('audioBase64')
        if not audio_b64:
            return jsonify({"error": "audioBase64 is required"}), 400

        # Create temporary file for SDKs to read from
        audio_bytes = base64.b64decode(audio_b64)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
            
        # Dynamically load env vars so we don't have to restart the backend if .env changes
        config = dotenv_values(ENV_PATH)
        azure_key = config.get("AZURE_SPEECH_KEY", AZURE_SPEECH_KEY_GLOBAL)
        azure_region = config.get("AZURE_SPEECH_REGION", AZURE_SPEECH_REGION_GLOBAL)
        deepgram_key = config.get("DEEPGRAM_API_KEY", DEEPGRAM_API_KEY_GLOBAL)
        
        if not azure_key or not azure_region:
            print("[Azure] Missing credentials in backend.")
            return jsonify({"error": "Azure credentials missing on server"}), 500

        try:
            reference_text = data.get('referenceText')
            
            if reference_text and reference_text.strip():
                print(f"[Azure API] Using frontend provided transcript: {reference_text}")
            else:
                # ─────────────────────────────────────────────────────────
                # STEP 1: Deepgram Contextual Transcription
                # ─────────────────────────────────────────────────────────
                client = DeepgramClient(deepgram_key)
                with open(temp_audio_path, "rb") as file:
                    buffer_data = file.read()
                    payload = {"buffer": buffer_data}
                    # Boost common IELTS and English vocabulary for intermediate learners
                    ielts_keywords = [
                        "IELTS:2", "hometown:1.5", "accommodation:1.5", "education", 
                        "technology", "environment", "travel", "fascinating",
                        "actually", "basically", "to be honest", "fond of:1.5",
                        "definitely", "absolutely", "in my opinion", "moreover"
                    ]
                    options = {
                        "model": "nova-3",
                        "smart_format": True,
                        "filler_words": True,
                        "utterances": True,
                        "punctuate": True,
                        "language": "en",
                        "keyterm": ielts_keywords
                    }
                    print(f"[Deepgram] Processing audio size: {len(buffer_data)} bytes...")
                    dg_response = client.listen.rest.v("1").transcribe_file(payload, options)
                
                res_dict = dg_response.to_dict() if hasattr(dg_response, 'to_dict') else dg_response
                try:
                    channels = res_dict['results']['channels']
                    reference_text = channels[0]['alternatives'][0]['transcript']
                except (KeyError, IndexError, TypeError):
                    return jsonify({"error": "Deepgram failed to transcribe audio correctly", "raw": res_dict}), 400

                print(f"[Deepgram] Reference Text: {reference_text}")

                if not reference_text.strip():
                    return jsonify({"error": "Deepgram transcribed empty text. Please speak louder."}), 400

            # ─────────────────────────────────────────────────────────
            # STEP 2: Azure Pronunciation Assessment
            # ─────────────────────────────────────────────────────────
            speech_config = speechsdk.SpeechConfig(
                subscription=azure_key, 
                region=azure_region
            )
            audio_config = speechsdk.audio.AudioConfig(filename=temp_audio_path)
            
            pron_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )
            pron_config.enable_prosody_assessment = True
            
            speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
            pron_config.apply_to(speech_recognizer)
            
            print("[Azure] Running pronunciation assessment...")
            try:
                result = speech_recognizer.recognize_once_async().get()
            except Exception as ex:
                print(f"[Azure Exception] {ex}")
                return jsonify({"error": f"Azure SDK failed: {str(ex)}"}), 500
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                pron_results_json = result.properties.get(speechsdk.PropertyId.SpeechServiceResponse_JsonResult)
                pron_results = json.loads(pron_results_json)
                
                nbest = pron_results.get("NBest", [])
                if not nbest:
                    return jsonify({"error": "No NBest result from Azure"}), 400
                
                best = nbest[0]
                words = best.get("Words", [])
                
                assessment = {
                    "recognitionStatus": result.reason.name,
                    "displayText": reference_text,
                    "accuracyScore": best.get("AccuracyScore", best.get("PronunciationAssessment", {}).get("AccuracyScore", 0)),
                    "fluencyScore": best.get("FluencyScore", best.get("PronunciationAssessment", {}).get("FluencyScore", 0)),
                    "prosodyScore": best.get("ProsodyScore", best.get("PronunciationAssessment", {}).get("ProsodyScore", 0)),
                    "completenessScore": best.get("CompletenessScore", best.get("PronunciationAssessment", {}).get("CompletenessScore", 0)),
                    "pronScore": best.get("PronScore", best.get("PronunciationAssessment", {}).get("PronScore", 0)),
                    "words": []
                }
                
                # Parse word and phoneme details safely
                for w in words:
                    pron_eval = w.get("PronunciationAssessment", {})
                    # Some Azure API versions flat out the structure
                    acc_score = pron_eval.get("AccuracyScore", w.get("AccuracyScore", 0))
                    err_type = pron_eval.get("ErrorType", w.get("ErrorType", "None"))
                    
                    phonemes_data = []
                    for p in w.get("Phonemes", []):
                        p_eval = p.get("PronunciationAssessment", {})
                        phonemes_data.append({
                            "phoneme": p.get("Phoneme", ""),
                            "accuracyScore": p_eval.get("AccuracyScore", p.get("AccuracyScore", 0)),
                        })

                    assessment["words"].append({
                        "word": w.get("Word", ""),
                        "accuracyScore": acc_score,
                        "errorType": err_type,
                        "phonemes": phonemes_data
                    })
                
                print(f"[Hybrid Assessment] Success — Accuracy: {assessment['accuracyScore']}, Fluency: {assessment['fluencyScore']}")
                print(f"[Azure] Words recognized: {len(assessment['words'])}")
                if len(assessment['words']) > 0:
                    print(f"[Azure] First word: {assessment['words'][0]['word']}")
                
                return jsonify(assessment)
                
            elif result.reason == speechsdk.ResultReason.NoMatch:
                return jsonify({"error": "No speech could be recognized by Azure"}), 400
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = result.cancellation_details
                return jsonify({
                    "error": f"Speech Recognition canceled: {cancellation_details.reason}. "
                             f"Error details: {cancellation_details.error_details}"
                }), 500

        finally:
            # Clean up temp file
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)

    except Exception as e:
        print(f"[Hybrid Assessment] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ─── Shadowing Offline Assessment ──────────────────────────

# Global lazy-loaded models for shadowing
_recognizer = None
_g2p = None

def get_shadowing_models():
    """Lazy load allosaurus and g2p so it doesn't block server start."""
    global _recognizer, _g2p
    if _recognizer is None:
        try:
            from allosaurus.app import read_recognizer
            print("[Shadowing] Loading Allosaurus model...")
            # We mock the editdistance module to prevent crashes if it wasn't built
            import sys
            import Levenshtein
            sys.modules['editdistance'] = Levenshtein

            _recognizer = read_recognizer()
        except Exception as e:
            print(f"[Shadowing] Failed to load Allosaurus: {e}")
            _recognizer = None

    if _g2p is None:
        try:
            from g2p_en import G2p
            print("[Shadowing] Loading G2P model...")
            _g2p = G2p()
        except:
            _g2p = None

    return _recognizer, _g2p

@app.route('/api/shadowing-check', methods=['POST'])
def shadowing_check():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400
        
        target_text = request.form.get('targetText', '')
        if not target_text:
            return jsonify({"error": "Missing targetText"}), 400

        audio_file = request.files['file']
        
        # Save temp audio file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_in:
            audio_file.save(temp_in.name)
            temp_in_path = temp_in.name

        # Convert to 16kHz mono WAV for Allosaurus
        from pydub import AudioSegment
        wav_path = temp_in_path + ".wav"
        try:
            audio = AudioSegment.from_file(temp_in_path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(wav_path, format="wav")
        except Exception as e:
            print(f"[Shadowing] Audio conversion failed: {e}")
            return jsonify({"error": f"Failed to convert audio: {str(e)}. (Ensure ffmpeg is installed)"}), 500
        
        recognizer, g2p = get_shadowing_models()
        if not recognizer or not g2p:
            return jsonify({"error": "Offline models not installed/loaded properly"}), 500

        print(f"[Shadowing] Processing text: {target_text}")
        
        # Target IPA
        target_phonemes = g2p(target_text)
        target_ipa = "".join([p for p in target_phonemes if p.strip()])
        
        # User IPA
        user_ipa = recognizer.recognize(wav_path, lang_id='eng')
        user_ipa_clean = user_ipa.replace(" ", "")

        # Compare using Levenshtein distance
        import Levenshtein
        distance = Levenshtein.distance(target_ipa, user_ipa_clean)
        max_len = max(len(target_ipa), len(user_ipa_clean))
        accuracy = ((max_len - distance) / max_len) * 100 if max_len > 0 else 0

        # Cleanup
        for path in [temp_in_path, wav_path]:
            if os.path.exists(path):
                os.remove(path)

        return jsonify({
            "accuracy": round(accuracy, 2),
            "target_ipa": target_ipa,
            "user_ipa": user_ipa_clean
        })

    except Exception as e:
        print("[Shadowing Check] Exception:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5005))
    app.run(host='0.0.0.0', port=port, debug=True)
