Dựa trên yêu cầu của bạn về việc sử dụng **React** cho Frontend và **Python** cho Backend, kết hợp với hạ tầng **Supabase/SQL Server** và các dịch vụ AI từ **Azure/Deepgram**, dưới đây là bản thiết kế kiến trúc hệ thống chi tiết cho dự án LexiLearn.

### 1. Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được thiết kế theo mô hình **Decoupled Architecture** (Kiến trúc tách rời), giúp tối ưu hóa hiệu suất xử lý âm thanh thời gian thực và khả năng mở rộng dữ liệu.

*   **Frontend (React + Vite):** Đảm nhiệm việc thu âm, hiển thị sóng âm (waveform) và trình diễn Dashboard kết quả. Sử dụng **Web Speech API** để cung cấp bản dịch tạm thời (interim transcript) ngay khi người dùng nói mà không tốn phí API.[1, 2]
*   **Backend (Python + FastAPI):** Lựa chọn FastAPI vì hỗ trợ xử lý không đồng bộ (asynchronous), rất quan trọng khi gọi đồng thời nhiều dịch vụ AI (Deepgram cho STT và Azure cho Pronunciation Assessment).
*   **Database Layer (Hybrid):**
    *   **Supabase (PostgreSQL):** Quản lý người dùng (Auth), lưu trữ profile, lịch sử luyện tập và metadata của các file âm thanh.
    *   **SQL Server (10GB):** Lưu trữ kho đề thi khổng lồ và dữ liệu phân tích lịch sử lớn. Kết nối với Supabase thông qua **Foreign Data Wrapper (FDW)** để Python có thể truy vấn tập trung tại một điểm.[3]
*   **Storage (Supabase Storage):** Lưu trữ các file `.wav` hoặc `.webm` sau mỗi lần nói để người dùng có thể nghe lại và đối chiếu.

### 2. Stack Công Nghệ Đề Xuất (Technical Stack)

| Thành phần | Công nghệ | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TailwindCSS | Hiệu năng cao, thư viện Shadcn/UI hỗ trợ tạo dashboard nhanh. |
| **Backend** | Python (FastAPI) | Xử lý AI/ML mạnh mẽ, hỗ trợ Pydantic để validate dữ liệu từ Azure/Deepgram. |
| **Database** | Supabase + MSSQL | Tận dụng Auth/Realtime của Supabase và khả năng lưu trữ lớn của SQL Server. |
| **STT (Chính)** | Deepgram Nova-3 | Tốc độ cực nhanh (<300ms), độ chính xác cao hơn Azure 30%.[4, 5] |
| **Pronunciation** | Azure Speech SDK | Cung cấp chỉ số chi tiết về Phoneme (âm vị) và Prosody (ngữ điệu).[6, 7] |
| **Visualization** | Recharts / SciChart | Vẽ biểu đồ Donut và biểu đồ Radar cho 4 tiêu chí IELTS.[8, 9] |

### 3. Logic Hoạt Động & Quy Trình Nghiệp Vụ

Quy trình xử lý một câu trả lời (Response Processing Flow) diễn ra theo các bước sau:

1.  **Ghi âm (Client-side):** Người dùng nói, React dùng `MediaRecorder API` để bắt audio stream. Đồng thời Web Speech API hiển thị text mờ trên màn hình để tạo cảm giác phản hồi tức thì.[2]
2.  **Xử lý Audio (FastAPI):** Audio được gửi lên Python Backend. Tại đây, hệ thống gọi song song (Parallel execution):
    *   **Nhánh 1:** Gửi tới Deepgram để lấy Transcript chính xác nhất.[4]
    *   **Nhánh 2:** Gửi tới Azure Speech để lấy điểm số phát âm (Accuracy, Fluency, Prosody).[10, 7]
3.  **Phân tích Sư phạm (LLM):** Python tổng hợp Transcript từ Deepgram + Điểm số từ Azure, sau đó gửi tới LLM (Gemini/GPT-4o-mini) với Prompt chuyên sâu để phân tích **Lexical Resource** và **Grammar**.[11, 12]
4.  **Chấm điểm & Quy đổi:** Hệ thống áp dụng công thức trọng số để quy đổi điểm thô sang Band Score (1.0 - 9.0) [6, 13]:
    $$Score_{Overall} = \frac{Score_{Fluency} + Score_{Pronunciation} + Score_{Lexical} + Score_{Grammar}}{4}$$
5.  **Lưu trữ & Hiển thị:** Kết quả được lưu vào SQL Server và trả về Frontend để hiển thị Dashboard màu sắc (Color-coded).

### 4. Đề Xuất User Interface (UI/UX)

Để đảm bảo tính thân thiện và hiện đại, giao diện nên được thiết kế theo phong cách **Minimalist Dashboard** [14, 15]:

*   **Màn hình Luyện tập (The Zen Mode):**
    *   Không gian trắng rộng, chỉ hiển thị câu hỏi và một **Waveform** chuyển động mượt mà khi người dùng nói.[16, 17]
    *   Nút bấm "Space to Start/Enter to Finish" để giảm thiểu thao tác chuột.[2]
*   **Insight Dashboard (Phân tích kết quả):**
    *   **Color-coded Transcript:** Những từ phát âm đúng hiện màu xanh lá, phát âm sai hiện màu đỏ. Nhấn vào từ đỏ để nghe âm chuẩn (TTS) và xem hướng dẫn đặt lưỡi/môi.[1, 18]
    *   **IELTS Radar Chart:** Biểu đồ mạng nhện hiển thị sự cân bằng giữa 4 tiêu chí, giúp người dùng biết mình đang yếu ở đâu (ví dụ: phát âm tốt nhưng ngữ pháp còn hạn chế).[19, 8]
    *   **AI Mentor Chat:** Một khung chat nhỏ bên dưới kết quả để người dùng hỏi thêm: "Tại sao tôi bị trừ điểm ở câu này?" hoặc "Hãy gợi ý cho tôi 3 từ vựng band cao hơn cho câu trả lời vừa rồi".

### 5. Quản Lý Tài Khoản (Multi-user Management)

Sử dụng **Supabase Auth** tích hợp sẵn giúp bạn dễ dàng cấp account cho bạn bè qua Google Login hoặc Email/Password.
*   **Row Level Security (RLS):** Đảm bảo bạn A không thể xem lịch sử luyện tập và nghe lại file ghi âm của bạn B, mặc dù tất cả đều lưu trong cùng một Database.[20, 21]
*   **Quản lý quota:** Bạn có thể thiết lập logic trong Python để giới hạn mỗi User chỉ được luyện tập tối đa bao nhiêu phút/ngày nhằm bảo vệ quỹ credit miễn phí từ Azure/Deepgram của mình.

**Lời khuyên thêm:** Thay vì tạo nhiều account lách luật, bạn hãy tận dụng tối đa 5 giờ miễn phí/tháng của Azure F0 và 200$ của Deepgram bằng cách **chỉ gửi audio lên AI khi người dùng đã kết thúc câu nói**, tránh việc streaming liên tục gây lãng phí tài nguyên không cần thiết.