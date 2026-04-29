"""Gatekeeper service (Stage 0) for relevance check."""

import logging
import numpy as np
from typing import Tuple, Dict, Any
from scipy.spatial.distance import cosine
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

from app.services.llm_service import LLMService

class GatekeeperService:
    """
    Stage 0: The Gatekeeper.
    Ensures the student's answer is relevant to the question.
    Uses Gemini Embeddings + Cosine Similarity + DeepSeek Reasoning.
    """
    
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.llm_service = LLMService()
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
        
    async def check_relevance(self, question: str, transcript: str) -> Tuple[bool, int]:
        """
        Perform a multi-step relevance check.
        """
        
        if not transcript or len(transcript.strip()) < 10:
            return False, 0

        # If Gemini is known to be problematic/blocked, skip to LLM reasoning directly
        # For now, we try embeddings but catch the specific 403/404 errors
        try:
            model = 'models/embedding-001'
            q_emb = genai.embed_content(model=model, content=question, task_type="retrieval_query")["embedding"]
            a_emb = genai.embed_content(model=model, content=transcript, task_type="retrieval_document")["embedding"]
            
            similarity = 1 - cosine(q_emb, a_emb)
            score = int(similarity * 100)
            
            logger.info(f"Gatekeeper: Cosine Similarity = {similarity:.4f}")
            
            if similarity > 0.65:
                return True, score
            elif similarity < 0.30:
                return False, score
            else:
                return await self._llm_reasoning(question, transcript, score)
                
        except Exception as e:
            logger.warning(f"Gatekeeper Embedding skipped or failed: {str(e)}")
            # Fallback to LLM reasoning (OpenAI/DeepSeek/Gemini)
            return await self._llm_reasoning(question, transcript, 50)

    async def _llm_reasoning(self, question: str, transcript: str, base_score: int) -> Tuple[bool, int]:
        """Deep semantic check using the configured LLM provider."""
        
        prompt = f"""
        Analyze if transcript is relevant to question.
        Q: "{question}"
        A: "{transcript}"
        
        JSON ONLY: {{"is_relevant": bool, "relevance_score": 0-100, "reason": "VN reasoning"}}
        """
        
        try:
            res_json = {}
            if self.llm_service.provider == 'openai':
                res_json = await self.llm_service._call_openai_stage2(prompt)
            elif self.llm_service.provider == 'deepseek':
                res_json = await self.llm_service._call_deepseek(prompt)
            elif self.llm_service.provider == 'groq':
                res_json = await self.llm_service._call_groq(prompt)
            else:
                # Default to gemini fallback logic
                res_json = await self.llm_service._call_gemini_stage2(prompt)
            
            return res_json.get("is_relevant", True), res_json.get("relevance_score", base_score)
            
        except Exception as e:
            logger.error(f"Gatekeeper LLM Reasoning failed: {str(e)}")
            return True, base_score
