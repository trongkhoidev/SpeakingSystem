# 🎙️ Tài liệu Đặc tả Kỹ thuật: LexiLearn Speaking Mode (Full Technical Spec)

Tài liệu này cung cấp mô tả chi tiết "tới từng milimet" về cách hệ thống Speaking của LexiLearn hoạt động, từ xử lý tín hiệu âm thanh, kiến trúc Pipeline AI đa tầng, đến thiết kế giao diện người dùng chuyên sâu.

---

## 1. Kiến Trúc Luồng Dữ Liệu (Data Flow Architecture)

Hệ thống hoạt động theo mô hình **Pipeline Tuyến tính kết hợp Song song**:

1.  **FE (Ghi âm)** -> Gửi Audio Chunks qua **WebSocket (Deepgram)** (Hiển thị text thời gian thực).
2.  **FE (Kết thúc)** -> Gói Audio Blob -> Gửi tới **BE (Flask)**.
3.  **BE (Xử lý)** -> Resampling Audio -> Gửi tới **Stage 0 (Gatekeeper)**.
4.  **Pipeline Đánh giá song song**:
    -   **Azure Service**: Xử lý tín hiệu số (DSP) để lấy điểm phát âm, trọng âm, nhịp điệu.
    -   **DeepSeek AI**: Xử lý ngôn ngữ tự nhiên (NLP) để chấm điểm từ vựng, ngữ pháp, độ trôi chảy.
5.  **FE (Phản hồi)** -> Tổng hợp dữ liệu JSON -> Render UI Báo cáo chuyên sâu.

---

## 2. Chi Tiết Từng Bước Xử Lý & Mô Hình AI

### 2.1 Bước 1: Live Transcription (Deepgram Nova-3)
-   **Cơ chế**: Real-time Streaming.
-   **Model**: `nova-3` (Optimizer cho hội thoại tiếng Anh).
-   **Input**: Byte streams từ micro người dùng (khối mỗi 250ms).
-   **Xử lý đặc biệt**: Sử dụng `smart_format: true` để tự động viết hoa, chấm câu và `filler_words: true` để AI không bỏ sót các từ "uhm", "ah" — giúp đánh giá độ trôi chảy chính xác hơn.
-   **Output**: JSON chứa `transcript` và `is_final` flag.

### 2.2 Bước 2: Audio Pre-processing (Frontend + Backend)
-   **Tại FE**: Sử dụng `OfflineAudioContext` để resample audio từ bitrate trình duyệt xuống chuẩn **16000Hz, Mono, 16-bit PCM**. Đây là định dạng tối ưu nhất cho Azure Speech SDK.
-   **Tại BE**: Lưu file tạm dưới dạng `.wav`, sau đó nạp vào SDK để thực hiện **Pronunciation Assessment**.

### 2.3 Bước 3: Stage 0 - The Gatekeeper (Groq + Gemini Embeddings)
Đây là "người gác cổng" để đảm bảo người dùng không nói lạc đề.
-   **Input**: `question_text`, `student_transcript`.
-   **Xử lý**: 
    1.  Tạo Vector Embeddings cho cả câu hỏi và câu trả lời.
    2.  Tính **Cosine Similarity**. Nếu điểm > 0.6 là đạt.
    3.  Nếu điểm nằm trong vùng "nghi ngờ" (0.4 - 0.6), hệ thống gọi **Groq (Llama-3.3-70B)** để phân tích ngữ nghĩa sâu hơn.
-   **Output**: { `is_relevant`: boolean, `relevance_score`: 0-100 }.

### 2.4 Bước 4: Stage 1 - Cốt lõi Đánh giá Phát âm (Azure SDK)
-   **Cơ chế**: So sánh sóng âm thực tế với mẫu âm bản ngữ (Reference Text).
-   **Input**: Audio file + Transcript đã được chuẩn hóa.
-   **Output**: 
    -   **Accuracy**: Độ chính xác của từng âm tiết (Phoneme).
    -   **Prosody**: Đánh giá độ nhấn nhá, ngữ điệu (Intonation).
    -   **Completeness**: Kiểm tra xem người dùng có bỏ sót từ nào trong transcript không.
-   **Logic Mapping**: Điểm 0-100 được ánh xạ sang IELTS Band 0-9 bằng thuật toán phi tuyến tính (ví dụ: 80 điểm kỹ thuật mới đạt Band 7.5).

### 2.5 Bước 5: Stage 2 - Chấm điểm Ngôn ngữ học (DeepSeek Chat)
-   **Model**: `deepseek-chat` (V3/R1).
-   **Dữ liệu đầu vào (Prompt Context)**: Bao gồm câu hỏi, transcript, và **Knowledge Base (AREA structure, Signposting, IELTS Phrases)**.
-   **Tiêu chí chấm**: 
    1.  **Fluency (FC)**: Kiểm tra các cụm từ nối (Signposting) như *"To be honest", "Moreover"*.
    2.  **Lexical (LR)**: Tìm kiếm các từ vựng C1-C2, Collocations chuyên sâu.
    3.  **Grammar (GRA)**: Kiểm tra độ phức tạp của câu và lỗi thì (Tense).
-   **Output**: JSON chứa điểm số và lời khuyên bằng **Tiếng Việt**.

---

## 3. Đặc Tả Giao Diện Người Dùng (Detailed UI Specification)

### 3.1 Page 1: Màn hình khởi tạo (Input View)
Màn hình này được thiết kế tối giản, tập trung vào việc chuẩn bị.
-   **Input Session Title**: Ô nhập tiêu đề (mặc định là ngày giờ hiện tại).
-   **Questions Area**: Textarea lớn. Người dùng có thể copy-paste câu hỏi từ file PDF hoặc sách Cambridge.
-   **Auto-Part Detection**: Hệ thống tự động quét từ khóa để gán nhãn `Part 1`, `Part 2`, hoặc `Part 3` cho từng câu hỏi bằng màu sắc tương ứng.
-   **Past Sessions**: Lưới (Grid) các thẻ session cũ. Mỗi thẻ hiển thị: Tiêu đề, Ngày tháng, nút Xóa, và nút xem lại.

### 3.2 Page 2: Giao diện Luyện tập (Practice Interface)
Đây là màn hình quan trọng nhất, sử dụng bố cục **Main-Sidebar Layout**.
-   **Thanh tiến trình (Progress Dashboard)**: Nằm trên cùng, hiển thị số câu đã xong/tổng số câu.
-   **Question Card (Trung tâm)**: 
    -   Sử dụng Glassmorphism (hiệu ứng kính) với viền màu theo từng Part.
    -   Có nút **TTS (Mic)** để nghe giọng bản ngữ đọc mẫu câu hỏi.
-   **Vùng Recording**:
    -   Nút Mic lớn với hiệu ứng **Pulse Animation** (vòng tròn tỏa ra khi có âm thanh).
    -   **Live Transcript Box**: Một khung text hiển thị chữ đang chạy. Chữ màu xám là đang xử lý (interim), chữ màu đậm là đã chốt (final).
-   **Sidebar (Phải)**: Danh sách câu hỏi của session hiện tại. Các câu đã trả lời sẽ hiển thị điểm **Band trung bình** ngay trên thumbnail.

### 3.3 Page 3: Báo cáo Chuyên sâu (Feedback View)
Sau khi nhấn dừng, màn hình sẽ chuyển sang chế độ báo cáo.
-   **Overall Band Badge**: Một huy hiệu lớn hiển thị điểm tổng (ví dụ: 7.5). Màu sắc thay đổi theo band (Xanh > 7, Cam > 5, Đỏ < 5).
-   **Interactive Word Highlighting**: 
    -   Toàn bộ câu trả lời được hiển thị dưới dạng các thẻ từ (word chips).
    -   Màu xanh: Phát âm đúng. Màu cam: Gần đúng. Màu đỏ: Phát âm sai hoàn toàn.
    -   **Click vào từ**: Hệ thống hiển thị lỗi âm tiết cụ thể (ví dụ: bạn nói /t/ nhưng đúng phải là /θ/).
-   **Azure Dashboard**: Biểu đồ cột nhỏ hiển thị 4 chỉ số kỹ thuật (Accuracy, Fluency, Prosody, Completeness).
-   **Reasoning Cards**: 4 thẻ nhận xét từ AI cho FC, LR, GRA, Pronunciation. Mỗi thẻ có:
    -   Điểm Band con.
    -   Đoạn văn phân tích lỗi.
    -   Nút mở rộng để xem danh sách lỗi trích dẫn từ bài nói.
-   **Model Answer**: Đoạn văn mẫu Band 8.5+ được thiết kế với font chữ Italic, nằm trong khung nền gradient Blue-Green chuyên nghiệp.

---

## 4. Đặc Đặc Tả Dữ Liệu (Data Schema)

Để đảm bảo tính nhất quán, mọi dữ liệu Speaking được lưu trữ trong Supabase:
-   **`speaking_sessions`**: `id`, `user_id`, `title`, `created_at`.
-   **`speaking_questions`**: `id`, `session_id`, `question_text`, `part`, `order_index`.
-   **`speaking_answers`**: 
    -   `feedback_json`: Chứa toàn bộ cây dữ liệu từ Azure và AI (Đây là "trái tim" để tái hiện lại UI báo cáo).
    -   `student_transcript`: Văn bản thô của người dùng.
    -   `overall_band`: Điểm số cuối cùng.

---
*Tài liệu này được tạo ra để đảm bảo mọi chi tiết logic được hiểu đúng và đồng nhất trên toàn hệ thống.*
