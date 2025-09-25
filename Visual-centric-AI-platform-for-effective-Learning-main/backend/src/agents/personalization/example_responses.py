"""
Example personalized responses for the EduAIthon RAG system.
This file contains examples of personalized queries and responses based on the User Context Object.
These examples demonstrate how the system adapts to user preferences, learning styles, and goals.
"""

# Sample User Context Objects
SAMPLE_USER_CONTEXTS = {
    # Visual learner who prefers diagrams, working on DBMS and OS
    "visual_dbms_student": {
        "userId": "student123",
        "preferences": {
            "learningStyle": "visual",
            "weakTopics": ["DBMS", "Operating Systems"],
            "goals": ["Master SQL joins", "Understand deadlocks in OS"]
        },
        "lastActivity": "Viewed DBMS normalization explanation",
        "recentQuestions": [
            "What is database normalization?",
            "How do inner joins work?"
        ],
        "skillLevel": "intermediate"
    },
    
    # Beginner who prefers hands-on examples, focusing on programming basics
    "beginner_kinesthetic": {
        "userId": "newcoder456",
        "preferences": {
            "learningStyle": "kinesthetic",
            "weakTopics": ["Recursion", "Array manipulation"],
            "goals": ["Learn Python basics", "Solve basic algorithms"]
        },
        "lastActivity": "Completed Python variables tutorial",
        "recentQuestions": [
            "How do for loops work in Python?",
            "What is a variable in programming?"
        ],
        "skillLevel": "beginner"
    },
    
    # Advanced student who prefers theory and detailed explanations
    "advanced_theory": {
        "userId": "advanced789",
        "preferences": {
            "learningStyle": "theoretical",
            "weakTopics": ["Advanced data structures", "Graph algorithms"],
            "goals": ["Master dynamic programming", "Understand B+ trees"]
        },
        "lastActivity": "Analyzed time complexity of sorting algorithms",
        "recentQuestions": [
            "How does the A* algorithm work?",
            "What's the difference between B-trees and B+ trees?"
        ],
        "skillLevel": "advanced"
    }
}

# Example queries and responses based on user context
EXAMPLE_PERSONALIZED_RESPONSES = [
    # Example 1: DBMS question for visual learner
    {
        "userContext": "visual_dbms_student",
        "query": "Can you explain database normalization?",
        "originalResponse": """
Database normalization is a process of organizing a database to reduce redundancy and improve data integrity.
It involves dividing large tables into smaller ones and defining relationships between them.

The normal forms are:
1NF: Each table cell should contain a single value, and each record needs to be unique.
2NF: The table is in 1NF and all non-key attributes are fully dependent on the primary key.
3NF: The table is in 2NF and all the attributes are only dependent on the primary key.
BCNF: The table is in 3NF and for every dependency X → Y, X should be a super key.
4NF: The table is in BCNF and should not have multi-valued dependencies.
5NF: The table is in 4NF and should not have join dependencies.
        """,
        "personalizedResponse": """
📊 Since you're a visual learner working toward mastering DBMS concepts, here's a visualization-focused explanation of database normalization:

# Database Normalization: Visual Guide

Imagine organizing your messy desk into a perfectly arranged workspace:

## Visual Summary of Normal Forms:
[DIAGRAM: Shows progression from unnormalized to normalized tables with clear visual indicators]

### 1NF (First Normal Form):
* BEFORE: Messy table with multiple values in cells
* AFTER: Clean table with one value per cell
* VISUAL CUE: Each cell contains exactly one atomic value

### 2NF (Second Normal Form):
* BEFORE: Table where some fields only depend on part of the key
* AFTER: Tables split so non-key attributes fully depend on the entire primary key
* VISUAL CUE: Arrows showing complete dependencies from key to all attributes

### 3NF (Third Normal Form):
* BEFORE: Table with transitive dependencies
* AFTER: Tables with attributes directly dependent only on the primary key
* VISUAL CUE: Direct arrows from primary key to each attribute

I notice you've been studying SQL joins recently. Normalization directly connects to that topic because properly normalized databases require joins to reconstruct complete information!

Would you like me to create some visual examples specifically about how normalization affects the way you'd write join statements?
        """
    },
    
    # Example 2: Recursion explanation for a hands-on beginner
    {
        "userContext": "beginner_kinesthetic",
        "query": "How does recursion work in Python?",
        "originalResponse": """
Recursion in Python occurs when a function calls itself. Every recursive function has two components:
1. A base case that stops the recursion
2. A recursive case where the function calls itself with modified parameters

Here's an example of a recursive function to calculate factorial:

```python
def factorial(n):
    if n == 1:  # Base case
        return 1
    else:  # Recursive case
        return n * factorial(n-1)
```

The function will keep calling itself with smaller values of n until it reaches the base case.
        """,
        "personalizedResponse": """
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

**EXPERIMENT TIME:**
1. Copy this code into a Python file
2. Run it to see what happens
3. Try changing the starting number
4. What happens if you remove the base case? (Be careful!)

### Real-world problem to solve:

Let's create a function that counts the total files in a folder and all its subfolders:

```python
import os

def count_files(folder_path):
    total = 0
    
    # Look through all items in this folder
    for item in os.listdir(folder_path):
        item_path = os.path.join(folder_path, item)
        
        # If it's a file, count it
        if os.path.isfile(item_path):
            total += 1
        
        # If it's a folder, recursively count files inside it
        elif os.path.isdir(item_path):
            total += count_files(item_path)
    
    return total

# Try with your Documents folder (or any other folder)
# print(count_files("C:/Users/YourName/Documents"))
```

Would you like to try another hands-on recursion challenge to practice? I can create a custom exercise based on your Python learning goals!
        """
    },
    
    # Example 3: Advanced data structures question
    {
        "userContext": "advanced_theory",
        "query": "Explain B+ trees and their advantages over B-trees",
        "originalResponse": """
B+ trees are a variant of B-trees, which are self-balancing tree data structures that maintain sorted data and allow for efficient insertion, deletion, and search operations.

Key differences between B+ trees and B-trees:
1. In B+ trees, all data records are stored at the leaf level, while B-trees store records at all levels.
2. In B+ trees, the leaf nodes are linked, forming a linked list, which is not the case in B-trees.
3. Internal nodes in B+ trees only store keys for routing purposes, not actual data.

Advantages of B+ trees:
- Range queries are more efficient due to the linked leaves
- Leaf nodes can store more keys as they don't need to store pointers to data
- Better utilization of CPU cache due to similar node structures
- Simpler concurrency control due to separation of internal and leaf nodes
        """,
        "personalizedResponse": """
Given your advanced level and theoretical learning style preference, let's explore B+ trees in depth, focusing on their mathematical properties and theoretical advantages over B-trees.

## Theoretical Analysis of B+ Trees vs. B-Trees

### Formal Definition:
A B+ tree of order m is a tree that satisfies the following properties:
- Every node has at most m children
- Every non-leaf node (except root) has at least ⌈m/2⌉ children
- The root has at least 2 children if it's not a leaf
- All leaves appear on the same level and contain between ⌈m/2⌉-1 and m-1 keys

### Key Theoretical Distinctions:

1. **Data Organization Principle**:
   - In B-trees: P(a₁, K₁, a₂, K₂, ..., aₙ) where Kᵢ are keys and aᵢ are pointers to either data or subtrees
   - In B+ trees: Internal nodes contain only routing information with the form P(K₁, a₁, K₂, a₂, ..., Kₙ₋₁, aₙ₋₁, aₙ) where aᵢ points exclusively to subtrees

2. **Asymptotic Analysis**:
   For a B+ tree with n keys and order m:
   - Height: O(log_m(n)) (same as B-tree)
   - Range query: O(log_m(n) + k) where k is the number of elements in range
      (vs. O(n) worst case for B-tree)
   - Space complexity: B+ trees have higher fanout in internal nodes, leading to potentially shorter trees

3. **Access Pattern Optimization**:
   B+ trees achieve O(1) sequential access between leaf nodes due to the linked list structure, which creates a significant theoretical advantage for database systems where range queries are common.

I notice you've been studying graph algorithms like A*. There's an interesting theoretical connection between the optimal branching factor in B+ trees and the heuristic function optimization in A* that might interest you.

Would you like me to explore the mathematical relationship between tree-based data structures and graph traversal algorithms for your next step in advanced data structure theory?
        """
    },
    
    # Example 4: OS question for visual learner
    {
        "userContext": "visual_dbms_student",
        "query": "What is a deadlock in operating systems and how can it be prevented?",
        "originalResponse": """
A deadlock is a situation where two or more processes are unable to proceed because each is waiting for resources held by another. For a deadlock to occur, four conditions must be met simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.

Deadlock prevention techniques:
1. Eliminate Mutual Exclusion: Not generally possible as some resources cannot be shared.
2. Eliminate Hold and Wait: Require processes to request all resources at once or release current resources before requesting new ones.
3. Eliminate No Preemption: Allow resources to be forcibly taken from processes.
4. Eliminate Circular Wait: Impose a total ordering on resource types and require processes to request resources in that order.

Deadlock avoidance techniques like the Banker's Algorithm can also be used to ensure the system never enters an unsafe state.
        """,
        "personalizedResponse": """
📊 Since OS is one of your focus areas and you prefer visual learning, here's a visualization-focused explanation of deadlocks:

# Deadlocks in Operating Systems: Visual Guide

## Visual Definition
[DIAGRAM: Four processes shown as circles, resources as squares, with arrows showing circular dependency]

A deadlock is like a traffic gridlock where:
- Process A holds Resource 1 and needs Resource 2
- Process B holds Resource 2 and needs Resource 3
- Process C holds Resource 3 and needs Resource 4
- Process D holds Resource 4 and needs Resource 1

Result: Complete standstill! Nobody can move.

## The Four Conditions (Visualized)
[DIAGRAM: Four puzzle pieces that fit together to create a deadlock]

1. **Mutual Exclusion**: Only one process can use a resource at a time
   *Visual: Resource with a lock on it*

2. **Hold & Wait**: Processes hold resources while waiting for others
   *Visual: Process holding one resource while reaching for another*

3. **No Preemption**: Resources can't be forcibly taken away
   *Visual: Resource with "No Taking" sign*

4. **Circular Wait**: Circular chain of processes waiting for each other
   *Visual: Circular arrow connecting multiple processes*

## Prevention Techniques (Visualized)
[DIAGRAM: Breaking each puzzle piece to prevent deadlock]

1. **Break Mutual Exclusion**
   *Visual: Making resources sharable where possible*

2. **Break Hold & Wait**
   *Visual: Process requesting all resources at once OR releasing all before requesting new ones*

3. **Allow Preemption**
   *Visual: System taking resource from waiting process*

4. **Break Circular Wait**
   *Visual: Numbered resources showing ordering, processes following numbers*

## Banker's Algorithm Animation
[DIAGRAM: Step-by-step visual of Banker's Algorithm]
- Shows safe sequence determination
- Visualizes resource allocation states

Would you like me to create an interactive diagram where you can simulate deadlock scenarios and prevention techniques? This would give you hands-on experience with the concepts!
        """
    }
]

def get_example_response(user_context_type, query):
    """
    Get an example personalized response based on user context type and query.
    
    Args:
        user_context_type: The type of user context (visual_dbms_student, beginner_kinesthetic, etc.)
        query: The query to find a matching example for
        
    Returns:
        A tuple of (original_response, personalized_response) or (None, None) if no match
    """
    # Find a matching example
    for example in EXAMPLE_PERSONALIZED_RESPONSES:
        if example["userContext"] == user_context_type and query.lower() in example["query"].lower():
            return example["originalResponse"], example["personalizedResponse"]
    
    # No matching example found
    return None, None

def get_sample_user_context(context_type):
    """
    Get a sample user context object.
    
    Args:
        context_type: The type of user context to get
        
    Returns:
        The user context object or None if not found
    """
    return SAMPLE_USER_CONTEXTS.get(context_type)

def get_all_sample_contexts():
    """
    Get all sample user contexts.
    
    Returns:
        Dictionary of all sample user contexts
    """
    return SAMPLE_USER_CONTEXTS

def get_all_example_responses():
    """
    Get all example personalized responses.
    
    Returns:
        List of all example personalized responses
    """
    return EXAMPLE_PERSONALIZED_RESPONSES
