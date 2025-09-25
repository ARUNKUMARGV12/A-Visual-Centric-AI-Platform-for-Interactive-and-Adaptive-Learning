
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
