import asyncio
import os
from pydub import AudioSegment
from pydub.generators import Sine
import io
import sys

# Thêm đường dẫn backend vào sys.path để import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.services.audio_preprocessor import AudioPreprocessor
from app.services.azure_service import AzureService
from app.core.config import settings

async def main():
    print("=== BẮT ĐẦU TEST AZURE SPEECH ===")
    
    # Tạo một đoạn âm thanh test (Sine wave 1 giây) để giả lập microphone
    print("1. Tạo audio test...")
    sine_wave = Sine(440).to_audio_segment(duration=1000)
    audio_io = io.BytesIO()
    sine_wave.export(audio_io, format="webm")
    raw_audio_bytes = audio_io.getvalue()
    print(f"-> Tạo thành công file audio (webm format), kích thước: {len(raw_audio_bytes)} bytes")
    
    print("\n2. Gọi AudioPreprocessor...")
    try:
        processed_audio = AudioPreprocessor.process_to_wav(raw_audio_bytes)
        print(f"-> Chuyển đổi thành công sang WAV 16kHz, kích thước: {len(processed_audio)} bytes")
    except Exception as e:
        print(f"-> LỖI khi xử lý audio: {e}")
        return

    print("\n3. Gọi AzureService...")
    azure_service = AzureService()
    try:
        # Transcript giả lập
        reference_text = "Hello, this is a test."
        print(f"-> Gửi lên Azure với reference_text: '{reference_text}'")
        
        result = await azure_service.assess_pronunciation(
            audio_data=processed_audio,
            reference_text=reference_text
        )
        print("-> ĐÁNH GIÁ THÀNH CÔNG!")
        print(f"   Accuracy: {result.accuracy_score}")
        print(f"   Fluency: {result.fluency_score}")
        print(f"   Prosody: {result.prosody_score}")
    except RuntimeError as e:
        # Nếu Azure trả về NoMatch (vì chúng ta gửi tiếng bíp thay vì giọng nói), 
        # điều đó chứng tỏ logic gửi nhận đã HOẠT ĐỘNG! (Azure đã phân tích và không thấy giọng người)
        if "NoMatch" in str(e) or "Speech could not be recognized" in str(e):
            print("-> THÀNH CÔNG: Azure đã xử lý audio thành công nhưng không nhận diện được giọng người trong tiếng bíp (Chính xác!).")
            print(f"   Chi tiết lỗi từ Azure: {e}")
        else:
            print(f"-> LỖI từ Azure (Unexpected): {e}")
    except Exception as e:
        print(f"-> LỖI HỆ THỐNG: {e}")

if __name__ == "__main__":
    asyncio.run(main())
