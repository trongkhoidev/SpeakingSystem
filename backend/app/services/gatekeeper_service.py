"""Gatekeeper service (Stage 0) for relevance check."""

import logging
import numpy as np
from typing import Tuple, Dict, Any
from scipy.spatial.distance import cosine
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class GatekeeperService:
    """
    Stage 0: The Gatekeeper.
    Ensures the student's answer is relevant to the question.
    Uses Gemini Embeddings + Cosine Similarity + LLM Reasoning.
    """
    
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
        
    async def check_relevance(self, question: str, transcript: str) -> Tuple[bool, int]:
        """
        Perform a multi-step relevance check.
        
        1. Calculate Cosine Similarity of embeddings.
        2. If in doubt (0.4 - 0.6), use LLM for deep reasoning.
        
        Returns: (is_relevant, relevance_score)
        """
        
        if not transcript or len(transcript.strip()) < 10:
            return False, 0

        try:
            # 1. Get Embeddings using Gemini
            # Note: Using embedding-001 or text-embedding-004
            model = 'models/text-embedding-004'
            
            q_emb = genai.embed_content(model=model, content=question, task_type="retrieval_query")["embedding"]
            a_emb = genai.embed_content(model=model, content=transcript, task_type="retrieval_document")["embedding"]
            
            # calculate cosine similarity (1 - cosine distance)
            similarity = 1 - cosine(q_emb, a_emb)
            score = int(similarity * 100)
            
            logger.info(f"Gatekeeper: Cosine Similarity = {similarity:.4f}")
            
            # 2. Decision Logic
            if similarity > 0.6:
                return True, score
            elif similarity < 0.35:
                return False, score
            else:
                # Grey area: 0.35 - 0.60. Use LLM Reasoning.
                return await self._llm_reasoning(question, transcript, score)
                
        except Exception as e:
            logger.error(f"Gatekeeper error: {str(e)}")
            # Fallback to LLM only if embeddings fail
            return await self._llm_reasoning(question, transcript, 50)

    async def _llm_reasoning(self, question: str, transcript: str, base_score: int) -> Tuple[bool, int]:
        """Deep semantic check using LLM."""
        
        prompt = f"""
        Analyze if the following student response is relevant to the IELTS question.
        A response is relevant if it attempts to answer the question, even if briefly or with poor language.
        It is IRRELEVANT only if it talks about a completely different topic (e.g., question is about "Hobby" but student talks about "Weather").
        
        Question: "{question}"
        Student Response: "{transcript}"
        
        Return ONLY a JSON object:
        {{
            "is_relevant": boolean,
            "relevance_score": 0-100,
            "reason": "Brief explanation"
        }}
        """
        
        try:
            # Use Gemini Pro for reasoning
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            import json
            # Clean response text in case of markdown formatting
            text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(text)
            
            return data.get("is_relevant", True), data.get("relevance_score", base_score)
            
        except Exception as e:
            logger.error(f"LLM Reasoning failed: {str(e)}")
            # If everything fails, be lenient and allow the assessment to proceed
            return True, base_score
