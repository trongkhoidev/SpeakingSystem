"""LLM service for linguistic analysis using Gemini or GPT."""

import asyncio
import aiohttp
from typing import Optional, Dict, Any
from app.models.assessment import LexicalAnalysis, GrammarAnalysis
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM-based linguistic analysis."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
    
    async def analyze_lexical_resource(
        self,
        transcript: str,
        reference_level: str = "IELTS"
    ) -> LexicalAnalysis:
        """
        Analyze lexical resource using LLM.
        
        Args:
            transcript: User's spoken transcript
            reference_level: Proficiency level reference
        
        Returns:
            LexicalAnalysis with score and feedback
        """
        
        prompt = f"""
Analyze the lexical resource (vocabulary) in this IELTS speaking response:

"{transcript}"

Evaluate on a scale of 0-9 and provide:
1. Overall lexical score
2. Specific feedback
3. List of Band 8+ vocabulary items found
4. Overall variety level (Limited, Adequate, Good, Excellent)

Return as JSON with keys: score, feedback, word_list, variety_level
        """
        
        try:
            if self.provider == "gemini":
                return await self._call_gemini(prompt, "lexical")
            else:
                return await self._call_openai(prompt, "lexical")
        except Exception as e:
            logger.error(f"Lexical analysis failed: {str(e)}")
            # Return minimal response on error
            return LexicalAnalysis(
                score=5.0,
                feedback="Analysis temporarily unavailable",
                word_list=[],
                variety_level="Adequate"
            )
    
    async def analyze_grammar(
        self,
        transcript: str
    ) -> GrammarAnalysis:
        """
        Analyze grammar using LLM.
        
        Args:
            transcript: User's spoken transcript
        
        Returns:
            GrammarAnalysis with score and feedback
        """
        
        prompt = f"""
Analyze the grammatical accuracy in this IELTS speaking response:

"{transcript}"

Evaluate on a scale of 0-9 and provide:
1. Overall grammar score
2. Specific feedback on errors
3. Count of grammatical errors
4. Types of errors found (e.g., Subject-Verb Agreement, Tense Consistency)
5. Complexity level (Simple, Intermediate, Advanced)

Return as JSON with keys: score, feedback, error_count, error_types, complexity_level
        """
        
        try:
            if self.provider == "gemini":
                return await self._call_gemini(prompt, "grammar")
            else:
                return await self._call_openai(prompt, "grammar")
        except Exception as e:
            logger.error(f"Grammar analysis failed: {str(e)}")
            return GrammarAnalysis(
                score=5.0,
                feedback="Analysis temporarily unavailable",
                error_count=0,
                error_types=[],
                complexity_level="Intermediate"
            )
    
    async def analyze_comprehensive_stage2(
        self,
        question: str,
        transcript: str,
        azure_brief: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Stage 2: Comprehensive IELTS Assessment.
        Analyzes Fluency (FC), Lexical (LR), and Grammar (GRA).
        
        Args:
            question: IELTS Question
            transcript: User's spoken transcript
            azure_brief: Data from Azure (Accuracy, Fluency, Prosody, Completeness)
            
        Returns:
            JSON structure with scores and feedback by category.
        """
        
        prompt = f"""
        # IELTS Speaking Assessment Stage 2
        As an expert IELTS examiner, provide a comprehensive assessment for the student's answer based on the following:

        ### INPUT:
        - Question: "{question}"
        - Student Transcript: "{transcript}"
        - Azure Acoustic Metrics: {json.dumps(azure_brief)}

        ### ASSESSMENT GUIDELINES (Knowledge Base):
        1. **AREA Structure**: Answer, Reason, Example, Alternative/Conclusion.
        2. **Signposting**: "To be honest", "Moreover", "On the other hand", "Furthermore".
        3. **IELTS Phrases**: C1/C2 Vocabulary & Collocations.

        ### REQUIRED OUTPUT (Strict JSON format - Language: VIETNAMESE for feedback):
        {{
            "FC": {{
                "score": 0.0-9.0,
                "feedback": "...",
                "key_findings": ["...", "..."]
            }},
            "LR": {{
                "score": 0.0-9.0,
                "feedback": "...",
                "band_8_plus_words": ["...", "..."]
            }},
            "GRA": {{
                "score": 0.0-9.0,
                "feedback": "...",
                "error_types": ["...", "..."],
                "complexity": "Simple/Intermediate/Advanced"
            }},
            "model_answer": "A high-scoring (Band 8.5+) version of this answer using Signposting and AREA..."
        }}
        """

        try:
            if self.provider == "gemini":
                return await self._call_gemini_stage2(prompt)
            else:
                return await self._call_openai_stage2(prompt)
        except Exception as e:
            logger.error(f"Stage 2 analysis failed: {str(e)}")
            return {
                "FC": {"score": 0.0, "feedback": "Không thể phân tích lúc này. Vui lòng thử lại.", "key_findings": []},
                "LR": {"score": 0.0, "feedback": "Không thể phân tích lúc này. Vui lòng thử lại.", "band_8_plus_words": []},
                "GRA": {"score": 0.0, "feedback": "Không thể phân tích lúc này. Vui lòng thử lại.", "error_types": [], "complexity": "N/A"},
                "model_answer": "Không thể tạo câu trả lời mẫu lúc này."
            }

    async def explain_more(
        self,
        criterion: str,
        original_reasoning: str,
        transcript: str
    ) -> Dict[str, Any]:
        """
        Generate a deeper AI explanation for a specific IELTS criterion.
        Returns Vietnamese explanation with examples and suggestions.
        """
        
        criterion_map = {
            "fluency_coherence": "Fluency & Coherence (FC)",
            "lexical_resource": "Lexical Resource (LR)",
            "grammatical_accuracy": "Grammatical Range & Accuracy (GRA)",
            "pronunciation": "Pronunciation"
        }
        
        criterion_name = criterion_map.get(criterion, criterion)
        
        prompt = f"""
        Bạn là một chuyên gia IELTS Speaking. Hãy phân tích chi tiết hơn về tiêu chí "{criterion_name}" cho câu trả lời sau.

        ### Câu trả lời của thí sinh:
        "{transcript}"

        ### Nhận xét ban đầu:
        "{original_reasoning}"

        ### YÊU CẦU:
        Hãy cung cấp phân tích sâu hơn bằng tiếng Việt, bao gồm:
        1. Giải thích chi tiết tại sao thí sinh được chấm điểm như vậy
        2. Ví dụ cụ thể từ bài nói (Do / Don't)
        3. Gợi ý cụm từ/cấu trúc nên dùng để cải thiện

        Trả về JSON:
        {{
            "detailed_explanation": "Phân tích chi tiết...",
            "examples": ["Do: ...", "Don't: ..."],
            "suggested_phrases": ["However, ...", "Moreover, ..."]
        }}
        """
        
        try:
            if self.provider == "gemini":
                return await self._call_gemini_stage2(prompt)
            else:
                return await self._call_openai_stage2(prompt)
        except Exception as e:
            logger.error(f"Explain more failed: {str(e)}")
            return {
                "detailed_explanation": "Không thể tạo phân tích chi tiết lúc này. Vui lòng thử lại.",
                "examples": [],
                "suggested_phrases": []
            }

    async def _call_gemini_stage2(self, prompt: str) -> Dict[str, Any]:
        """Call Google Gemini 2.0 Flash for Stage 2 with enforced IELTS examiner context."""

        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

        params = {"key": self.gemini_key}
        payload = {
            "system_instruction": {
                "parts": [{
                    "text": (
                        "Bạn là giám khảo IELTS Speaking chuyên nghiệp, tuân thủ NGHIÊM NGẶT các tiêu chí chấm điểm "
                        "chính thức của British Council/IDP. "
                        "Quy tắc bắt buộc:\n"
                        "1. Chỉ chấm điểm dựa trên transcript thực tế được cung cấp - KHÔNG bịa đặt nội dung.\n"
                        "2. Score phải là số thực 0.0-9.0 theo thang IELTS (bước 0.5), dựa trên bằng chứng cụ thể.\n"
                        "3. Feedback phải bằng Tiếng Việt, cụ thể, có dẫn chứng từ bài nói.\n"
                        "4. model_answer phải là bản Band 8.5+ đầy đủ, dùng cấu trúc AREA và từ nối signposting.\n"
                        "5. KHÔNG trả về placeholder, '...', hoặc 'N/A' trong bất kỳ trường nào.\n"
                        "6. Output phải là JSON hợp lệ - không có markdown code fences."
                    )
                }]
            },
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "response_mime_type": "application/json"
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params, json=payload, timeout=45) as response:
                result = await response.json()
                if "error" in result:
                    raise ValueError(f"Gemini API error: {result['error'].get('message', 'Unknown')}")
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                # Strip markdown fences in case model disobeys mime type instruction
                text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
                return json.loads(text)

    async def _call_openai_stage2(self, prompt: str) -> Dict[str, Any]:
        """Call OpenAI/DeepSeek GPT API for Stage 2."""
        # DeepSeek often uses OpenAI-compatible SDK/endpoint
        # Here we use the OpenAI key as fallback
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "gpt-4-turbo-preview",
            "messages": [
                {"role": "system", "content": "You are an IELTS speaking assessment expert."},
                {"role": "user", "content": prompt}
            ],
            "response_format": { "type": "json_object" },
            "temperature": 0.3
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload, timeout=45) as response:
                result = await response.json()
                text = result["choices"][0]["message"]["content"]
                return json.loads(text)
