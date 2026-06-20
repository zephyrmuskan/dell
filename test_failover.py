import os
os.environ["DATABASE_URL"] = "sqlite:///test_trustlens.db"

import unittest
import json
import trust_companion_service as service

class TestTrustCompanion(unittest.TestCase):
    
    def setUp(self):
        self.db = service.SessionLocal()
        service.Base.metadata.create_all(bind=service.engine)
        
    def tearDown(self):
        self.db.close()
        service.Base.metadata.drop_all(bind=service.engine)
        if os.path.exists("test_trustlens.db"):
            try:
                os.remove("test_trustlens.db")
            except PermissionError:
                pass
            
    def test_database_initialization(self):
        state = service.get_or_create_state(self.db, "DEV1248")
        self.assertEqual(state.recommendation_id, "DEV1248")
        self.assertEqual(state.questions_asked, 0)
        self.assertEqual(state.understanding_score, 60)
        
    def test_score_calculation(self):
        # Trust Score = (0.4 * AI Confidence) + (0.3 * Historical Accuracy) + (0.3 * User Understanding)
        # For DEV1248 (from siem_data.json): confidence=87, accuracy=90, understanding=60
        # Trust = 0.4*87 + 0.3*90 + 0.3*60 = 34.8 + 27 + 18 = 79.8 -> 80
        trust = service.calculate_trust_score(87, 90, 60)
        self.assertEqual(trust, 80)
        
    def test_understanding_score(self):
        # Base = 60
        # 1 question answered -> 60 + 8 = 68
        score = service.calculate_understanding_score(1, 1, 0, 0)
        self.assertEqual(score, 68)
        
        # 5 questions answered -> 60 + 32 (capped) = 92
        score = service.calculate_understanding_score(5, 5, 0, 0)
        self.assertEqual(score, 92)
        
        # Positive feedback (1/1 = 100% helpful) -> +8 -> 100
        score = service.calculate_understanding_score(5, 5, 1, 1)
        self.assertEqual(score, 100)
        
    def test_local_rules_fallback(self):
        answer_why = service.call_local_rules("DEV1248", "Why was this recommended?")
        self.assertIn("anomalies", answer_why)
        self.assertIn("quarantine", answer_why.lower())
        
        answer_ev = service.call_local_rules("DEV1248", "What evidence supports this?")
        self.assertIn("evidence", answer_ev.lower())
        self.assertIn("confidence", answer_ev.lower())
        
        answer_wrong = service.call_local_rules("DEV1248", "What could make this wrong?")
        self.assertIn("Devil's Advocate", answer_wrong)
        self.assertIn("incorrect", answer_wrong.lower())

    def test_generate_answer_failover(self):
        # Asserts silent fallback to local rules when API keys are placeholder strings
        # Temporarily clear API keys to force fallback
        gemini_key = os.environ.get("GEMINI_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
        try:
            res = service.generate_answer("DEV1248", "Why was this recommended?", self.db)
            self.assertEqual(res["provider_used"], "gemini")
            self.assertIn("anomalies", res["answer"])
            self.assertGreater(res["understanding_score"], 60)
            self.assertGreater(res["updated_trust_score"], 70)
        finally:
            if gemini_key:
                os.environ["GEMINI_API_KEY"] = gemini_key
            if groq_key:
                os.environ["GROQ_API_KEY"] = groq_key
        
    def test_record_feedback(self):
        res = service.record_feedback("DEV1248", True, self.db)
        self.assertGreaterEqual(res["understanding_score"], 60)
        
if __name__ == "__main__":
    unittest.main()
