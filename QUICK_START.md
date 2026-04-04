# ⚡ LexiLearn - Quick Start Guide

## Khởi động toàn bộ dự án chỉ với 1 lệnh

### 🚀 Cách 1: Khởi động tự động (Recommended)

```bash
# Đi vào thư mục dự án
cd /Users/admin/Development/SpeakingSystem

# Chạy script
./start.sh
```

**Kết quả:**
- ✅ Backend (FastAPI) trên `http://localhost:8000`
- ✅ API Docs trên `http://localhost:8000/docs`
- ✅ Frontend (React) trên `http://localhost:5173`
- ✅ Tất cả logs được hiển thị real-time

### 🛑 Dừng các services

```bash
# Cách 1: Nhấn Ctrl+C trong terminal chạy start.sh
Ctrl+C

# Cách 2: Hoặc chạy stop script (terminal khác)
./stop.sh
```

### ❌ Nếu start.sh không hoạt động

Sử dụng **Manual Setup** thay vào:
```bash
# Xem hướng dẫn chi tiết
cat MANUAL_SETUP.md

# Hoặc sử dụng Terminal 1 & 2 như bên dưới
```

---

## 📋 Cấu trúc Script

`start.sh` sẽ:

1. **Kiểm tra Prerequisites** (Python, Node.js, npm)
2. **Setup Backend** (tạo venv, .env nếu cần)
3. **Setup Frontend** (cài npm dependencies)
4. **Chạy Backend** ở background (port 8000)
5. **Chạy Frontend** ở background (port 5173)
6. **Hiển thị Status** và các URLs

---

## 🔑 Cấu hình API Keys (Lần đầu)

Lần chạy đầu tiên, script sẽ tạo file `backend/.env`:

```bash
# Edit ngay sau khi start.sh chạy xong
nano backend/.env
```

**Thêm các API keys:**
```env
DEEPGRAM_API_KEY=your_key_here
AZURE_SPEECH_KEY=your_key_here
GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_key_here
```

Sau khi edit, backend sẽ reload tự động (do `--reload` flag).

---

## 📊 Kiểm tra Status của Services

### Logs Real-time

```bash
# Backend logs
tail -f /tmp/lexilearn_backend.log

# Frontend logs
tail -f /tmp/lexilearn_frontend.log
```

### Kiểm tra Ports

```bash
# Check backend (port 8000)
curl http://localhost:8000/health

# Check frontend (port 5173)
curl http://localhost:5173

# List processes
lsof -i :8000   # Backend
lsof -i :5173   # Frontend
```

---

## 🎯 Workflow Hàng Ngày

```bash
# Morning - Start everything
./start.sh

# Shift trong ngày - Kiểm tra logs
tail -f /tmp/lexilearn_backend.log
tail -f /tmp/lexilearn_frontend.log

# Evening - Stop everything
./stop.sh
# Hoặc Ctrl+C trong terminal start.sh chạy

# Tạo release/deployment
git add .
git commit -m "Your message"
git push
```

---

## 🆘 Troubleshooting

### Backend không start

```bash
# Kiểm tra logs
tail -f /tmp/lexilearn_backend.log

# Hoặc manual start để debug
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload
```

### Frontend không start

```bash
# Kiểm tra logs
tail -f /tmp/lexilearn_frontend.log

# Hoặc manual start
cd frontend
npm run dev

# Nếu có lỗi dependency
npm install --legacy-peer-deps
```

### Port đã bị chiếm

```bash
# Find what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Hoặc chuyển port
cd backend
python -m uvicorn main:app --reload --port 8001
```

### Clean slate (xóa hết cài đặt cũ)

```bash
# Xóa venv và node_modules
rm -rf backend/venv frontend/node_modules

# Chạy lại start.sh
./start.sh
```

---

## 🎓 Các API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Test Speech Processing
```bash
curl -X POST http://localhost:8000/api/v1/speech/process-speech \
  -F "audio_file=@recording.webm" \
  -F "user_id=test_user" \
  -F "question_id=test_question" \
  -F "reference_text=Your question text"
```

### View API Docs (Interactive)
```
http://localhost:8000/docs
```

---

## 📱 Accessing from Other Machines

Nếu máy khác muốn access:

### Backend
```bash
# Change in start.sh line:
# --host 0.0.0.0 (already set)
# Từ máy khác truy cập:
http://192.168.x.x:8000/docs
```

### Frontend
```bash
# Edit frontend/vite.config.ts
server: {
  port: 5173,
  host: '0.0.0.0'  // Add this
}

# Từ máy khác truy cập:
http://192.168.x.x:5173
```

---

## 🚀 Production Setup

### 1. Tạo Production Build
```bash
cd frontend
npm run build
# Output ở: frontend/dist/
```

### 2. Deploy Backend
```bash
# Thay --reload bằng production settings
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### 3. Serve Frontend
```bash
# Sử dụng nginx hoặc vercel
# Upload dist/ folder
```

---

## 💡 Tips & Tricks

### Nhanh chóng hơn lần tới

Script sẽ skip setup nếu venv/node_modules đã exist.

```bash
# Chỉ cài lần đầu
./start.sh  # Lần 1: ~2 phút
./start.sh  # Lần 2: ~10 giây (skip setup)
```

### Keep Services Running

Nếu muốn services vẫn chạy khi khóa terminal:

```bash
# Chạy trong background
nohup ./start.sh > /tmp/lexilearn.log 2>&1 &

# Hoặc dùng tmux/screen
tmux new-session -d -s lexilearn './start.sh'
```

### Monitor All Logs

```bash
# Real-time monitoring
watch tail -f /tmp/lexilearn_backend.log
watch tail -f /tmp/lexilearn_frontend.log

# Hoặc dùng iTerm/Terminal split view
```

---

## 📞 Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `tail -f /tmp/lexilearn_*.log`
2. Xóa cache: `rm -rf backend/venv frontend/node_modules`
3. Chạy lại: `./start.sh`
4. Check docs: `http://localhost:8000/docs`

---

**Happy Coding! 🚀**
