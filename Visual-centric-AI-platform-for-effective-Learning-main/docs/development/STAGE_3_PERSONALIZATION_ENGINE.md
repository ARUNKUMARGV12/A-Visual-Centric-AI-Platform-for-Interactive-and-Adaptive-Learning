# Stage 3: Personalization Engine Implementation

This document outlines the implementation of the Stage 3 Personalization Engine for the EduAIthon RAG system.

## Overview

The Personalization Engine has two main components:

1. **AI Memory for Context Retention**: Maintains a User Context Object that persists across sessions and visits.
2. **Personalized Recommendations**: Dynamically updates UI widgets, cards, and response tone based on user preferences, goals, and weak topics.

## Components

### 1. User Context Manager

The `UserContextManager` class handles loading, updating, and persisting user context objects. It provides methods for:

- Getting a user's context (from cache, database, or file)
- Updating a user's context with new information
- Saving user context to both database and file

The context data is stored in a standardized format and can be loaded from either Supabase or the local file system as a fallback.

### 2. User Context Object

The `UserContext` class represents a user's context within the system. It:

- Manages user preferences, goals, and weak topics
- Tracks recent questions and activities
- Analyzes user queries to infer topics and update context
- Provides personalized recommendations based on the current context

### 3. Personalized Recommendations Engine

The `PersonalizedRecommendations` class generates tailored UI components and adapts content presentation based on user preferences. It provides:

- Dashboard widgets customized to the user's learning style and goals
- Sidebar widgets highlighting weak topics and recent activities
- Personalized response style parameters for content adaptation
- Methods to adapt content presentation based on learning style

### 4. Response Adaptation

The personalization system includes functions to adapt responses based on user context:

- For visual learners: Emphasis on diagrams, charts, and visual cues
- For kinesthetic learners: Focus on hands-on examples and practical exercises
- For auditory learners: Clear verbal explanations and conversational tone
- For different skill levels: Adjusting complexity and detail of explanations

## Implementation Details

### User Context Object Structure

```json
{
  "userId": "user123",
  "name": "John",
  "email": "john@example.com",
  "createdAt": "2023-07-01T12:00:00Z",
  "lastUpdated": "2023-07-03T15:30:00Z",
  "preferences": {
    "learningStyle": "visual",
    "weakTopics": ["Recursion", "DBMS"],
    "goals": ["Master Python", "Learn SQL"]
  },
  "skillLevel": "intermediate",
  "lastActivity": "Viewed DBMS normalization tutorial",
  "recentQuestions": [
    "How do I optimize SQL queries?",
    "What is database normalization?"
  ],
  "sessionData": {
    "startTime": "2023-07-03T14:00:00Z",
    "interactionCount": 5,
    "topics": ["SQL", "DBMS", "Optimization"]
  }
}
```

### Personalized Widget Types

1. **Recommended Flashcards**
   - Based on weak topics and goals
   - Difficulty adjusted to skill level

2. **Game Recommendations**
   - OS Visualization Game for visual learners interested in OS
   - Recursion Puzzle for users struggling with recursion
   - Database Query Challenge for users learning DBMS

3. **Learning Resources**
   - Format adjusted based on learning style preference
   - Content selection based on recent topics and goals

4. **Next Steps**
   - Personalized recommendations for learning path
   - Based on weak topics, goals, and recent activity

### Response Adaptation Process

1. Retrieve user context for the current user
2. Extract learning style, skill level, and topic preferences
3. Analyze the response content to identify core concepts
4. Apply style transformations based on learning preferences
5. Add personalized introductions, examples, and visual cues
6. Return the adapted response to the user

## Integration with RAG System

The personalization engine integrates with the main RAG system in the following ways:

1. **Query Processing**: User context is included in all queries to the RAG system
2. **Response Formatting**: Responses are adapted to match user preferences
3. **UI Components**: Dashboard and sidebar widgets are dynamically generated
4. **Learning Analytics**: User interactions are tracked to refine context

## API Endpoints

The personalization system exposes several endpoints:

- `/personalization/user-context`: Get or create user context
- `/personalization/update-context`: Update user context with new information
- `/personalization/track-query`: Track a user query to update context
- `/personalization/dashboard-widgets`: Get personalized dashboard widgets
- `/personalization/sidebar-widgets`: Get personalized sidebar widgets
- `/personalization/adapt-response`: Adapt a response to user preferences
- `/personalization/context-for-request`: Get formatted context for AI requests

## Example Queries and Responses

### Example 1: Database Normalization for Visual Learner

**User Context:**
- Learning Style: Visual
- Weak Topics: DBMS, Operating Systems
- Goals: Master SQL joins, Understand deadlocks in OS

**Query:** "Can you explain database normalization?"

**Personalized Response:**
```
📊 Since you're a visual learner working toward mastering DBMS concepts, here's a visualization-focused explanation of database normalization:

# Database Normalization: Visual Guide

Imagine organizing your messy desk into a perfectly arranged workspace:

## Visual Summary of Normal Forms:
[DIAGRAM: Shows progression from unnormalized to normalized tables with clear visual indicators]

### 1NF (First Normal Form):
* BEFORE: Messy table with multiple values in cells
* AFTER: Clean table with one value per cell
* VISUAL CUE: Each cell contains exactly one atomic value

...
```

### Example 2: Recursion for Hands-on Beginner

**User Context:**
- Learning Style: Kinesthetic
- Weak Topics: Recursion, Array manipulation
- Goals: Learn Python basics, Solve basic algorithms

**Query:** "How does recursion work in Python?"

**Personalized Response:**
```
🛠️ Let's break down recursion with hands-on examples you can try right away!

I notice recursion is one of your weak spots, so I'll make this super practical with code you can modify and experiment with.

## RECURSION IN PYTHON: LEARN BY DOING

Think of recursion like a stack of trays - you keep adding trays (function calls) on top until you reach a stopping point, then you work your way back down.

### Try this hands-on example:

```python
def countdown(n):
    # Print the current number
    print(n)
    
    # Base case: stop when we reach 0
    if n <= 0:
        print("Blastoff!")
        return
    
    # Recursive case: call countdown with n-1
    countdown(n-1)

# Try it now!
countdown(5)
```

...
```

## Testing the Personalization Engine

A test script is provided at `backend/test_personalization.py` to demonstrate the functionality of the personalization engine. It includes tests for:

1. Creating and updating user context
2. Generating personalized recommendations
3. Adapting responses based on user context
4. Creating context for AI requests

To run the tests:

```bash
cd backend
python test_personalization.py
```

## Future Enhancements

1. **Improved Topic Inference**: Use more sophisticated NLP techniques to better identify topics from queries
2. **Adaptive Learning Paths**: Dynamically adjust recommended learning paths based on performance and interaction patterns
3. **Collaborative Filtering**: Recommend resources based on similar users' preferences and behaviors
4. **Multimedia Adaptation**: Adjust content to include more images, videos, or interactive elements based on learning style
5. **Feedback Loop**: Incorporate user feedback on personalized content to refine recommendations
