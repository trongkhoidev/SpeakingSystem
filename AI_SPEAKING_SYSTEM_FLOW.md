# 🎙️ LexiLearn AI Speaking Assessment System

Tài liệu này mô tả chi tiết kiến trúc, quy trình xử lý (flow), và cách thức các mô hình AI phối hợp để chấm điểm kỹ năng Speaking theo chuẩn IELTS trong hệ thống LexiLearn.

---

## 🏗️ 1. Kiến trúc Hệ thống (Tech Stack)

Hệ thống sử dụng mô hình **Hybrid AI Orchestration**, kết hợp giữa các mô hình ngôn ngữ lớn (LLM) và các dịch vụ AI chuyên biệt về âm thanh.

| Thành phần | Công nghệ sử dụng | Vai trò |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Xử lý ghi âm, hiển thị feedback thời gian thực. |
| **Backend** | Flask (Python 3.10) | Proxy bảo mật, xử lý audio (Resampling, WAV), Allosaurus model. |
| **STT Engine** | **Deepgram (Nova-3)** | Chuyển Audio sang Text với độ chính xác cao nhất hiện nay. |
| **Phonetic Analysis** | **Azure Speech Service** | Phân tích phát âm (Accuracy, Fluency, Prosody) tới cấp độ âm tiết (Phoneme). |
| **Reasoning Engine** | **DeepSeek (R1/V3)** | Chấm điểm Lexical, Grammar và đưa ra nhận xét chuyên sâu bằng tiếng Việt. |
| **Speed/Gatekeeper** | **Groq (Llama 3.3 70B)** | Kiểm tra tính liên quan của câu trả lời (Relevance Check) siêu tốc. |
| **Embeddings** | **Gemini / OpenAI** | Tính toán Vector Similarity để lọc câu trả lời lạc đề. |
| **Database** | **Supabase** | Lưu trữ phiên luyện tập, câu trả lời và kết quả chấm điểm. |

---

## 🔄 2. Quy trình Xử lý (The 5-Stage Pipeline)

Hệ thống xử lý một bài nói qua 5 giai đoạn nghiêm ngặt:

### Stage 0: The Gatekeeper (Kiểm tra nội dung)
Trước khi chấm điểm, hệ thống kiểm tra xem thí sinh có đang nói đúng chủ đề không.
- **Bước 1:** Chuyển câu hỏi và transcript của thí sinh thành Vector (Embeddings).
- **Bước 2:** Tính toán **Cosine Similarity**.
    - `> 0.6`: Hợp lệ, chuyển sang Stage 1.
    - `< 0.4`: Lạc đề, trả về cảnh báo ngay lập tức (không tốn token chấm điểm).
    - `0.4 - 0.6`: Chuyển sang **Groq (Llama 3.3)** để thẩm định ngôn ngữ lần cuối.

### Stage 1: Transcription (Deepgram Nova-3)
Audio blob được gửi lên Backend Flask.
- Backend thực hiện chuẩn hóa Audio (PCM 16kHz, Mono, WAV).
- Gửi sang Deepgram với `keyterm` là các từ vựng IELTS quan trọng để đảm bảo transcription không sai lệch các thuật ngữ chuyên ngành.

### Stage 2: Technical Pronunciation (Azure Speech)
Audio được gửi song song sang Azure Pronunciation Assessment.
- **Input:** Audio + Transcript từ Stage 1.
- **Output:** Các chỉ số kỹ thuật (0-100):
    - `Accuracy`: Độ chính xác của từng từ.
    - `Fluency`: Độ trôi chảy, tốc độ nói.
    - `Prosody`: Nhịp điệu, trọng âm, ngữ điệu (Intonation).
    - `Completeness`: Độ hoàn thiện của câu.

### Stage 3: Linguistic Evaluation (DeepSeek)
LLM (DeepSeek) đóng vai trò một giám khảo IELTS 15 năm kinh nghiệm.
- **Prompt:** Được tiêm (inject) bộ thư viện `SPEAKING_PHRASES` gồm cấu trúc A.R.E.A (Answer - Reason - Example - Alternative) và Signposting phrases.
- **Nhiệm vụ:**
    - Phân tích lỗi ngữ pháp (Grammar).
    - Đánh giá sự đa dạng từ vựng (Lexical Resource).
    - Đưa ra nhận xét bằng **tiếng Việt** nhưng trích dẫn lỗi và gợi ý bằng **tiếng Anh**.

### Stage 4: Scoring & Mapping
Hệ thống tổng hợp kết quả:
- Chuyển đổi điểm Azure (0-100) sang Band Score IELTS (0-9.0) theo hàm phi tuyến (Non-linear mapping).
- Tính điểm Overall Band = Average(Fluency, Pronunciation, Lexical, Grammar).
- Làm tròn theo quy tắc IELTS (nearest 0.5).

---

## 💻 3. Chi tiết Mã nguồn & I/O

### I/O Data Structure (JSON)
Kết quả trả về từ `evaluateWithAzure` trong `speaking.service.js`:

```json
{
  "overall_band": 7.0,
  "pronunciation_score": 7.5,
  "fluency_score": 6.5,
  "lexical_score": 7.0,
  "grammar_score": 7.0,
  "criteria_feedback": {
    "fluency": { "reasoning": "...", "errors": [] },
    "lexical": { "reasoning": "...", "errors": [] },
    "grammar": { "reasoning": "...", "errors": [] },
    "pronunciation": { "reasoning": "...", "errors": [] }
  },
  "azure_words": [
    {
      "word": "technology",
      "accuracyScore": 95,
      "phonemes": [{ "phoneme": "t", "accuracyScore": 98 }, ...]
    }
  ],
  "improved_sample_answer": "...",
  "suggestions": ["Sử dụng thêm từ vựng 'sustainability'...", "..."]
}
```

### Prompt Engineering Logic
Prompt được thiết kế cực kỳ nghiêm khắc (`STRICT IELTS Examiner`).
1. **Lớp lý luận (Reasoning Layer):** Yêu cầu AI phân tích dựa trên 4 tiêu chí cốt lõi của IELTS.
2. **Lớp kiến thức (Knowledge Layer):** Cung cấp danh sách các Idioms và Collocations để AI đối chiếu.
3. **Lớp định dạng (Format Layer):** Ép kiểu trả về JSON để Frontend render các UI Component như Radar Chart hoặc Word Highlights.

---

## 🛠️ 4. Xử lý các Edge Cases

1. **AI Hallucination:** Nếu LLM trả về format không phải JSON, hệ thống sử dụng Regex để bóc tách hoặc fallback về kết quả cũ.
2. **Azure Failure:** Nếu Azure Speech gặp lỗi (quá tải), hệ thống tự động fallback sang DeepSeek để ước lượng điểm Pronunciation dựa trên transcript (dù độ chính xác thấp hơn).
3. **Low Confidence:** Nếu Deepgram trả về transcript có độ tin tưởng thấp (< 0.5), hệ thống sẽ gợi ý người dùng nói to hơn hoặc kiểm tra lại Micro.

---

> **Tài liệu tham khảo:**
> - `src/services/speaking.service.js`: Logic điều phối chính.
> - `src/services/ai-gateway.service.js`: Gateway điều hướng Model (Groq/DeepSeek/Gemini).
> - `backend/app.py`: Xử lý audio và Azure SDK proxy.
