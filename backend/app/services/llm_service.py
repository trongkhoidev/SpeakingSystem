"""LLM service for linguistic analysis using Gemini, GPT, or DeepSeek."""

import asyncio
from google import genai
from typing import Optional, Dict, Any
from app.models.assessment import LexicalAnalysis, GrammarAnalysis
from app.core.config import settings
import json
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM-based linguistic analysis."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.deepseek_key = settings.DEEPSEEK_API_KEY
        self.groq_key = settings.GROQ_API_KEY
        
        if self.gemini_key:
            self.client = genai.Client(api_key=self.gemini_key)
        else:
            self.client = None
    
    async def analyze_lexical_resource(
        self,
        transcript: str,
        reference_level: str = "IELTS"
    ) -> LexicalAnalysis:
        """Analyze lexical resource using the configured LLM provider."""
        
        prompt = f"""
        Analyze the lexical resource (vocabulary) in this IELTS speaking response:
        "{transcript}"
        Evaluate on a scale of 0-9 and provide:
        1. Overall lexical score
        2. Specific feedback (Tiếng Việt)
        3. List of Band 8+ vocabulary items found
        4. Overall variety level (Limited, Adequate, Good, Excellent)
        Return as JSON with keys: score, feedback, word_list, variety_level
        """
        
        try:
            if self.provider == "deepseek":
                res = await self._call_deepseek(prompt)
                return LexicalAnalysis(**res)
            elif self.provider == "gemini":
                return await self._call_gemini(prompt, "lexical")
            elif self.provider == "groq":
                res = await self._call_groq(prompt)
                return LexicalAnalysis(**res)
            else:
                return await self._call_openai(prompt, "lexical")
        except Exception as e:
            logger.error(f"Lexical analysis failed: {str(e)}")
            return LexicalAnalysis(score=5.0, feedback="Analysis temporarily unavailable", word_list=[], variety_level="Adequate")

    async def analyze_grammar(self, transcript: str) -> GrammarAnalysis:
        """Analyze grammar using the configured LLM provider."""
        
        prompt = f"""
        Analyze the grammatical accuracy in this IELTS speaking response:
        "{transcript}"
        Evaluate on a scale of 0-9 and provide:
        1. Overall grammar score
        2. Specific feedback on errors (Tiếng Việt)
        3. Count of grammatical errors
        4. Types of errors found
        5. Complexity level (Simple, Intermediate, Advanced)
        Return as JSON with keys: score, feedback, error_count, error_types, complexity_level
        """
        
        try:
            if self.provider == "deepseek":
                res = await self._call_deepseek(prompt)
                return GrammarAnalysis(**res)
            elif self.provider == "gemini":
                return await self._call_gemini(prompt, "grammar")
            elif self.provider == "groq":
                res = await self._call_groq(prompt)
                return GrammarAnalysis(**res)
            else:
                return await self._call_openai(prompt, "grammar")
        except Exception as e:
            logger.error(f"Grammar analysis failed: {str(e)}")
            return GrammarAnalysis(score=5.0, feedback="Analysis temporarily unavailable", error_count=0, error_types=[], complexity_level="Intermediate")

    async def analyze_comprehensive_stage2(
        self,
        question: str,
        transcript: str,
        azure_brief: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Stage 2: Comprehensive IELTS Assessment."""
        
        # IELTS Knowledge Base (Detailed Band Descriptors)
        band_descriptors_detailed = """
        IELTS SPEAKING BAND DESCRIPTORS (Summary):
        - Fluency & Coherence (FC):
          9: Speaks fluently with only rare repetition; content is fully developed.
          7: Speaks at length without effort; uses range of connectives/markers.
          5: Maintains flow but uses repetition/self-correction; over-uses certain markers.
        - Lexical Resource (LR):
          9: Uses vocabulary with full flexibility and precision; idiomatic.
          7: Uses less common and idiomatic vocabulary; shows some style/collocation.
          5: Manages to talk about familiar topics; limited range for unfamiliar ones.
        - Grammatical Range & Accuracy (GRA):
          9: Uses full range of structures naturally and appropriately; rare errors.
          7: Uses a range of complex structures; frequently error-free.
          5: Produces basic sentence forms with reasonable accuracy; limited range.
        """

        prompt = f"""
        System: You are a STRICT and UNBIASED Senior IELTS Examiner. Your goal is to provide a transparent, accurate, and professional assessment. 
        DO NOT default to Band 5.0. If the student performs poorly, give 4.0 or lower. If they perform exceptionally, give 8.0+.
        
        {band_descriptors_detailed}

        Evaluation Strategy:
        1. BE RIGOROUS: Analyze every word. Identify pauses, repetitions, and filler words.
        2. CONTENT MATTERS: Check if the answer actually makes sense and addresses the question. Point out semantic errors (sai lệch ngữ nghĩa) or logical gaps.
        3. TRANSPARENCY: In the "reasoning" fields (VIETNAMESE), you MUST mention specific criteria from the band descriptors above to justify the score.
        4. FEEDBACK DEPTH: Explain EXACTLY why the user is at their current band. E.g., "Bạn đạt 5.0 vì lặp từ 'think' 4 lần và không dùng được câu phức nào."
        5. UPGRADER: Provide an "improved_sample_answer" that is approximately 1.5 bands higher. The sample answer must be natural and demonstrate high-level collocations.
        
        LANGUAGE RULES:
        - Evaluation fields ("thought_process", "reasoning", "content_errors"): Use VIETNAMESE.
        - Suggestion/Instruction fields ("solution", "overall_advice", "usage"): Use ENGLISH.
        - Sample Answer field ("improved_sample_answer"): Use ENGLISH.
        - Dictionary fields ("meaning"): Use VIETNAMESE.

        Task: Grade this transcript: "{transcript}" for question: "{question}".
        
        Output JSON ONLY:
        {{
            "thought_process": "Phân tích tổng quan về phong độ, lỗi nội dung và tiềm năng (Tiếng Việt).",
            "content_errors": "Chỉ ra các lỗi sai về mặt nội dung, logic hoặc dùng sai từ làm lệch ngữ nghĩa (Tiếng Việt).",
            "FC": {{ 
                "score": <float>, 
                "reasoning": "Dẫn chứng cụ thể từ bài nói so với band descriptors (Tiếng Việt).", 
                "solution": "Specific techniques to improve fluency (English)."
            }},
            "LR": {{ 
                "score": <float>, 
                "reasoning": "Phân tích độ rộng và độ chính xác của từ vựng (Tiếng Việt).", 
                "solution": "Key vocabulary areas to focus on (English)."
            }},
            "GRA": {{ 
                "score": <float>, 
                "reasoning": "Phân tích cấu trúc câu và lỗi sai (Tiếng Việt).", 
                "solution": "Grammar structures to master for the next level (English)."
            }},
            "upgrader": {{
                "target_band": <float>,
                "topic_vocabulary": [{{ "phrase": "English Phrase", "meaning": "Nghĩa tiếng Việt", "usage": "English usage example" }}],
                "collocations": [{{ "phrase": "English Collocation", "meaning": "Nghĩa tiếng Việt" }}],
                "idioms": [{{ "phrase": "English Idiom", "meaning": "Nghĩa tiếng Việt" }}],
                "improved_sample_answer": "A high-level professional response (English)."
            }},
            "overall_advice": "Clear roadmap for the student (English)"
        }}
        """

        try:
            if self.provider == "deepseek":
                return await self._call_deepseek(prompt)
            elif self.provider == "gemini":
                return await self._call_gemini_stage2(prompt)
            elif self.provider == "groq":
                return await self._call_groq(prompt)
            else:
                return await self._call_openai_stage2(prompt)
        except Exception as e:
            logger.error(f"Stage 2 failed: {str(e)}")
            return {
                "FC": {"score": 0.0, "reasoning": "Error", "solution": "", "signposting_found": []},
                "LR": {"score": 0.0, "reasoning": "Error", "solution": "", "suggested_collocations": [], "idioms_to_use": []},
                "GRA": {"score": 0.0, "reasoning": "Error", "solution": "", "errors": []},
                "model_answer": "Error",
                "overall_advice": "Error"
            }

    async def _call_deepseek(self, prompt: str) -> Dict[str, Any]:
        """Unified call to DeepSeek API using OpenAI SDK."""
        if not self.deepseek_key:
            raise ValueError("DEEPSEEK_API_KEY is not configured")

        client = AsyncOpenAI(
            api_key=self.deepseek_key,
            base_url="https://api.deepseek.com"
        )
        
        try:
            response = await client.chat.completions.create(
                model="deepseek-reasoner",
                messages=[
                    {"role": "system", "content": "You are a professional IELTS Speaking Examiner. Use Chain-of-Thought reasoning. Respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            content = response.choices[0].message.content
            # Sanitize response
            content = content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"DeepSeek Error: {str(e)}")
            raise ValueError(f"DeepSeek API error: {str(e)}")

    async def _call_groq(self, prompt: str) -> Dict[str, Any]:
        """Unified call to Groq API using OpenAI SDK."""
        if not self.groq_key:
            raise ValueError("GROQ_API_KEY is not configured")

        client = AsyncOpenAI(
            api_key=self.groq_key,
            base_url="https://api.groq.com/openai/v1"
        )
        
        try:
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional IELTS Speaking Examiner. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.2
            )
            content = response.choices[0].message.content
            content = content.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"Groq Error: {str(e)}")
            raise ValueError(f"Groq API error: {str(e)}")

    async def _call_gemini(self, prompt: str, mode: str) -> Any:
        """Legacy helper for Gemini analysis."""
        # Simple implementation for backward compatibility
        res = await self._call_gemini_stage2(prompt)
        if mode == "lexical":
            return LexicalAnalysis(**res)
        return GrammarAnalysis(**res)

    async def _call_gemini_stage2(self, prompt: str) -> Dict[str, Any]:
        """Call Google Gemini with multiple model fallbacks and OpenAI backup."""
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured")

        # List of models to try in order (confirmed live via ListModels as of 2026-04)
        models_to_try = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"]
        last_error = None

        for model_name in models_to_try:
            try:
                logger.info(f"Attempting Stage 2 Analysis with model: {model_name}")
                safety_settings = [
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
                ]

                # generate_content is synchronous — run in executor to avoid blocking the event loop
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.2,
                        "response_mime_type": "application/json",
                        "safety_settings": safety_settings
                    }
                )
                
                text_content = ""
                if hasattr(response, 'text') and response.text:
                    text_content = response.text
                elif hasattr(response, 'candidates') and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        text_content = candidate.content.parts[0].text
                
                if text_content:
                    return json.loads(text_content)
                    
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {str(e)}")
                last_error = e
                # If it's a 429 or 404, we try the next model in the loop
                continue

        # If all Gemini models failed, try OpenAI as a ultimate fallback
        if self.openai_key:
            try:
                logger.info("All Gemini models failed. Falling back to OpenAI (GPT-4o-mini)...")
                return await self._call_openai_stage2(prompt)
            except Exception as oa_err:
                logger.error(f"OpenAI fallback also failed: {str(oa_err)}")
        
        raise ValueError(f"All AI providers failed. Last error: {str(last_error)}")

    async def _call_openai_stage2(self, prompt: str) -> Dict[str, Any]:
        """Call OpenAI GPT using official SDK for consistency."""
        if not self.openai_key:
            raise ValueError("OPENAI_API_KEY is not configured")
            
        client = AsyncOpenAI(api_key=self.openai_key)
        try:
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={ "type": "json_object" },
                temperature=0.3
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI Error: {str(e)}")
            raise ValueError(f"OpenAI API error: {str(e)}")
