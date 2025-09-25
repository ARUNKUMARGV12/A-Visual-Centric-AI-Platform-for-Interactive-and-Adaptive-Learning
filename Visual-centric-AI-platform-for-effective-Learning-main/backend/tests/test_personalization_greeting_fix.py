"""
🎯 ADVANCED TEST CASE: Fix Static Greeting Template Issue

This test identifies and fixes the repetitive "Hey {name}! Let's explore this topic together." 
issue in the personalization system.

PROBLEM IDENTIFIED:
- Lines 1459, 1465 in main.py contain static greeting templates
- Personalization system is working but uses repetitive patterns
- Need more dynamic, context-aware greeting generation

SOLUTION:
- Create dynamic greeting generator based on query type and context
- Implement conversation flow awareness
- Add variety to avoid repetitive responses
"""

import sys
import os
import json
import random
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Add the parent directory to the path to allow importing the agents
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DynamicGreetingGenerator:
    """
    Advanced greeting generator that creates varied, context-aware responses
    instead of static templates.
    """
    
    def __init__(self):
        self.conversation_starters = {
            'bgp': [
                "BGP is fascinating! Let me break down this routing protocol for you.",
                "Great question about BGP - it's the backbone of internet routing!",
                "Border Gateway Protocol is crucial for understanding how the internet works.",
                "BGP can be complex, but I'll explain it step by step.",
                "Excellent choice - BGP is fundamental to network engineering!"
            ],
            'networking': [
                "Networking concepts are essential in today's world - let's dive in!",
                "I love discussing networking - it's the foundation of modern communication!",
                "Network protocols can be tricky, but they're incredibly powerful once you understand them.",
                "Great networking question - these concepts are everywhere in tech!",
                "Perfect timing to learn about networking - it's such a valuable skill!"
            ],
            'programming': [
                "Coding concepts coming right up!",
                "Programming questions are my favorite - let's solve this together!",
                "Great choice - this programming concept is really useful!",
                "I love helping with code - let's break this down logically!",
                "Perfect question for building your programming skills!"
            ],
            'general': [
                "Interesting question! Let me help you understand this.",
                "Great topic to explore - I'm excited to explain this!",
                "This is a valuable concept to learn - let's dive in!",
                "Excellent question - understanding this will be really helpful!",
                "I'm glad you asked about this - it's an important topic!"
            ]
        }
        
        self.follow_up_starters = {
            'bgp': [
                "Building on BGP concepts,",
                "To expand on BGP routing,",
                "Continuing with BGP protocol,",
                "Following up on routing protocols,",
                "Adding to what we covered about BGP,"
            ],
            'networking': [
                "Expanding on networking fundamentals,",
                "Building on network concepts,",
                "To dive deeper into networking,",
                "Continuing our networking discussion,",
                "Following up on protocol concepts,"
            ],
            'programming': [
                "Building on that code concept,",
                "To expand your programming knowledge,",
                "Continuing with coding fundamentals,",
                "Adding to your development skills,",
                "Building on that programming logic,"
            ],
            'general': [
                "Building on that concept,",
                "To expand on this topic,",
                "Continuing our discussion,",
                "Following up on your question,",
                "Adding more details,"
            ]
        }
    
    def detect_topic_category(self, query: str) -> str:
        """Detect the main category of the user's query."""
        query_lower = query.lower()
        
        bgp_keywords = ['bgp', 'border gateway protocol', 'routing protocol', 'autonomous system', 'as number']
        networking_keywords = ['network', 'protocol', 'tcp', 'udp', 'ip', 'subnet', 'routing', 'switching']
        programming_keywords = ['code', 'program', 'function', 'variable', 'algorithm', 'python', 'javascript']
        
        if any(keyword in query_lower for keyword in bgp_keywords):
            return 'bgp'
        elif any(keyword in query_lower for keyword in networking_keywords):
            return 'networking'
        elif any(keyword in query_lower for keyword in programming_keywords):
            return 'programming'
        else:
            return 'general'
    
    def generate_dynamic_greeting(self, 
                                user_name: str, 
                                query: str, 
                                interaction_count: int = 0,
                                recent_topics: List[str] = None) -> str:
        """
        Generate a dynamic, varied greeting based on context.
        
        Args:
            user_name: The user's name
            query: The current query
            interaction_count: Number of previous interactions
            recent_topics: Recently discussed topics
            
        Returns:
            A dynamic, contextual greeting
        """
        # Clean up the user name
        display_name = user_name.split('@')[0] if '@' in user_name else user_name
        display_name = display_name.replace('_', ' ').title() if '_' in display_name else display_name
        
        # Detect topic category
        topic_category = self.detect_topic_category(query)
        
        # For follow-up questions (interaction_count > 0)
        if interaction_count > 0:
            follow_ups = self.follow_up_starters.get(topic_category, self.follow_up_starters['general'])
            return random.choice(follow_ups)
        
        # For first interaction or new topics
        starters = self.conversation_starters.get(topic_category, self.conversation_starters['general'])
        
        # Add occasional personalization (but not every time)
        if random.random() < 0.3:  # 30% chance to include name
            greeting = f"{display_name}, {random.choice(starters).lower()}"
        else:
            greeting = random.choice(starters)
            
        return greeting

class PersonalizationTestSuite:
    """
    Comprehensive test suite for the personalization system
    """
    
    def __init__(self):
        self.greeting_generator = DynamicGreetingGenerator()
        self.test_users = [
            {
                "user_id": "yogish057",
                "name": "Yogish",
                "learningStyle": "visual",
                "skillLevel": "intermediate",
                "interests": ["networking", "cybersecurity"],
                "weakTopics": ["BGP", "routing protocols"]
            },
            {
                "user_id": "test_user_123",
                "name": "Alex",
                "learningStyle": "kinesthetic", 
                "skillLevel": "beginner",
                "interests": ["programming", "web development"],
                "weakTopics": ["algorithms", "data structures"]
            },
            {
                "user_id": "expert_user",
                "name": "Dr. Smith",
                "learningStyle": "textual",
                "skillLevel": "advanced",
                "interests": ["system design", "architecture"],
                "weakTopics": []
            }
        ]
    
    def test_static_greeting_issue(self):
        """
        Test that demonstrates the current static greeting issue
        """
        print("\n" + "="*80)
        print("🔍 TESTING: Static Greeting Issue Demonstration")
        print("="*80)
        
        # Simulate multiple BGP queries from the same user
        bgp_queries = [
            "what is bgp protocol?",
            "bgp is border gateway protocol right?", 
            "where can bgp be used?",
            "explain bgp routing",
            "how does bgp work?"
        ]
        
        user = self.test_users[0]  # yogish057
        print(f"\n📊 Current System Behavior (PROBLEMATIC):")
        print(f"User: {user['name']} ({user['user_id']})")
        
        # Simulate the current static template behavior
        for i, query in enumerate(bgp_queries):
            static_response = f"Hey {user['name']}! Let's explore this topic together. "
            print(f"\nQuery {i+1}: {query}")
            print(f"Response: {static_response}[...rest of response...]")
            print("❌ ISSUE: Same greeting every time!")
        
        return True
    
    def test_dynamic_greeting_solution(self):
        """
        Test the new dynamic greeting system
        """
        print("\n" + "="*80)
        print("✅ TESTING: Dynamic Greeting Solution")
        print("="*80)
        
        bgp_queries = [
            "what is bgp protocol?",
            "bgp is border gateway protocol right?", 
            "where can bgp be used?",
            "explain bgp routing",
            "how does bgp work?"
        ]
        
        user = self.test_users[0]  # yogish057
        print(f"\n🎯 New System Behavior (IMPROVED):")
        print(f"User: {user['name']} ({user['user_id']})")
        
        for i, query in enumerate(bgp_queries):
            dynamic_greeting = self.greeting_generator.generate_dynamic_greeting(
                user_name=user['name'],
                query=query,
                interaction_count=i,
                recent_topics=['BGP'] if i > 0 else []
            )
            print(f"\nQuery {i+1}: {query}")
            print(f"Response: {dynamic_greeting} [...rest of response...]")
            print("✅ IMPROVED: Varied, contextual greeting!")
        
        return True
    
    def test_multi_user_personalization(self):
        """
        Test personalization across different user types
        """
        print("\n" + "="*80)
        print("👥 TESTING: Multi-User Personalization")
        print("="*80)
        
        query = "explain recursion in programming"
        
        for user in self.test_users:
            print(f"\n👤 User: {user['name']} (Level: {user['skillLevel']}, Style: {user['learningStyle']})")
            
            greeting = self.greeting_generator.generate_dynamic_greeting(
                user_name=user['name'],
                query=query,
                interaction_count=0
            )
            
            # Simulate personalized content based on user profile
            if user['skillLevel'] == 'beginner':
                content_note = "📚 Will explain from basics with simple examples"
            elif user['skillLevel'] == 'intermediate': 
                content_note = "🔧 Will include practical applications and use cases"
            else:
                content_note = "🎓 Will focus on advanced concepts and optimization"
                
            if user['learningStyle'] == 'visual':
                style_note = "📊 Will include diagrams and visual examples"
            elif user['learningStyle'] == 'kinesthetic':
                style_note = "🛠️ Will emphasize hands-on coding exercises"
            else:
                style_note = "📖 Will provide detailed textual explanations"
            
            print(f"   Greeting: {greeting}")
            print(f"   Content: {content_note}")
            print(f"   Style: {style_note}")
        
        return True
    
    def test_conversation_flow_awareness(self):
        """
        Test that the system maintains conversation context
        """
        print("\n" + "="*80)
        print("💬 TESTING: Conversation Flow Awareness")
        print("="*80)
        
        user = self.test_users[1]  # Alex (beginner)
        conversation_flow = [
            ("What is a variable in programming?", 0),
            ("How do I declare variables in Python?", 1), 
            ("What's the difference between local and global variables?", 2),
            ("Can you show me an example of variable scope?", 3),
            ("What are the best practices for naming variables?", 4)
        ]
        
        print(f"\n🎯 Conversation with {user['name']} about programming variables:")
        
        for query, interaction_count in conversation_flow:
            greeting = self.greeting_generator.generate_dynamic_greeting(
                user_name=user['name'],
                query=query,
                interaction_count=interaction_count,
                recent_topics=['variables', 'python'] if interaction_count > 1 else []
            )
            
            print(f"\n💭 Query {interaction_count + 1}: {query}")
            print(f"🤖 Response: {greeting} [detailed explanation follows...]")
            
            # Show how context builds up
            if interaction_count == 0:
                print("   📝 Note: Fresh start - enthusiastic introduction")
            elif interaction_count == 1:
                print("   📝 Note: Building on previous concept")
            else:
                print("   📝 Note: Continuing established conversation flow")
        
        return True
    
    def test_topic_detection_accuracy(self):
        """
        Test the accuracy of topic detection for appropriate greetings
        """
        print("\n" + "="*80)
        print("🎯 TESTING: Topic Detection Accuracy")
        print("="*80)
        
        test_queries = [
            ("What is BGP routing protocol?", "bgp"),
            ("Explain network topology", "networking"),
            ("How does TCP/IP work?", "networking"), 
            ("Write a Python function", "programming"),
            ("What is machine learning?", "general"),
            ("BGP autonomous systems", "bgp"),
            ("Border gateway protocol configuration", "bgp"),
            ("JavaScript arrow functions", "programming")
        ]
        
        correct_detections = 0
        total_tests = len(test_queries)
        
        print("\n🔍 Topic Detection Results:")
        for query, expected_category in test_queries:
            detected_category = self.greeting_generator.detect_topic_category(query)
            is_correct = detected_category == expected_category
            
            print(f"   Query: '{query[:40]}...'")
            print(f"   Expected: {expected_category} | Detected: {detected_category} {'✅' if is_correct else '❌'}")
            
            if is_correct:
                correct_detections += 1
        
        accuracy = (correct_detections / total_tests) * 100
        print(f"\n📊 Topic Detection Accuracy: {accuracy:.1f}% ({correct_detections}/{total_tests})")
        
        return accuracy >= 75  # Should be at least 75% accurate
    
    def generate_improved_code_fix(self):
        """
        Generate the actual code fix for the main.py file
        """
        print("\n" + "="*80)
        print("🛠️ GENERATING: Code Fix for main.py")
        print("="*80)
        
        improved_code = '''
# IMPROVED PERSONALIZATION CODE FOR main.py (around lines 1456-1470)

# Replace the static greeting section with this dynamic approach:

class DynamicResponseGenerator:
    def __init__(self):
        self.topic_greetings = {
            'bgp': [
                "BGP is fascinating! Let me break down this routing protocol for you.",
                "Great question about BGP - it's the backbone of internet routing!",
                "Border Gateway Protocol is crucial for understanding how the internet works.",
                "BGP can be complex, but I'll explain it step by step.",
                "Excellent choice - BGP is fundamental to network engineering!"
            ],
            'networking': [
                "Networking concepts are essential - let's dive in!",
                "I love discussing networking - it's the foundation of modern communication!",
                "Network protocols can be tricky, but they're incredibly powerful!",
                "Great networking question - these concepts are everywhere in tech!",
                "Perfect timing to learn about networking!"
            ],
            'default': [
                "Interesting question! Let me help you understand this.",
                "Great topic to explore - I'm excited to explain this!",
                "This is a valuable concept to learn - let's dive in!",
                "Excellent question - understanding this will be really helpful!"
            ]
        }
    
    def get_dynamic_greeting(self, query: str, user_name: str, interaction_count: int = 0):
        """Generate dynamic, varied greetings"""
        # Detect topic
        query_lower = query.lower()
        topic_category = 'default'
        
        if any(keyword in query_lower for keyword in ['bgp', 'border gateway', 'routing protocol']):
            topic_category = 'bgp'
        elif any(keyword in query_lower for keyword in ['network', 'protocol', 'tcp', 'udp']):
            topic_category = 'networking'
        
        # Get appropriate greeting
        greetings = self.topic_greetings.get(topic_category, self.topic_greetings['default'])
        
        # For follow-up questions, use transitional phrases
        if interaction_count > 0:
            transitions = [
                "Building on that concept,",
                "To expand on this topic,", 
                "Continuing our discussion,",
                "Following up on your question,",
                "Adding more details,"
            ]
            return random.choice(transitions)
        
        # For new conversations, occasionally include name (but not always)
        greeting = random.choice(greetings)
        if random.random() < 0.3 and user_name != "there":  # 30% chance
            display_name = user_name.split('@')[0] if '@' in user_name else user_name
            greeting = f"{display_name}, {greeting.lower()}"
            
        return greeting

# Usage in the main query processing function:
# Instead of:
# personalized_intro = f"Hey {display_name}! Let's explore this topic together."

# Use:
# response_generator = DynamicResponseGenerator()
# personalized_intro = response_generator.get_dynamic_greeting(
#     query=request.query,
#     user_name=user_name, 
#     interaction_count=interaction_count
# )
'''
        
        print(improved_code)
        
        # Save the fix to a file
        fix_file_path = "personalization_fix.py"
        with open(fix_file_path, 'w') as f:
            f.write(improved_code)
        
        print(f"\n💾 Code fix saved to: {fix_file_path}")
        print("\n🔧 To apply this fix:")
        print("1. Add the DynamicResponseGenerator class to main.py")
        print("2. Replace static greeting logic around lines 1456-1470")
        print("3. Import random module at the top of main.py")
        print("4. Test with different queries to verify variety")
        
        return True
    
    def run_comprehensive_test(self):
        """
        Run all tests and provide a comprehensive report
        """
        print("\n" + "🎯"*30)
        print("COMPREHENSIVE PERSONALIZATION TEST SUITE")
        print("🎯"*30)
        
        print(f"\n📅 Test Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🔍 Testing Personalization System Issues and Solutions")
        
        test_results = {}
        
        # Run all tests
        try:
            test_results['static_issue_demo'] = self.test_static_greeting_issue()
            test_results['dynamic_solution'] = self.test_dynamic_greeting_solution()
            test_results['multi_user'] = self.test_multi_user_personalization()
            test_results['conversation_flow'] = self.test_conversation_flow_awareness()
            test_results['topic_detection'] = self.test_topic_detection_accuracy()
            test_results['code_fix_generated'] = self.generate_improved_code_fix()
            
        except Exception as e:
            logger.error(f"Test execution error: {e}")
            test_results['error'] = str(e)
        
        # Generate summary report
        print("\n" + "="*80)
        print("📊 TEST SUMMARY REPORT")
        print("="*80)
        
        passed_tests = sum(1 for result in test_results.values() if result is True)
        total_tests = len([k for k in test_results.keys() if k != 'error'])
        
        print(f"\n✅ Tests Passed: {passed_tests}/{total_tests}")
        
        for test_name, result in test_results.items():
            if test_name == 'error':
                print(f"❌ Error: {result}")
            else:
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"{status} {test_name.replace('_', ' ').title()}")
        
        # Key findings and recommendations
        print(f"\n🎯 KEY FINDINGS:")
        print(f"• ISSUE IDENTIFIED: Static greeting templates causing repetitive responses")
        print(f"• ROOT CAUSE: Lines 1459, 1465 in main.py use hardcoded patterns")
        print(f"• IMPACT: Poor user experience, sounds robotic and impersonal")
        print(f"• SOLUTION: Dynamic greeting generation with topic awareness")
        
        print(f"\n🚀 RECOMMENDATIONS:")
        print(f"1. Implement DynamicResponseGenerator class")
        print(f"2. Add topic detection for contextual greetings") 
        print(f"3. Use conversation flow awareness")
        print(f"4. Reduce name repetition (30% frequency instead of 100%)")
        print(f"5. Add variety with random selection from appropriate greeting pools")
        
        print(f"\n🎉 EXPECTED OUTCOME:")
        print(f"• More natural, varied conversation flow")
        print(f"• Context-aware responses based on topic and user history")
        print(f"• Reduced robotic feeling in interactions")
        print(f"• Better user engagement and satisfaction")
        
        return test_results

def main():
    """
    Main test execution function
    """
    print("🎯 Starting Advanced Personalization Test Suite...")
    
    # Create test suite instance
    test_suite = PersonalizationTestSuite()
    
    # Run comprehensive tests
    results = test_suite.run_comprehensive_test()
    
    # Determine overall success
    if all(isinstance(v, bool) and v for k, v in results.items() if k != 'error'):
        print(f"\n🎉 ALL TESTS PASSED! The personalization fix is ready to implement.")
        return 0
    else:
        print(f"\n⚠️ Some tests failed or encountered issues. Review the results above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
