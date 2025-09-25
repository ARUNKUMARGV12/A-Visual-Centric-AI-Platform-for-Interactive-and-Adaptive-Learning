"""
Algorithm Explanation Agent
Specialized in providing detailed explanations of algorithms, code logic flows,
and educational insights tailored to user skill levels.
"""

import re
import ast
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AlgorithmType(Enum):
    SORTING = "sorting"
    SEARCHING = "searching"
    GRAPH = "graph"
    DYNAMIC_PROGRAMMING = "dynamic_programming"
    GREEDY = "greedy"
    DIVIDE_CONQUER = "divide_and_conquer"
    BACKTRACKING = "backtracking"
    TREE_TRAVERSAL = "tree_traversal"
    STRING_PROCESSING = "string_processing"
    MATHEMATICAL = "mathematical"
    DATA_STRUCTURE = "data_structure"
    RECURSIVE = "recursive"
    ITERATIVE = "iterative"

class ComplexityClass(Enum):
    CONSTANT = "O(1)"
    LOGARITHMIC = "O(log n)"
    LINEAR = "O(n)"
    LINEARITHMIC = "O(n log n)"
    QUADRATIC = "O(n²)"
    CUBIC = "O(n³)"
    EXPONENTIAL = "O(2^n)"
    FACTORIAL = "O(n!)"

@dataclass
class CodeFlowStep:
    step_number: int
    line_number: int
    code_snippet: str
    explanation: str
    variables_state: Dict[str, Any]
    complexity_contribution: str
    learning_notes: List[str]

@dataclass
class AlgorithmExplanation:
    algorithm_name: str
    algorithm_type: AlgorithmType
    description: str
    purpose: str
    time_complexity: ComplexityClass
    space_complexity: ComplexityClass
    code_flow: List[CodeFlowStep]
    key_concepts: List[str]
    learning_objectives: List[str]
    common_mistakes: List[str]
    optimization_opportunities: List[str]
    real_world_applications: List[str]
    related_algorithms: List[str]

@dataclass
class VisualRepresentation:
    diagram_type: str  # flowchart, tree, graph, array, etc.
    elements: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    annotations: List[str]
    step_by_step_changes: List[Dict[str, Any]]

class AlgorithmExplanationAgent:
    def __init__(self, gemini_model=None):
        self.gemini_model = gemini_model
        self.algorithm_patterns = self._initialize_algorithm_patterns()
        
    def _initialize_algorithm_patterns(self) -> Dict[AlgorithmType, List[Dict]]:
        """Initialize patterns to recognize different algorithm types"""
        return {
            AlgorithmType.SORTING: [
                {"keywords": ["sort", "bubble", "quick", "merge", "heap"], "patterns": [r"swap.*\[.*\]", r"sort.*array"]},
                {"keywords": ["selection", "insertion"], "patterns": [r"min.*max", r"insert.*position"]}
            ],
            AlgorithmType.SEARCHING: [
                {"keywords": ["search", "find", "binary", "linear"], "patterns": [r"target.*array", r"left.*right.*middle"]},
                {"keywords": ["bfs", "dfs", "breadth", "depth"], "patterns": [r"queue", r"stack", r"visited"]}
            ],
            AlgorithmType.DYNAMIC_PROGRAMMING: [
                {"keywords": ["dp", "memoization", "cache"], "patterns": [r"memo\[", r"cache\[", r"dp\["]}
            ],
            AlgorithmType.RECURSIVE: [
                {"keywords": ["recursive", "recursion"], "patterns": [r"def.*\(.*\):.*\1\("]}
            ],
            AlgorithmType.GRAPH: [
                {"keywords": ["graph", "edge", "vertex", "node"], "patterns": [r"adjacency", r"neighbors", r"visited"]}
            ]
        }
    
    def identify_algorithm_type(self, code: str, language: str) -> AlgorithmType:
        """Identify the type of algorithm based on code analysis"""
        code_lower = code.lower()
        
        # Score each algorithm type based on keyword and pattern matches
        scores = {}
        
        for algo_type, pattern_groups in self.algorithm_patterns.items():
            score = 0
            for pattern_group in pattern_groups:
                # Check keywords
                for keyword in pattern_group["keywords"]:
                    if keyword in code_lower:
                        score += 2
                
                # Check patterns
                for pattern in pattern_group["patterns"]:
                    if re.search(pattern, code, re.IGNORECASE):
                        score += 3
                        
            scores[algo_type] = score
        
        # Return the algorithm type with highest score
        if scores:
            best_match = max(scores, key=scores.get)
            if scores[best_match] > 0:
                return best_match
        
        # Default classification based on structure
        if "def " in code and re.search(r"def\s+\w+.*:\s*.*\1\(", code):
            return AlgorithmType.RECURSIVE
        elif "for " in code and "while " in code:
            return AlgorithmType.ITERATIVE
        else:
            return AlgorithmType.DATA_STRUCTURE
    
    def analyze_complexity(self, code: str, language: str) -> Tuple[ComplexityClass, ComplexityClass]:
        """Analyze time and space complexity of the code"""
        
        # Simple heuristic-based complexity analysis
        nested_loops = self._count_nested_loops(code)
        recursive_calls = len(re.findall(r"def\s+(\w+).*:\s*.*\1\(", code))
        
        # Time complexity estimation
        if recursive_calls > 0:
            if "fibonacci" in code.lower() or "fib" in code.lower():
                time_complexity = ComplexityClass.EXPONENTIAL
            elif any(word in code.lower() for word in ["binary", "divide", "merge"]):
                time_complexity = ComplexityClass.LINEARITHMIC
            else:
                time_complexity = ComplexityClass.LINEAR
        elif nested_loops >= 3:
            time_complexity = ComplexityClass.CUBIC
        elif nested_loops >= 2:
            time_complexity = ComplexityClass.QUADRATIC
        elif nested_loops >= 1:
            time_complexity = ComplexityClass.LINEAR
        elif any(word in code.lower() for word in ["binary", "log", "divide"]):
            time_complexity = ComplexityClass.LOGARITHMIC
        else:
            time_complexity = ComplexityClass.CONSTANT
        
        # Space complexity estimation (simplified)
        if recursive_calls > 0:
            if "fibonacci" in code.lower():
                space_complexity = ComplexityClass.EXPONENTIAL
            else:
                space_complexity = ComplexityClass.LINEAR  # Stack space
        elif "array" in code.lower() and "new" in code.lower():
            space_complexity = ComplexityClass.LINEAR
        else:
            space_complexity = ComplexityClass.CONSTANT
            
        return time_complexity, space_complexity
    
    def _count_nested_loops(self, code: str) -> int:
        """Count the maximum nesting level of loops"""
        lines = code.split('\n')
        max_nesting = 0
        current_nesting = 0
        indent_stack = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
                
            indent = len(line) - len(line.lstrip())
            
            # Handle indentation changes
            while indent_stack and indent <= indent_stack[-1][1]:
                popped = indent_stack.pop()
                if popped[0] in ['for', 'while']:
                    current_nesting -= 1
            
            # Check for loop keywords
            if stripped.startswith(('for ', 'while ')):
                current_nesting += 1
                max_nesting = max(max_nesting, current_nesting)
                indent_stack.append(('for' if stripped.startswith('for ') else 'while', indent))
            elif any(stripped.startswith(keyword) for keyword in ['if ', 'def ', 'class ', 'try:', 'except:']):
                indent_stack.append(('other', indent))
        
        return max_nesting
    
    def generate_step_by_step_explanation(self, code: str, language: str, 
                                        user_level: str = "intermediate") -> List[CodeFlowStep]:
        """Generate detailed step-by-step explanation of code execution"""
        lines = code.split('\n')
        steps = []
        step_number = 1
        
        # Track variables for state explanation
        variable_tracker = {}
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                continue
            
            # Analyze the line for different constructs
            explanation = self._explain_code_line(stripped, variable_tracker, user_level)
            
            # Update variable state
            self._update_variable_state(stripped, variable_tracker)
            
            # Determine complexity contribution
            complexity_note = self._get_complexity_note(stripped)
            
            # Generate learning notes
            learning_notes = self._generate_learning_notes(stripped, user_level)
            
            step = CodeFlowStep(
                step_number=step_number,
                line_number=i,
                code_snippet=stripped,
                explanation=explanation,
                variables_state=variable_tracker.copy(),
                complexity_contribution=complexity_note,
                learning_notes=learning_notes
            )
            
            steps.append(step)
            step_number += 1
        
        return steps
    
    def _explain_code_line(self, line: str, variables: Dict, user_level: str) -> str:
        """Explain what a specific line of code does"""
        
        # Variable assignment
        if '=' in line and not any(op in line for op in ['==', '!=', '<=', '>=']):
            if user_level == "beginner":
                return f"This line assigns a value to a variable. The computer stores this information in memory."
            else:
                var_name = line.split('=')[0].strip()
                return f"Assigns the result of the expression to variable '{var_name}'. This updates the program's state."
        
        # Conditional statements
        elif line.startswith('if '):
            if user_level == "beginner":
                return "This is a decision point. The computer checks if something is true or false."
            else:
                return "Evaluates the condition and branches execution based on the result."
        
        # Loops
        elif line.startswith('for '):
            if user_level == "beginner":
                return "This starts a loop. The computer will repeat the following steps multiple times."
            else:
                return "Initiates iteration over a sequence or range. Each iteration updates the loop variable."
        
        elif line.startswith('while '):
            if user_level == "beginner":
                return "This starts a loop that continues as long as the condition is true."
            else:
                return "Begins conditional iteration. Continues until the condition becomes false."
        
        # Function calls
        elif '(' in line and ')' in line and not line.startswith(('if', 'for', 'while')):
            if user_level == "beginner":
                return "This line calls a function to perform a specific task."
            else:
                func_name = line.split('(')[0].strip()
                return f"Invokes function '{func_name}' with the provided arguments."
        
        # Return statements
        elif line.startswith('return'):
            if user_level == "beginner":
                return "This gives back a result from the function."
            else:
                return "Returns a value to the caller and exits the current function."
        
        # Default explanation
        else:
            return "Executes the specified operation."
    
    def _update_variable_state(self, line: str, variables: Dict):
        """Update the tracked variable state based on the code line"""
        if '=' in line and not any(op in line for op in ['==', '!=', '<=', '>=']):
            parts = line.split('=', 1)
            if len(parts) == 2:
                var_name = parts[0].strip()
                value_expr = parts[1].strip()
                
                # Simple value tracking
                if value_expr.isdigit():
                    variables[var_name] = int(value_expr)
                elif value_expr.startswith('"') and value_expr.endswith('"'):
                    variables[var_name] = value_expr[1:-1]
                elif value_expr in variables:
                    variables[var_name] = variables[value_expr]
                else:
                    variables[var_name] = f"<{value_expr}>"
    
    def _get_complexity_note(self, line: str) -> str:
        """Get complexity contribution note for a line"""
        if line.startswith('for ') or line.startswith('while '):
            return "O(n) - Linear time for iteration"
        elif '==' in line or '!=' in line or '<' in line or '>' in line:
            return "O(1) - Constant time comparison"
        elif '.append(' in line or '.insert(' in line:
            return "O(1) - Constant time list operation"
        elif '.sort(' in line:
            return "O(n log n) - Efficient sorting operation"
        else:
            return "O(1) - Constant time operation"
    
    def _generate_learning_notes(self, line: str, user_level: str) -> List[str]:
        """Generate learning notes for a code line"""
        notes = []
        
        if line.startswith('for '):
            if user_level == "beginner":
                notes.append("Loops are fundamental for repetitive tasks")
                notes.append("The loop variable changes each iteration")
            else:
                notes.append("Consider loop invariants and termination conditions")
                notes.append("Analyze the time complexity of nested loops")
        
        elif '=' in line and not any(op in line for op in ['==', '!=', '<=', '>=']):
            if user_level == "beginner":
                notes.append("Variables store data for later use")
            else:
                notes.append("Consider variable scope and lifetime")
        
        elif line.startswith('if '):
            notes.append("Conditional logic controls program flow")
            if user_level != "beginner":
                notes.append("Consider edge cases and boundary conditions")
        
        return notes
    
    def create_visual_representation(self, code: str, algorithm_type: AlgorithmType) -> VisualRepresentation:
        """Create a visual representation of the algorithm"""
        
        if algorithm_type == AlgorithmType.SORTING:
            return self._create_sorting_visualization(code)
        elif algorithm_type == AlgorithmType.SEARCHING:
            return self._create_search_visualization(code)
        elif algorithm_type == AlgorithmType.RECURSIVE:
            return self._create_recursion_visualization(code)
        else:
            return self._create_generic_flowchart(code)
    
    def _create_sorting_visualization(self, code: str) -> VisualRepresentation:
        """Create visualization for sorting algorithms"""
        return VisualRepresentation(
            diagram_type="array_transformation",
            elements=[
                {"type": "array", "name": "initial", "values": [5, 2, 8, 1, 9]},
                {"type": "array", "name": "step1", "values": [2, 5, 8, 1, 9]},
                {"type": "array", "name": "final", "values": [1, 2, 5, 8, 9]}
            ],
            connections=[
                {"from": "initial", "to": "step1", "label": "Compare and swap"},
                {"from": "step1", "to": "final", "label": "Continue sorting"}
            ],
            annotations=[
                "Each step compares adjacent elements",
                "Smaller elements bubble to the left",
                "Process continues until array is sorted"
            ],
            step_by_step_changes=[
                {"step": 1, "description": "Compare elements at positions 0 and 1"},
                {"step": 2, "description": "Swap if left > right"},
                {"step": 3, "description": "Move to next pair"}
            ]
        )
    
    def _create_search_visualization(self, code: str) -> VisualRepresentation:
        """Create visualization for search algorithms"""
        return VisualRepresentation(
            diagram_type="search_process",
            elements=[
                {"type": "array", "name": "data", "values": [1, 3, 5, 7, 9, 11, 13]},
                {"type": "pointer", "name": "left", "position": 0},
                {"type": "pointer", "name": "right", "position": 6},
                {"type": "pointer", "name": "middle", "position": 3}
            ],
            connections=[
                {"from": "left", "to": "middle", "label": "Search range"},
                {"from": "middle", "to": "right", "label": "Search range"}
            ],
            annotations=[
                "Binary search divides the search space in half",
                "Compare target with middle element",
                "Eliminate half of remaining elements each step"
            ],
            step_by_step_changes=[
                {"step": 1, "description": "Set left=0, right=length-1"},
                {"step": 2, "description": "Calculate middle = (left + right) / 2"},
                {"step": 3, "description": "Compare target with middle element"}
            ]
        )
    
    def _create_recursion_visualization(self, code: str) -> VisualRepresentation:
        """Create visualization for recursive algorithms"""
        return VisualRepresentation(
            diagram_type="call_stack",
            elements=[
                {"type": "stack_frame", "name": "factorial(5)", "level": 0},
                {"type": "stack_frame", "name": "factorial(4)", "level": 1},
                {"type": "stack_frame", "name": "factorial(3)", "level": 2},
                {"type": "stack_frame", "name": "factorial(2)", "level": 3},
                {"type": "stack_frame", "name": "factorial(1)", "level": 4}
            ],
            connections=[
                {"from": "factorial(5)", "to": "factorial(4)", "label": "calls"},
                {"from": "factorial(4)", "to": "factorial(3)", "label": "calls"}
            ],
            annotations=[
                "Each recursive call creates a new stack frame",
                "Base case stops the recursion",
                "Results are combined as calls return"
            ],
            step_by_step_changes=[
                {"step": 1, "description": "factorial(5) calls factorial(4)"},
                {"step": 2, "description": "Stack grows with each recursive call"},
                {"step": 3, "description": "Base case reached, returns begin"}
            ]
        )
    
    def _create_generic_flowchart(self, code: str) -> VisualRepresentation:
        """Create a generic flowchart representation"""
        lines = code.split('\n')
        elements = []
        connections = []
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                continue
                
            if stripped.startswith('if '):
                elements.append({"type": "decision", "name": f"step_{i}", "text": stripped})
            elif stripped.startswith(('for ', 'while ')):
                elements.append({"type": "loop", "name": f"step_{i}", "text": stripped})
            else:
                elements.append({"type": "process", "name": f"step_{i}", "text": stripped})
                
            if i > 0:
                connections.append({"from": f"step_{i-1}", "to": f"step_{i}", "label": "next"})
        
        return VisualRepresentation(
            diagram_type="flowchart",
            elements=elements,
            connections=connections,
            annotations=["Follow the arrows to trace execution flow"],
            step_by_step_changes=[]
        )
    
    def generate_comprehensive_explanation(self, code: str, language: str, 
                                         user_level: str = "intermediate") -> AlgorithmExplanation:
        """Generate a comprehensive explanation of the algorithm"""
        
        # Identify algorithm type and complexity
        algo_type = self.identify_algorithm_type(code, language)
        time_complexity, space_complexity = self.analyze_complexity(code, language)
        
        # Generate step-by-step flow
        code_flow = self.generate_step_by_step_explanation(code, language, user_level)
        
        # Generate algorithm-specific insights
        insights = self._generate_algorithm_insights(code, algo_type, user_level)
        
        return AlgorithmExplanation(
            algorithm_name=insights["name"],
            algorithm_type=algo_type,
            description=insights["description"],
            purpose=insights["purpose"],
            time_complexity=time_complexity,
            space_complexity=space_complexity,
            code_flow=code_flow,
            key_concepts=insights["key_concepts"],
            learning_objectives=insights["learning_objectives"],
            common_mistakes=insights["common_mistakes"],
            optimization_opportunities=insights["optimizations"],
            real_world_applications=insights["applications"],
            related_algorithms=insights["related_algorithms"]
        )
    
    def _generate_algorithm_insights(self, code: str, algo_type: AlgorithmType, 
                                   user_level: str) -> Dict[str, Any]:
        """Generate algorithm-specific insights and educational content"""
        
        insights = {
            AlgorithmType.SORTING: {
                "name": "Sorting Algorithm",
                "description": "Arranges elements in a specific order (ascending or descending)",
                "purpose": "Organize data for efficient searching and processing",
                "key_concepts": ["Comparison", "Swapping", "Invariants", "Stability"],
                "learning_objectives": [
                    "Understand comparison-based sorting",
                    "Learn about algorithm stability",
                    "Analyze time and space complexity"
                ],
                "common_mistakes": [
                    "Off-by-one errors in loop bounds",
                    "Forgetting to handle empty arrays",
                    "Not considering stability requirements"
                ],
                "optimizations": [
                    "Use insertion sort for small arrays",
                    "Implement three-way partitioning for quicksort",
                    "Consider hybrid algorithms"
                ],
                "applications": [
                    "Database indexing",
                    "Search optimization",
                    "Data preprocessing"
                ],
                "related_algorithms": ["Binary Search", "Merge Sort", "Quick Sort"]
            },
            AlgorithmType.SEARCHING: {
                "name": "Search Algorithm",
                "description": "Finds specific elements or patterns in data structures",
                "purpose": "Efficiently locate information in large datasets",
                "key_concepts": ["Binary Search", "Linear Search", "Hash Tables", "Indexing"],
                "learning_objectives": [
                    "Understand search complexity trade-offs",
                    "Learn about preprocessing for faster search",
                    "Master binary search implementation"
                ],
                "common_mistakes": [
                    "Integer overflow in binary search",
                    "Incorrect boundary conditions",
                    "Not handling edge cases"
                ],
                "optimizations": [
                    "Use interpolation search for uniformly distributed data",
                    "Implement exponential search for unbounded arrays",
                    "Consider hash-based lookups"
                ],
                "applications": [
                    "Database queries",
                    "Information retrieval",
                    "Game AI pathfinding"
                ],
                "related_algorithms": ["Sorting", "Hashing", "Tree Traversal"]
            }
        }
        
        # Default insights for unrecognized algorithm types
        default_insights = {
            "name": "Algorithm",
            "description": "A step-by-step procedure for solving a computational problem",
            "purpose": "Efficiently solve a specific problem",
            "key_concepts": ["Logic Flow", "Data Manipulation", "Control Structures"],
            "learning_objectives": [
                "Understand the algorithm's logic",
                "Analyze its efficiency",
                "Identify improvement opportunities"
            ],
            "common_mistakes": [
                "Boundary condition errors",
                "Incorrect logic flow",
                "Performance bottlenecks"
            ],
            "optimizations": [
                "Reduce redundant operations",
                "Optimize data structures",
                "Minimize memory usage"
            ],
            "applications": [
                "Problem-solving",
                "Data processing",
                "System optimization"
            ],
            "related_algorithms": ["Similar algorithms in the same domain"]
        }
        
        return insights.get(algo_type, default_insights)

# Global instance
algorithm_explanation_agent = AlgorithmExplanationAgent()
