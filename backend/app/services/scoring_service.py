"""IELTS scoring service implementing official scoring formulas."""

import logging
from typing import Tuple
from app.models.assessment import BandScores

logger = logging.getLogger(__name__)


class ScoringService:
    """Service for calculating IELTS band scores."""
    
    # IELTS Band conversion table (0-100 to 0-9)
    BAND_THRESHOLDS = {
        90: 9.0,
        86: 8.5,
        83: 8.0,
        80: 7.5,
        75: 7.0,
        71: 6.5,
        67: 6.0,
        63: 5.5,
        59: 5.0,
        55: 4.5,
        51: 4.0,
        0: 0.0,
    }
    
    @staticmethod
    def calculate_pronunciation_band(
        accuracy_score: float,
        fluency_score: float,
        prosody_score: float
    ) -> float:
        """
        Calculate pronunciation band using weighted formula.
        
        Formula: Score_Pron = 0.6 × S_Acc + 0.2 × S_Flu + 0.2 × S_Pros
        
        All input scores should be 0-100 scale.
        Output is 0-9 band scale.
        
        Args:
            accuracy_score: Accuracy percentage (0-100)
            fluency_score: Fluency percentage (0-100)
            prosody_score: Prosody percentage (0-100)
        
        Returns:
            Pronunciation band score (0-9)
        """
        
        # Apply weighted formula
        weighted_score = (
            0.6 * accuracy_score +
            0.2 * fluency_score +
            0.2 * prosody_score
        )
        
        # Convert 0-100 to 0-9 band
        return ScoringService._convert_to_band(weighted_score)
    
    @staticmethod
    def calculate_fluency_coherence(
        prosody_score: float,
        completeness_score: float,
        word_count: int,
        logical_flow_assessment: float
    ) -> float:
        """
        Calculate Fluency & Coherence band.
        
        Args:
            prosody_score: From Azure (0-100)
            completeness_score: From Azure (0-100)
            word_count: Number of words in response
            logical_flow_assessment: Subjective assessment (0-100)
        
        Returns:
            Fluency & Coherence band (0-9)
        """
        
        # IELTS requires 40-150 words per response (rough guideline)
        completeness_factor = min(100, (word_count / 150) * 100)
        
        weighted_score = (
            0.3 * prosody_score +
            0.3 * completeness_score +
            0.2 * completeness_factor +
            0.2 * logical_flow_assessment
        )
        
        return ScoringService._convert_to_band(weighted_score)
    
    @staticmethod
    def calculate_overall_band(band_scores: BandScores) -> float:
        """
        Calculate overall IELTS band from 4 criteria.
        
        According to IELTS guidelines, overall band is averaged from:
        - Fluency & Coherence
        - Lexical Resource
        - Grammatical Accuracy
        - Pronunciation
        
        Then rounded using IELTS rules (0.5 rounds to 1, 6.5 rounds to 7).
        
        Args:
            band_scores: BandScores object with all 4 criteria
        
        Returns:
            Overall band (0-9)
        """
        
        # Access attributes correctly from BandScores model
        average = (
            band_scores.fluency_coherence +
            band_scores.lexical_resource +
            band_scores.grammatical_accuracy +
            band_scores.pronunciation
        ) / 4
        
        # IELTS rounding rules
        return ScoringService._round_ielts(average)
    
    @staticmethod
    def _convert_to_band(percentage_score: float) -> float:
        """
        Convert percentage score (0-100) to IELTS band (0-9).
        
        Uses threshold-based conversion following approximate IELTS scale.
        
        Args:
            percentage_score: Score from 0-100
        
        Returns:
            Band score from 0-9
        """
        
        for threshold, band in sorted(ScoringService.BAND_THRESHOLDS.items(), reverse=True):
            if percentage_score >= threshold:
                return band
        
        return 0.0
    
    @staticmethod
    def _round_ielts(score: float) -> float:
        """
        Apply IELTS rounding rules.
        
        - 0.0 to 0.25: round down
        - 0.25 to 0.75: round to 0.5
        - 0.75 to 1.0: round up
        
        Args:
            score: Score with decimals
        
        Returns:
            IELTS standard rounded score
        """
        
        integer_part = int(score)
        decimal_part = score - integer_part
        
        if decimal_part < 0.25:
            return float(integer_part)
        elif decimal_part < 0.75:
            return float(integer_part) + 0.5
        else:
            return float(integer_part + 1)
    
    @staticmethod
    def generate_band_feedback(band_scores: BandScores) -> str:
        """
        Generate human-readable feedback based on band scores.
        
        Args:
            band_scores: BandScores object
        
        Returns:
            Feedback string
        """
        
        feedback_parts = []
        
        if band_scores.pronunciation < 5.0:
            feedback_parts.append(
                f"Pronunciation needs improvement ({band_scores.pronunciation}/9). "
                "Focus on vowel sounds and word stress."
            )
        
        if band_scores.lexical_resource < 5.5:
            feedback_parts.append(
                f"Vocabulary range is limited ({band_scores.lexical_resource}/9). "
                "Try to use more sophisticated expressions."
            )
        
        if band_scores.grammatical_accuracy < 5.5:
            feedback_parts.append(
                f"Grammar accuracy needs work ({band_scores.grammatical_accuracy}/9). "
                "Pay attention to tense consistency and subject-verb agreement."
            )
        
        if band_scores.fluency_coherence < 5.5:
            feedback_parts.append(
                f"Fluency and coherence could be stronger ({band_scores.fluency_coherence}/9). "
                "Use linking words and speak more naturally."
            )
        
        if not feedback_parts:
            feedback_parts.append("Strong performance across all criteria!")
        
        return " ".join(feedback_parts)
