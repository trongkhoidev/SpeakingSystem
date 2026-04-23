# LexiLearn - Kiến trúc & Logic Hoạt động Chế độ Speaking 🎙️

Tài liệu này mô tả chi tiết toàn bộ logic xử lý, luồng hoạt động (flow), hệ thống tính điểm, và cách tích hợp các mô hình AI (Azure Speech, DeepSeek, Gemini, Deepgram) trong hệ thống Speaking Practice của LexiLearn.

---

## 1. Tổng Quan Kiến Trúc (Architecture Overview)

Chế độ Speaking được thiết kế để thay thế một Cựu Giám Khảo IELTS (Examiner), với khả năng chấm điểm thời gian thực dựa trên tiêu chí chuẩn IELTS (Pronunciation, Fluency, Lexical Resource, Grammar).

Hệ thống là sự kết hợp của:
1. **Frontend (React/Vanilla JS)**: Ghi âm, xử lý UI state (`Practice.js`), và UI Review Feedback đa lớp.
2. **Backend Proxy (Flask - port 5005)**: Chuyên đóng vai trò adapter xử lý Audio Blob và kết nối bảo mật tới Azure Cognitive Services.
3. **AI Gateway (`ai-gateway.service.js`)**: Điều phối thông minh các mô hình LLM:
   - **Gemini / OpenAI**: Xử lý Embeddings để kiểm tra tính liên quan (Gatekeeper / Relevance Check).
   - **DeepSeek V3/R1**: Chấm điểm Grammar, Lexical, Fluency và nhận xét chi tiết.
   - **Groq (Llama 3.3)**: Dự phòng hoặc xử lý tốc độ cao.
4. **Azure Speech Services**: Phân tích sóng âm để bóc tách phonemes (âm vị) và đánh giá độ chính xác Phát âm (Pronunciation & Prosody).

---

## 2. Luồng Xử Lý Cốt Lõi (Core Execution Flow)

### 2.1. Cấu trúc và xử lý Audio nội bộ
- Khi người dùng nhấn giữ `Space` hoặc nút `Mic`, `MediaRecorder` thu lại âm thanh.
- Giao diện người dùng sẽ cập nhật "Live Transcript" (Phụ đề thời gian thực) qua **Deepgram WebSocket**. Nếu Deepgram bị lỗi, hệ thống tự động fallback qua Web **SpeechRecognition API** của trình duyệt.
- Kết thúc ghi âm, một Audio Blob (thường là định dạng `audio/webm`) được sinh ra.

### 2.2. The Gatekeeper - Kiểm tra tính liên quan (Relevance Check)
Lớp gác cổng chống "lạc đề" (Off-topic checker) trước khi gọi API tốn chi phí:
1. Câu hỏi và phiên âm được chuyển sang dạng Vector Embedding (qua Gemini `text-embedding-004`).
2. Mức độ liên quan đánh giá bằng Cosine Similarity logic `(qVec, aVec)`.
   - `> 0.6`: Pass, đưa vào chấm điểm.
   - `< 0.4`: Fail dứt khoát, bắt làm lại.
   - `0.4 - 0.6`: Kích hoạt LLM "Trọng tài" (Gatekeeper) để đưa ra quyết định nội suy.

### 2.3. Logic xử lý chi tiết Azure Speech Assessment & Deepseek (Dual-Track)
Khi câu trả lời hợp lệ, 2 luồng tính toán chạy song song để tiết kiệm thời gian:

#### A. Luồng Azure Speech (Phát âm & Lưu loát)
Vì Azure Speech API yêu cầu chặt chẽ chuẩn Audio, luồng này đi qua proxy:
- **Chuẩn hóa âm thanh Frontend:** `azure-speech.service.js` dùng `AudioContext` decode Blob, sau đó dùng `OfflineAudioContext` để resample audio về đúng 16kHz, mono-channel. Audio được chuyển thành base64 của file *WAV header chuẩn*.
- **Post lên Flask Backend:** Gửi JSON dạng `{ audioBase64, referenceText: transcript }` sang `localhost:5005`.
- **Phân tích Sóng âm:** Azure so khớp Transcript với độ rung thanh quản của audio. Nó phân rã các từ thành cấu trúc âm vị (Phonemes) và trả về điểm số ở 4 phân mục:
  - `accuracyScore`: Đọc đúng từ không.
  - `fluencyScore`: Tốc độ nói, có vấp không.
  - `prosodyScore`: Nhịp điệu, nhấn nhá, ngữ điệu lên xuống.
  - `completenessScore`: Độ hoàn thiện, có bỏ sót phần nào của câu không.
- **Biết đổi sang IELTS Band:** Azure trả về thang điểm 0-100. Thuật toán của chúng tôi biến điểm 0-100 này thành IELTS Band. Cụ thể kết hợp `accuracy * 0.7 + prosody * 0.3`. Lưu ý, **Penalty cực nặng**: Nếu prosody (vần điệu robot) < 30 điểm thì band phát âm Auto khóa tối đa ở 6.0 dù đọc chữ có rõ tới đâu.

#### B. Luồng DeepSeek AI (Logic, Từ vựng, Ngữ pháp)
- DeepSeek đóng vai trò xử lý ngôn ngữ tự nhiên. 
- Tiêm **Knowledge Base (Speaking phrases)** vào System Prompt. Bắt Deepseek áp dụng các Framework chấm thi như sơ đồ A.R.E.A (Answer, Reason, Example, Alternative).
- Output trả về JSON đánh giá Grammar/Fluency/Lexical, kèm các cột trích lỗi sai (Errors) và Gợi ý câu trả lời xịn (Improved Answer 8.0+).

---

## 3. Cách UI Hiển Thị Kết Quả Đánh Giá (UI Assessment Display)

Trải nghiệm luyện tập cung cấp cấp độ chi tiết như một bài phân tích chuyên sâu của giảng viên:

### 3.1. Dashboard Tổng quan (Overall Badge & Table)
- Điểm Band tổng (Overall Band) được render to nhất. Vòng tròn báo hiệu màu sắc Band: Xanh (>= 7.0), Cam (5.5 - 6.5), Đỏ (< 5.5).
- Bảng Dashboard table so sánh 4 tiêu chí IELTS với trạng thái và viền màu đi kèm cùng các Emojis trực quan (🌊 Fluency, 📚 Lexical, ⚖️ Grammar, 🗣️ Pronunciation). Ở đầu có phần Semantic Relevance Score (Độ dính líu đến đề tài).

### 3.2. Cụm Meter Đo Nhịp Điệu (Azure Prosody Gauge)
UI tạo ra 4 thanh Progress bar đại diện cho 4 chỉ số kỹ thuật chích xuất từ tần số sóng của Azure `(Phát âm - Trôi chảy - Nhịp điệu - Độ đầy đủ)`. Thanh bar lặp lại màu `#3b82f6` (Màu xanh chuyên sâu/nghiên cứu khoa học) để tách biệt với màu IELTS band.

### 3.3. Đánh Giá Phát Âm Từng Từ (Word-level Highlight)
UI biến text của bạn thành các khối box highlight như sau (chạy hàm `renderWordHighlights`):
- Từ đạt điểm tuyệt vời >= 80%: Nền xanh lá nhạt (`#dcfce7`).
- Từ đạt điểm Trung bình 60-79%: Nền cam rực (`#fff7ed`). Cảnh báo cần uốn lưỡi lại.
- Từ Sai hoàn toàn < 60%: Nền đỏ (`#fee2e2`). 
   - **Đặc biệt**: Bên dưới từ sai, giao diện sẽ in ra thẻ HTML Phụ lưu ý các âm vị đánh vần IPA bị lỗi (VD: `Lỗi âm: /th/, /z/`) – Data này bóc trực tiếp từ mảng `w.phonemes` mà Azure cung cấp. Có thêm Nhãn lặp lại `Insertion` hoặc `Omission`.

### 3.4. Layout Chỉnh Lỗi (Review & Suggestions)
- Các lỗi ngữ pháp, dùng từ sẽ đóng khung Đỏ ghi rõ nhận xét Tiếng Việt và trích lại câu Tiếng Anh gốc.
- Ô Điểm mạnh màu Xanh lá, Gợi ý cấp độ màu Cam được tách ở 2 tab. Dưới cùng là khung "Cụm câu IELTS Examiner Band 8.5" tạo từ Deepseek để chép vào vở.

### 3.5. Thanh Sidebar & Modal Tổng kết
Quá trình nói giữ ở cột trái, User có thể click vào xem lại lịch sử câu nào đã pass. Kết thúc Practice sẽ có Overlay Backdrop nổi lên hiển thị **Modal Summary** của mọi câu trả lời.

---

## 4. Xử Lý Các Vấn Đề Ngoại Lệ & Fallback System

Sự ổn định (Resilience) của chế độ Speaking được bảo vệ qua các tầng cấu hình Fallback:

### 4.1. Sự cố STT Live Transcript (Deepgram Timeout)
- **Vấn đề:** Nếu Deepgram socket bị lag mạng hoặc hết token, người dùng vẫn đang nói thì làm sao?
- **Giải pháp:** Trong hàm `startRecording`, hệ thống kích hoạt timeout ngầm `2500ms`. Nếu sau 2.5s WebSocket chặn kết nối, cờ `state.isFallback = true` được bật. Lúc này Frontend sẽ ngầm khơi mào Web `SpeechRecognition` API (hàng nội bộ của trình duyệt Chrome/Safari) hoạt động nối tiếp để in chữ ra màn hình mà không làm gián đoạn bài kiểm tra.

### 4.2. Khắc phục Model Rate Limits (Ngẽn mạng AI)
- **Gateway tự động đảo chiều:** Lớp trung gian `ai-gateway.service.js` nhận thấy API của `DeepSeek` trả lỗi `429 Too Many Requests` hoặc Crash sập server, Gateway lập tức switch (đảo luồng) qua dự phòng `route.backup` là `Groq (Llama 3)` hoặc `Gemini` để chữa cháy mà code ở `Practice.js` không hề hay biết.
- Với Gemini, Gateway lập trình sẵn lệnh Delay `setTimeout(2000)` nếu xuất hiện Limit, thử lại 1 lần nữa trước khi chuyển luồng.

### 4.3. Quản lý Môi trường Micro và DOM Garbage Collection
- Để không bị Memory Leak làm rò rỉ bộ nhớ, khi người dùng bấm "Quay lại" hay "Kết thúc", hàm rác `cleanup()` sẽ ngắt `AudioTracks` của MediaStream. 
- Ngắt cả `window.speechSynthesis.cancel()` (Giọng đọc bot). Nhờ vậy, Audio Hardware của User được hạ nhiệt và giải phóng Ram lập tức khi thoát mode Speaking.

---

## 5. Trial & Admin Logic (Cập nhật 2026)

### 5.1. Google Auth (Không over-security)
- Mục tiêu sản phẩm: login nhanh bằng Google, không thêm các kiểm tra cứng như IP whitelist/device binding.
- Điều kiện đủ:
  - Nhận `id_token` từ Google Sign-In.
  - Verify chữ ký + `aud` theo Google Client ID.
  - Tạo tài khoản user nếu chưa có, sau đó cấp JWT nội bộ.

### 5.2. Chế độ dùng thử không login
- Áp dụng mô hình **điểm ngân sách trial** thay vì giới hạn cứng theo từng route.
- Cấu hình:
  - `total_points = 12`
  - `practice_cost = 2`
  - `test_cost = 6`
- Các tổ hợp hợp lệ:
  - 6 lần luyện speaking (6 x 2 điểm)
  - 2 lần thi thử (2 x 6 điểm)
  - 3 lần luyện + 1 lần thi thử (3x2 + 1x6 = 12)
- Cách tính này phản ánh đúng chi phí hệ thống: test dùng nhiều request/AI compute hơn practice.

### 5.3. Logic đánh giá độ hài lòng cho admin
- Dashboard trả về cả điểm sao người dùng và chỉ số hài lòng tổng hợp.
- Công thức:
  - `SatisfactionIndex (0-100) = 0.5*ExplicitRating + 0.3*Engagement + 0.2*Retention7d`
- Trong đó:
  - `ExplicitRating`: Chuẩn hóa từ điểm feedback 1-5 => 0-100.
  - `Engagement`: số hành động (practice + test) trung bình / active user (cap ở 20 hành động).
  - `Retention7d`: % user active trong 7 ngày gần nhất.
- Lợi ích:
  - Tránh lệch nếu chỉ nhìn mỗi số sao.
  - Theo dõi được cả cảm nhận chủ quan lẫn hành vi sử dụng thực tế.

### 5.4. Token quota, plan và cơ chế thu hút user mới
- Mọi tính năng tốn AI compute (practice/test) đều trừ token.
- Khi user không đủ token, API trả lỗi rõ ràng và frontend điều hướng về trang `Gói & Token`.
- Các plan đề xuất ban đầu (giá rẻ để tăng adoption):
  - **Free Starter**: 0 VND, 200 token/tháng.
  - **Basic**: 69.000 VND/tháng, 1.200 token/tháng.
  - **Plus**: 149.000 VND/tháng, 4.000 token/tháng.
- Daily trial bonus:
  - Mỗi user có thể nhận token thưởng 1 lần/ngày (`claim-daily`).
- Social reward:
  - Follow Facebook/X sẽ được thưởng thêm token (mỗi nền tảng 1 lần).
- Toàn bộ usage được lưu trong ví token riêng theo user để kiểm soát lưu lượng, theo dõi tổng tiêu thụ và tránh vượt hạn mức.

---
*(Tài liệu Kiến Trúc AI v1.5 – Được cập nhật cho Chế độ Speaking Practice 2026)*
