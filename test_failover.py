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

    def test_dynamic_confidence_adjustments(self):
        # Clear API keys to prevent external calls and force local rules fallback
        gemini_key = os.environ.get("GEMINI_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
            
        try:
            # 1. Interacting with greetings ("hi", "hello", "yo") does not set last_question_relevant to true
            for greeting in ["hi", "hello", "yo"]:
                service.generate_answer("DEV1248", greeting, self.db)
                state = service.get_or_create_state(self.db, "DEV1248")
                self.assertEqual(state.last_question_relevant, 0)
                
            # 2. Sending a relevant question ("Why was this recommended?") sets last_question_relevant to true
            service.generate_answer("DEV1248", "Why was this recommended?", self.db)
            state = service.get_or_create_state(self.db, "DEV1248")
            self.assertEqual(state.last_question_relevant, 1)
            
            # Record base confidence
            base_confidence = state.confidence
            base_trust = state.trust_score
            
            # 3. Positive feedback on a relevant question increases the confidence score
            res_pos = service.record_feedback("DEV1248", True, self.db)
            self.assertEqual(res_pos["confidence"], base_confidence + 5)
            self.assertGreater(res_pos["updated_trust_score"], base_trust)
            
            # Record confidence after positive feedback
            state = service.get_or_create_state(self.db, "DEV1248")
            conf_after_pos = state.confidence
            
            # 4. Negative feedback on a relevant question decreases the confidence score
            # First, send another relevant question to set last_question_relevant to true
            service.generate_answer("DEV1248", "What evidence supports this?", self.db)
            state = service.get_or_create_state(self.db, "DEV1248")
            self.assertEqual(state.last_question_relevant, 1)
            
            res_neg = service.record_feedback("DEV1248", False, self.db)
            self.assertEqual(res_neg["confidence"], conf_after_pos - 5)
            
            # 5. Feedback on an irrelevant greeting question does not change the confidence score
            # Send greeting
            service.generate_answer("DEV1248", "yo", self.db)
            state = service.get_or_create_state(self.db, "DEV1248")
            self.assertEqual(state.last_question_relevant, 0)
            
            conf_before_greeting_feedback = state.confidence
            trust_before_greeting_feedback = state.trust_score
            
            res_greet = service.record_feedback("DEV1248", True, self.db)
            self.assertEqual(res_greet["confidence"], conf_before_greeting_feedback)
            self.assertEqual(res_greet["updated_trust_score"], trust_before_greeting_feedback)
            
        finally:
            if gemini_key:
                os.environ["GEMINI_API_KEY"] = gemini_key
            if groq_key:
                os.environ["GROQ_API_KEY"] = groq_key

    def test_conversational_mode(self):
        # 1. Test greeting responses and intent classification
        res_hi = service.generate_answer("DEV1248", "Hi", self.db)
        self.assertEqual(res_hi["intent"], "GREETING")
        self.assertIn("copilot", res_hi["answer"].lower())
        self.assertEqual(res_hi["trust_update_allowed"], False)
        self.assertFalse(res_hi["requires_feedback"])
        
        # Greetings suggested questions
        self.assertEqual(res_hi["suggested_questions"], [
            "Show active recommendations",
            "Explain trust scores",
            "How does TrustLens work?",
            "Review recent incidents"
        ])
        
        res_hello = service.generate_answer("DEV1248", "Hello", self.db)
        self.assertEqual(res_hello["intent"], "GREETING")
        self.assertIn("welcome back", res_hello["answer"].lower())
        self.assertEqual(res_hello["trust_update_allowed"], False)
        
        # 2. General Chat / Capabilities
        res_capabilities = service.generate_answer("DEV1248", "What can you do?", self.db)
        self.assertEqual(res_capabilities["intent"], "HELP")
        self.assertIn("analyze security recommendations", res_capabilities["answer"].lower())
        self.assertEqual(res_capabilities["trust_update_allowed"], False)
        
        res_role = service.generate_answer("DEV1248", "Who are you?", self.db)
        self.assertEqual(res_role["intent"], "GENERAL_CHAT")
        self.assertEqual(res_role["trust_update_allowed"], False)
        
        res_work = service.generate_answer("DEV1248", "How does TrustLens work?", self.db)
        self.assertEqual(res_work["intent"], "GENERAL_CHAT")
        self.assertEqual(res_work["trust_update_allowed"], False)
        
        res_trust = service.generate_answer("DEV1248", "Explain trust scores", self.db)
        self.assertEqual(res_trust["intent"], "TRUST_QUERY")
        self.assertEqual(res_trust["trust_update_allowed"], False)
        
        # Verify scores have not changed from baseline
        state = service.get_or_create_state(self.db, "DEV1248")
        self.assertEqual(state.questions_asked, 0)
        self.assertEqual(state.understanding_score, 60)
        
        # 3. Recommendation query references trigger trust calculations
        # Clear API keys to force fallback
        gemini_key = os.environ.get("GEMINI_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
        if "GROQ_API_KEY" in os.environ:
            del os.environ["GROQ_API_KEY"]
            
        try:
            # First recommendation query (triggering activation)
            res_rec1 = service.generate_answer("DEV1248", "Why quarantine DEV1248?", self.db)
            self.assertEqual(res_rec1["intent"], "RECOMMENDATION_QUERY")
            self.assertEqual(res_rec1["trust_update_allowed"], False) # orig_trust_allowed was False
            self.assertTrue(res_rec1["requires_feedback"])
            
            # Since it was relevant, scores should now be updated!
            state = service.get_or_create_state(self.db, "DEV1248")
            self.assertEqual(state.trust_update_allowed, 1)
            self.assertEqual(state.questions_asked, 1)
            self.assertGreater(state.understanding_score, 60)
            
            # Second recommendation query (trust update is now already allowed)
            res_rec2 = service.generate_answer("DEV1248", "What evidence supports this?", self.db)
            self.assertEqual(res_rec2["intent"], "EVIDENCE_QUERY")
            self.assertEqual(res_rec2["trust_update_allowed"], True) # orig_trust_allowed is now True
            self.assertTrue(res_rec2["requires_feedback"])
            
        finally:
            if gemini_key:
                os.environ["GEMINI_API_KEY"] = gemini_key
            if groq_key:
                os.environ["GROQ_API_KEY"] = groq_key
        
if __name__ == "__main__":
    unittest.main()
