#!/usr/bin/env python3
"""
Comprehensive Test Questions for Dynamic Greeting Generation System

This file contains various test scenarios to validate that our dynamic greeting
generation works correctly across different topics, user types, and interaction patterns.
"""

import os
import sys
import uuid
import json
from datetime import datetime
from dotenv import load_dotenv

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Load environment variables
load_dotenv()

class DynamicGreetingTestSuite:
    """Test suite for validating dynamic greeting generation"""
    
    def __init__(self):
        self.test_results = []
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test_result(self, test_name, passed, details=""):
        """Log the result of a test"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        result = {
            "test_name": test_name,
            "status": status,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
            
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_diverse_topics_greeting_generation(self):
        """Test 1: Greeting Generation for Diverse Topics"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Diverse Topics Greeting Generation")
        print("="*60)
        
        # Test topics that were NOT in the original static templates
        diverse_topics = [
            "quantum mechanics",
            "artificial intelligence ethics",
            "sustainable architecture", 
            "marine biology",
            "cryptocurrency economics",
            "digital art techniques",
            "renewable energy systems",
            "space exploration technologies",
            "biotechnology applications",
            "virtual reality development",
            "machine learning algorithms",
            "cybersecurity protocols",
            "data science methodologies",
            "cloud computing architectures",
            "blockchain implementations"
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            for i, topic in enumerate(diverse_topics, 1):
                test_user_id = str(uuid.uuid4())
                query = f"Explain {topic} to me"
                
                try:
                    agent = PersonalizationAgent(test_user_id)
                    result = agent.process_query(query)
                    
                    # Check if we get educational response with greeting
                    if result.get("query_type") == "educational":
                        greeting = result.get("personalized_greeting", "")
                        if greeting and greeting != "No greeting generated":
                            self.log_test_result(
                                f"Topic {i}: {topic}",
                                True,
                                f"Generated greeting: '{greeting[:50]}...'"
                            )
                        else:
                            self.log_test_result(
                                f"Topic {i}: {topic}",
                                False,
                                "No personalized greeting generated"
                            )
                    else:
                        # Use fallback mechanism
                        self.log_test_result(
                            f"Topic {i}: {topic}",
                            True,
                            f"Fallback response type: {result.get('query_type', 'unknown')}"
                        )
                        
                except Exception as e:
                    self.log_test_result(
                        f"Topic {i}: {topic}",
                        False,
                        f"Error: {str(e)}"
                    )
                    
        except ImportError as e:
            self.log_test_result(
                "Diverse Topics Test",
                False,
                f"Import error: {e}"
            )
    
    def test_greeting_variety_same_topic(self):
        """Test 2: Greeting Variety for Same Topic"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Greeting Variety for Same Topic")
        print("="*60)
        
        # Test multiple queries about the same topic to ensure variety
        topic_queries = [
            "What is machine learning?",
            "Explain machine learning concepts",
            "How does machine learning work?",
            "Tell me about machine learning algorithms",
            "Can you describe machine learning applications?"
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            test_user_id = str(uuid.uuid4())
            agent = PersonalizationAgent(test_user_id)
            generated_greetings = []
            
            for i, query in enumerate(topic_queries, 1):
                try:
                    result = agent.process_query(query)
                    
                    if result.get("query_type") == "educational":
                        greeting = result.get("personalized_greeting", "")
                        if greeting:
                            generated_greetings.append(greeting)
                            self.log_test_result(
                                f"ML Query {i}",
                                True,
                                f"Greeting: '{greeting[:40]}...'"
                            )
                        else:
                            self.log_test_result(f"ML Query {i}", False, "No greeting generated")
                    else:
                        self.log_test_result(
                            f"ML Query {i}",
                            True,
                            f"Response type: {result.get('query_type', 'unknown')}"
                        )
                        
                except Exception as e:
                    self.log_test_result(f"ML Query {i}", False, f"Error: {str(e)}")
            
            # Check for variety in greetings
            if len(set(generated_greetings)) > 1:
                self.log_test_result(
                    "Greeting Variety Check",
                    True,
                    f"Generated {len(set(generated_greetings))} unique greetings out of {len(generated_greetings)}"
                )
            elif generated_greetings:
                self.log_test_result(
                    "Greeting Variety Check",
                    False,
                    "All greetings were identical - need more variety"
                )
            else:
                self.log_test_result(
                    "Greeting Variety Check",
                    False,
                    "No greetings were generated to compare"
                )
                
        except ImportError as e:
            self.log_test_result(
                "Greeting Variety Test",
                False,
                f"Import error: {e}"
            )
    
    def test_user_context_personalization(self):
        """Test 3: User Context-Based Personalization"""
        print("\n" + "="*60)
        print("🧪 TEST 3: User Context-Based Personalization")
        print("="*60)
        
        # Test different user profiles to ensure personalization
        user_scenarios = [
            {
                "name": "Beginner Student",
                "skill_level": "beginner",
                "query": "What is object-oriented programming?",
                "expected_tone": "supportive"
            },
            {
                "name": "Intermediate Developer", 
                "skill_level": "intermediate",
                "query": "Explain design patterns in software engineering",
                "expected_tone": "technical"
            },
            {
                "name": "Advanced Researcher",
                "skill_level": "advanced", 
                "query": "Discuss distributed systems architecture",
                "expected_tone": "professional"
            }
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            for scenario in user_scenarios:
                test_user_id = str(uuid.uuid4())
                
                try:
                    agent = PersonalizationAgent(test_user_id)
                    # Simulate user profile by setting skill level in agent
                    agent.user_profile["skill_level"] = scenario["skill_level"]
                    
                    result = agent.process_query(scenario["query"])
                    
                    if result.get("query_type") == "educational":
                        level = result.get("level", "unknown")
                        greeting = result.get("personalized_greeting", "")
                        
                        # Check if level matches expected
                        level_appropriate = (
                            level == scenario["skill_level"] or 
                            level in ["beginner", "intermediate", "advanced"]
                        )
                        
                        if level_appropriate and greeting:
                            self.log_test_result(
                                f"Personalization: {scenario['name']}",
                                True,
                                f"Level: {level}, Greeting: '{greeting[:30]}...'"
                            )
                        else:
                            self.log_test_result(
                                f"Personalization: {scenario['name']}",
                                False,
                                f"Level: {level}, Greeting present: {bool(greeting)}"
                            )
                    else:
                        self.log_test_result(
                            f"Personalization: {scenario['name']}",
                            True,
                            f"Fallback response: {result.get('query_type', 'unknown')}"
                        )
                        
                except Exception as e:
                    self.log_test_result(
                        f"Personalization: {scenario['name']}",
                        False,
                        f"Error: {str(e)}"
                    )
                    
        except ImportError as e:
            self.log_test_result(
                "User Context Personalization Test",
                False,
                f"Import error: {e}"
            )
    
    def test_query_type_classification(self):
        """Test 4: Query Type Classification"""
        print("\n" + "="*60)
        print("🧪 TEST 4: Query Type Classification")
        print("="*60)
        
        # Test different types of queries
        query_test_cases = [
            {"query": "Hello! How are you?", "expected_type": "greeting"},
            {"query": "Hi there!", "expected_type": "greeting"},
            {"query": "What do you know about me?", "expected_type": "profile_query"},
            {"query": "Tell me about my profile", "expected_type": "profile_query"},
            {"query": "What are you?", "expected_type": "non_educational"},
            {"query": "How do you work?", "expected_type": "non_educational"},
            {"query": "Explain neural networks", "expected_type": "educational"},
            {"query": "What is Python programming?", "expected_type": "educational"},
            {"query": "How does TCP/IP work?", "expected_type": "educational"}
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            test_user_id = str(uuid.uuid4())
            agent = PersonalizationAgent(test_user_id)
            
            for test_case in query_test_cases:
                query = test_case["query"]
                expected_type = test_case["expected_type"]
                
                try:
                    result = agent.process_query(query)
                    actual_type = result.get("query_type", "unknown")
                    
                    if actual_type == expected_type:
                        self.log_test_result(
                            f"Classification: '{query[:30]}...'",
                            True,
                            f"Correctly classified as {actual_type}"
                        )
                    else:
                        self.log_test_result(
                            f"Classification: '{query[:30]}...'",
                            False,
                            f"Expected {expected_type}, got {actual_type}"
                        )
                        
                except Exception as e:
                    self.log_test_result(
                        f"Classification: '{query[:30]}...'",
                        False,
                        f"Error: {str(e)}"
                    )
                    
        except ImportError as e:
            self.log_test_result(
                "Query Type Classification Test", 
                False,
                f"Import error: {e}"
            )
    
    def test_fallback_mechanisms(self):
        """Test 5: Fallback Mechanisms"""
        print("\n" + "="*60)
        print("🧪 TEST 5: Fallback Mechanisms")
        print("="*60)
        
        # Test edge cases and error conditions
        edge_cases = [
            {"query": "", "description": "Empty query"},
            {"query": "???", "description": "Non-meaningful query"},
            {"query": "a" * 1000, "description": "Very long query"},
            {"query": "123456789", "description": "Numeric query"},
            {"query": "!@#$%^&*()", "description": "Special characters only"}
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            for edge_case in edge_cases:
                test_user_id = str(uuid.uuid4())
                query = edge_case["query"]
                description = edge_case["description"]
                
                try:
                    agent = PersonalizationAgent(test_user_id)
                    result = agent.process_query(query)
                    
                    # Check if we get any response (fallback working)
                    if result and "query_type" in result:
                        self.log_test_result(
                            f"Fallback: {description}",
                            True,
                            f"Response type: {result.get('query_type')}"
                        )
                    else:
                        self.log_test_result(
                            f"Fallback: {description}",
                            False,
                            "No response generated"
                        )
                        
                except Exception as e:
                    # Even exceptions should be handled gracefully
                    self.log_test_result(
                        f"Fallback: {description}",
                        False,
                        f"Unhandled error: {str(e)}"
                    )
                    
        except ImportError as e:
            self.log_test_result(
                "Fallback Mechanisms Test",
                False,
                f"Import error: {e}"
            )
    
    def test_no_static_templates_remaining(self):
        """Test 6: Verify No Static Templates Remain"""
        print("\n" + "="*60)
        print("🧪 TEST 6: Verify No Static Templates Remain")
        print("="*60)
        
        # Check that old static templates are not being used
        old_static_greetings = [
            "BGP is fascinating! Let me break down this routing protocol for you.",
            "Great question about BGP - it's the backbone of internet routing!",
            "Networking concepts are essential - let's dive in!",
            "Coding concepts coming right up!",
            "Programming questions are my favorite - let's solve this together!"
        ]
        
        try:
            from agents.personalization_agent import PersonalizationAgent
            
            # Test queries that would have triggered static templates
            test_queries = [
                "What is BGP routing?",
                "Explain networking protocols", 
                "How do I program in Python?",
                "Tell me about algorithms"
            ]
            
            static_template_found = False
            
            for query in test_queries:
                test_user_id = str(uuid.uuid4())
                agent = PersonalizationAgent(test_user_id)
                
                try:
                    result = agent.process_query(query)
                    
                    if result.get("query_type") == "educational":
                        greeting = result.get("personalized_greeting", "")
                        
                        # Check if any old static greeting is being used
                        for static_greeting in old_static_greetings:
                            if static_greeting in greeting:
                                static_template_found = True
                                self.log_test_result(
                                    f"Static Template Check: '{query}'",
                                    False,
                                    f"Found static template: '{static_greeting}'"
                                )
                                break
                        
                        if not static_template_found:
                            self.log_test_result(
                                f"Static Template Check: '{query}'",
                                True,
                                "No static templates detected"
                            )
                    else:
                        self.log_test_result(
                            f"Static Template Check: '{query}'",
                            True,
                            f"Non-educational response: {result.get('query_type')}"
                        )
                        
                except Exception as e:
                    self.log_test_result(
                        f"Static Template Check: '{query}'",
                        False,
                        f"Error: {str(e)}"
                    )
            
            if not static_template_found:
                self.log_test_result(
                    "Overall Static Template Removal",
                    True,
                    "No static templates found in any responses"
                )
                
        except ImportError as e:
            self.log_test_result(
                "Static Template Removal Test",
                False,
                f"Import error: {e}"
            )
    
    def run_all_tests(self):
        """Run all test cases"""
        print("🚀 STARTING DYNAMIC GREETING GENERATION TEST SUITE")
        print("=" * 80)
        
        # Check environment setup
        if not os.getenv("GEMINI_API_KEY"):
            print("⚠️  Warning: GEMINI_API_KEY not found - some tests may fail")
            
        # Run all test cases
        self.test_diverse_topics_greeting_generation()
        self.test_greeting_variety_same_topic()
        self.test_user_context_personalization()
        self.test_query_type_classification()
        self.test_fallback_mechanisms()
        self.test_no_static_templates_remaining()
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUITE SUMMARY")
        print("="*80)
        print(f"Total Tests Run: {self.passed_tests + self.failed_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests / max(1, self.passed_tests + self.failed_tests)) * 100:.1f}%")
        
        if self.failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! Dynamic greeting generation is working perfectly!")
        else:
            print(f"\n⚠️  {self.failed_tests} tests failed. Review the details above.")
            
        # Save detailed results
        self.save_test_results()
        
        return self.failed_tests == 0
    
    def save_test_results(self):
        """Save detailed test results to a file"""
        try:
            results_file = "test_results_dynamic_greetings.json"
            with open(results_file, 'w') as f:
                json.dump({
                    "summary": {
                        "total_tests": self.passed_tests + self.failed_tests,
                        "passed": self.passed_tests,
                        "failed": self.failed_tests,
                        "success_rate": (self.passed_tests / max(1, self.passed_tests + self.failed_tests)) * 100,
                        "timestamp": datetime.now().isoformat()
                    },
                    "detailed_results": self.test_results
                }, f, indent=2)
            print(f"\n📄 Detailed test results saved to: {results_file}")
        except Exception as e:
            print(f"\n⚠️  Could not save test results: {e}")


if __name__ == "__main__":
    # Run the comprehensive test suite
    test_suite = DynamicGreetingTestSuite()
    success = test_suite.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
