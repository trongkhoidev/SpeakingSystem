import unittest
from unittest.mock import MagicMock, patch
from app.services.azure_service import AzureService
from app.models.audio import AzurePronunciationResult

class TestAzureServiceLogic(unittest.TestCase):
    def setUp(self):
        self.service = AzureService()

    @patch('app.services.azure_service.SpeechConfig')
    @patch('app.services.azure_service.AudioConfig')
    @patch('app.services.azure_service.SpeechRecognizer')
    @patch('app.services.azure_service.PronunciationAssessmentConfig')
    @patch('app.services.azure_service.PronunciationAssessmentResult')
    def test_processing_logic(self, mock_result_class, mock_pron_config, mock_recognizer, mock_audio_config, mock_speech_config):
        # Mock the SDK result object
        mock_sdk_result = MagicMock()
        # Mock the ResultReason to simulate successful recognition
        # In the actual code, we check result.reason == ResultReason.RecognizedSpeech
        # We'll mock the internal structure to bypass the enum comparison issue in tests
        
        # We need to simulate the success path
        # Instead of patching the Enum, we can patch the recognizer to return a result
        # that has a reason that matches the Enum member.
        from azure.cognitiveservices.speech import ResultReason
        mock_sdk_result.reason = ResultReason.RecognizedSpeech
        
        mock_recognizer.return_value.recognize_once.return_value = mock_sdk_result
        
        # Mock the PronunciationAssessmentResult wrapper
        mock_assessment = mock_result_class.return_value
        mock_assessment.accuracy_score = 90
        mock_assessment.fluency_score = 80
        mock_assessment.prosody_score = 70
        mock_assessment.pronunciation_score = 85
        mock_assessment.completeness_score = 100
        
        # Mock words
        mock_word = MagicMock()
        mock_word.word = "test"
        mock_word.accuracy_score = 90
        mock_word.error_type = "None"
        
        # Mock phonemes
        mock_phoneme = MagicMock()
        mock_phoneme.phoneme = "t"
        mock_phoneme.accuracy_score = 95
        # CRITICAL: We do NOT set error_type here to verify the code handles its absence
        
        mock_word.phonemes = [mock_phoneme]
        mock_assessment.words = [mock_word]
        
        # Call the method
        result = self.service._assess_pronunciation_sync(b"audio", "text")
        
        # Verify
        self.assertIsInstance(result, AzurePronunciationResult)
        self.assertEqual(len(result.words), 1)
        self.assertEqual(result.words[0].phonemes[0].phoneme, "t")
        self.assertIsNone(result.words[0].phonemes[0].errortype)

if __name__ == '__main__':
    unittest.main()
