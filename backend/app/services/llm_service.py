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
        
        # IELTS Knowledge Base (Token-Optimized)
        band_descriptors = """
        - FC: 9 (Fluent, integrated), 7 (Lengthy, discourse markers), 5 (Repetitive, basic).
        - LR: 9 (Precise, idiomatic), 7 (Less common items), 5 (Limited range).
        - GRA: 9 (Flexible, accurate), 7 (Complex structures), 5 (Basic forms, errors).
        """
        prompt = f"""
        System: You are a Senior IELTS Examiner. Use the following Band Descriptors: {band_descriptors}
        
        Evaluation Strategy:
        1. Be SHARP and SPECIFIC. Avoid generic feedback.
        2. When guiding answer development (in the "solution" fields), apply the WHY-WHAT-HOW-WHEN-WHO framework.
        3. Identify the current band level of the response.
        4. Provide an "improved_sample_answer" that is approximately 1.0 band higher than the current level (e.g., if user is 5.0, target 6.0+).
        5. The sample answer must be professional, natural, and demonstrate exactly how to move to the next level.
        
        LANGUAGE RULES:
        - Evaluation fields ("thought_process", "reasoning"): Use VIETNAMESE to explain the scores and identify errors.
        - Suggestion/Instruction fields ("solution", "overall_advice", "usage"): Use ENGLISH.
        - Sample Answer field ("improved_sample_answer"): Use ENGLISH.
        - Dictionary fields ("meaning"): Use VIETNAMESE.

        Task: Grade this transcript: "{transcript}" for question: "{question}".
        
        Output JSON ONLY:
        {{
            "thought_process": "Phân tích chi tiết lỗi sai và điểm mạnh (Tiếng Việt).",
            "FC": {{ 
                "score": <float>, 
                "reasoning": "Tại sao đạt điểm này? (Tiếng Việt)", 
                "solution": "Detailed instructions on how to develop the answer using WHY-WHAT-HOW (English)"
            }},
            "LR": {{ 
                "score": <float>, 
                "reasoning": "Phân tích từ vựng (Tiếng Việt)", 
                "solution": "Suggestions for expanding vocabulary range and precision (English)"
            }},
            "GRA": {{ 
                "score": <float>, 
                "reasoning": "Phân tích ngữ pháp (Tiếng Việt)", 
                "solution": "Suggestions for using more complex structures and improving accuracy (English)"
            }},
            "upgrader": {{
                "target_band": <float>,
                "topic_vocabulary": [{{ "phrase": "English Phrase", "meaning": "Nghĩa tiếng Việt", "usage": "English usage example" }}],
                "collocations": [{{ "phrase": "English Collocation", "meaning": "Nghĩa tiếng Việt" }}],
                "idioms": [{{ "phrase": "English Idiom", "meaning": "Nghĩa tiếng Việt" }}],
                "improved_sample_answer": "A professional and natural IELTS response at the target band level (English)"
            }},
            "overall_advice": "General advice for improvement (English)"
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
        """Call Google Gemini using official SDK with safety settings and fallbacks."""
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured")

        try:
            # Use gemini-1.5-flash for higher stability on production
            # Relax safety settings to prevent false positives from blocking feedback
            safety_settings = [
                {"category": "HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]

            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config={
                    "temperature": 0.2,
                    "response_mime_type": "application/json",
                    "safety_settings": safety_settings
                }
            )
            
            # Robust extraction of text
            text_content = ""
            if hasattr(response, 'text') and response.text:
                text_content = response.text
            elif hasattr(response, 'candidates') and len(response.candidates) > 0:
                # Fallback to manual extraction if .text is restricted
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    text_content = candidate.content.parts[0].text
            
            if not text_content:
                logger.error(f"Gemini returned empty content. Response: {response}")
                raise ValueError("Empty response from Gemini")
                
            return json.loads(text_content)
        except Exception as e:
            logger.error(f"Gemini SDK Error: {str(e)}")
            if 'candidates' in str(e):
                logger.error("Gemini 'candidates' error typically means safety filters blocked the response.")
            raise ValueError(f"Gemini API error: {str(e)}")

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
