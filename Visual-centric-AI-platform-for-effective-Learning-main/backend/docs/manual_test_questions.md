# Manual Test Questions for Dynamic Greeting Generation

This document contains test questions you can use to manually verify that the dynamic greeting generation system is working correctly.

## 🧪 Test Categories

### 1. **Diverse Topics Test** (Non-Original Template Topics)

These topics were NOT in the original static templates, so they test true dynamic generation:

**Engineering & Technology:**
- "Explain quantum computing principles"
- "How does renewable energy storage work?"
- "What is sustainable architecture?"
- "Tell me about biotechnology applications"
- "Explain virtual reality development"

**Science & Research:**
- "What is marine biology?"
- "Explain genetic engineering"
- "How does nanotechnology work?"
- "Tell me about space exploration technologies"
- "What is materials science?"

**Business & Economics:**
- "Explain cryptocurrency economics"
- "What is behavioral economics?"
- "How does supply chain management work?"
- "Tell me about digital marketing strategies"
- "Explain startup financing"

**Creative & Arts:**
- "What are digital art techniques?"
- "Explain music production principles"
- "How does game design work?"
- "Tell me about cinematography"
- "What is user experience design?"

### 2. **Original Template Topics Test** (Should Show Dynamic, Not Static)

These topics WERE in the original static templates, so they test replacement effectiveness:

**Networking (Original BGP/Networking Templates):**
- "What is BGP routing?"
- "How does TCP/IP work?"
- "Explain network protocols"
- "What is DNS resolution?"
- "How do firewalls work?"

**Programming (Original Programming Templates):**
- "What is Python programming?"
- "Explain object-oriented programming"
- "How do algorithms work?"
- "What are data structures?"
- "Tell me about software engineering"

### 3. **Greeting Variety Test** (Same Topic, Different Phrasings)

Use these with the SAME user to test greeting variation:

**Machine Learning Topic:**
1. "What is machine learning?"
2. "Explain machine learning to me"
3. "How does machine learning work?"
4. "Tell me about machine learning algorithms"
5. "Can you describe machine learning applications?"

**Web Development Topic:**
1. "What is web development?"
2. "How do I build websites?"
3. "Explain frontend development"
4. "What is backend programming?"
5. "Tell me about full-stack development"

### 4. **User Context Personalization Test**

Create different user profiles and test the same questions:

**Beginner User Profile:**
- Query: "What is object-oriented programming?"
- Expected: Supportive, encouraging greeting
- Look for: Simple language, encouraging tone

**Intermediate User Profile:**
- Query: "Explain design patterns in software engineering"
- Expected: More technical, confident greeting
- Look for: Moderate technical language

**Advanced User Profile:**
- Query: "Discuss distributed systems architecture"
- Expected: Professional, sophisticated greeting
- Look for: Advanced terminology, professional tone

### 5. **Query Type Classification Test**

**Greetings (Should return greeting type):**
- "Hello!"
- "Hi there, how are you?"
- "Good morning"
- "Hey, what's up?"

**Profile Queries (Should return profile_query type):**
- "What do you know about me?"
- "Tell me about my profile"
- "What's in your memory about me?"
- "Do you remember our previous conversations?"

**Non-Educational (Should return non_educational type):**
- "What are you?"
- "How do you work?"
- "What are your capabilities?"
- "Who created you?"

**Educational (Should return educational type with greeting):**
- "Explain neural networks"
- "What is Python programming?"
- "How does encryption work?"
- "Tell me about photosynthesis"

### 6. **Edge Cases & Fallback Test**

**Empty/Minimal Input:**
- "" (empty string)
- "?"
- "a"
- "123"

**Unusual Input:**
- "!@#$%^&*()"
- "aaaaaaaaaaaaaaaaaaaaaaaaaaa" (repeated characters)
- "Tell me about something that doesn't exist xyz123"
- "Explain the color purple in mathematics"

**Very Long Input:**
- [Create a query with 500+ characters about any topic]

### 7. **Static Template Elimination Test**

Test these exact queries that would have triggered static templates:

**BGP/Networking Queries:**
- "What is BGP routing?" 
- "Explain networking protocols"

**Programming Queries:**
- "How do I program in Python?"
- "Tell me about algorithms"

**Expected Result:** NO static greetings like:
- ❌ "BGP is fascinating! Let me break down this routing protocol for you."
- ❌ "Programming questions are my favorite - let's solve this together!"
- ❌ "Networking concepts are essential - let's dive in!"

**Expected Result:** Dynamic, varied greetings like:
- ✅ "Great choice exploring BGP! It's the backbone of internet routing."
- ✅ "Let's dive into the fascinating world of network protocols!"
- ✅ "Python is an excellent language to learn - let me guide you through it!"

## 🎯 What to Look For

### ✅ **Success Indicators:**

1. **Unique Greetings:** Each response has a different, contextually appropriate greeting
2. **Topic Relevance:** Greetings mention or relate to the specific topic asked about
3. **User Awareness:** Greetings consider user skill level and context
4. **Natural Language:** Greetings sound conversational and human-like
5. **Variety:** Multiple queries about the same topic get different greetings
6. **No Static Text:** None of the old static template greetings appear

### ❌ **Failure Indicators:**

1. **Repetitive Greetings:** Same greeting appears multiple times
2. **Generic Responses:** Greetings don't relate to the specific topic
3. **Static Templates:** Old static greetings like "BGP is fascinating!" appear
4. **No Personalization:** All users get identical greetings regardless of context
5. **Error Responses:** System crashes or returns error messages
6. **Missing Greetings:** Educational queries return no greeting at all

## 🔧 **How to Test**

### Manual Testing:
1. Choose questions from each category above
2. Send them to your RAG system
3. Check the response for the greeting/introduction
4. Compare against success/failure indicators
5. Document any issues found

### Automated Testing:
Run the comprehensive test suite:
```bash
python test_questions_dynamic_greetings.py
```

### API Testing:
If testing via API, send POST requests with these question formats:
```json
{
  "query": "What is machine learning?",
  "user_context": {
    "user": {
      "name": "TestUser",
      "skillLevel": "beginner"
    }
  }
}
```

## 📊 **Expected Results Summary**

- **Topic Coverage:** System should handle ANY topic, not just predefined ones
- **Greeting Variety:** Same topic should generate different greetings each time
- **User Personalization:** Different user contexts should get appropriate greetings
- **Query Classification:** Different query types should be handled appropriately
- **Fallback Handling:** Edge cases should not crash the system
- **Template Elimination:** No old static templates should appear

## 🚀 **Quick Test Script**

Here's a simple test you can run manually:

```python
# Test 1: Diverse Topics
topics = ["quantum mechanics", "marine biology", "digital art"]
for topic in topics:
    query = f"Explain {topic} to me"
    # Send query and check for unique, relevant greeting

# Test 2: Greeting Variety  
for i in range(3):
    query = "What is machine learning?"
    # Send same query multiple times, expect different greetings

# Test 3: No Static Templates
query = "What is BGP routing?"
# Check that response doesn't contain "BGP is fascinating!"
```

Use this comprehensive test suite to validate that your dynamic greeting generation system is working correctly and providing varied, contextual, and personalized greetings for all types of educational queries!
