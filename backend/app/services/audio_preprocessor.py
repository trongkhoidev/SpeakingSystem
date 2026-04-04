"""Audio preprocessing service for format conversion and resampling."""

import io
import os
import logging
from pydub import AudioSegment
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class AudioPreprocessor:
    """Service for audio format conversion and resampling."""
    
    @staticmethod
    def process_to_wav(audio_data: bytes, target_sample_rate: int = 16000) -> bytes:
        """
        Convert audio bytes to WAV format with target sample rate.
        Supports WebM, WAV, MP3 etc. as input via pydub.
        
        Args:
            audio_data: Raw audio bytes
            target_sample_rate: Target sample rate in Hz (default 16000)
            
        Returns:
            Processed WAV audio bytes
        """
        try:
            # Load audio using pydub
            # We don't specify format let pydub guess, but if it fails we might need hint
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # Convert to mono if it's stereo
            if audio.channels > 1:
                audio = audio.set_channels(1)
            
            # Resample
            if audio.frame_rate != target_sample_rate:
                audio = audio.set_frame_rate(target_sample_rate)
            
            # Set to 16-bit PCM
            audio = audio.set_sample_width(2)
            
            # Export to WAV in memory
            wav_io = io.BytesIO()
            audio.export(wav_io, format="wav")
            
            return wav_io.getvalue()
            
        except Exception as e:
            logger.error(f"Audio preprocessing failed: {str(e)}")
            raise RuntimeError(f"Failed to process audio: {str(e)}")

    @staticmethod
    async def get_audio_duration(audio_data: bytes) -> float:
        """Calculate audio duration in seconds."""
        try:
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
            return len(audio) / 1000.0
        except Exception:
            return 0.0
