"""
Code Refactoring and Improvement Agent
Specialized in providing intelligent refactoring suggestions, performance optimization,
and code quality improvements based on user level and preferences.
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

class RefactoringType(Enum):
    EXTRACT_FUNCTION = "extract_function"
    EXTRACT_CLASS = "extract_class"
    RENAME_VARIABLE = "rename_variable"
    SIMPLIFY_CONDITION = "simplify_condition"
    REMOVE_DUPLICATION = "remove_duplication"
    IMPROVE_NAMING = "improve_naming"
    ADD_DOCUMENTATION = "add_documentation"
    OPTIMIZE_PERFORMANCE = "optimize_performance"
    ENHANCE_READABILITY = "enhance_readability"
    IMPROVE_ERROR_HANDLING = "improve_error_handling"

class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class RefactoringSuggestion:
    suggestion_id: str
    type: RefactoringType
    title: str
    description: str
    priority: Priority
    difficulty: str  # beginner, intermediate, advanced
    code_before: str
    code_after: str
    explanation: str
    benefits: List[str]
    learning_opportunity: str
    estimated_time: str

@dataclass
class PerformanceOptimization:
    optimization_id: str
    performance_issue: str
    current_complexity: str
    optimized_complexity: str
    suggestion: str
    code_example: str
    impact_level: Priority
    explanation: str

@dataclass
class CodeQualityMetrics:
    readability_score: float
    maintainability_score: float
    performance_score: float
    documentation_score: float
    test_coverage_estimate: float
    complexity_score: float
    security_score: float

class CodeRefactoringAgent:
    def __init__(self, gemini_model=None):
        self.gemini_model = gemini_model
        
    def analyze_code_quality(self, code: str, language: str) -> CodeQualityMetrics:
        """Analyze code quality across multiple dimensions"""
        
        # Basic metrics calculation
        lines = code.split('\n')
        total_lines = len([line for line in lines if line.strip()])
        comment_lines = len([line for line in lines if line.strip().startswith('#') or line.strip().startswith('//')])
        
        # Calculate basic scores
        documentation_score = min(1.0, comment_lines / max(total_lines * 0.2, 1))
        
        # Complexity estimation (simplified)
        complexity_indicators = ['if ', 'for ', 'while ', 'try:', 'except:', 'elif ', 'else:']
        complexity_count = sum(code.count(indicator) for indicator in complexity_indicators)
        complexity_score = max(0.1, 1.0 - (complexity_count / max(total_lines * 0.3, 1)))
        
        # Readability estimation
        avg_line_length = sum(len(line) for line in lines) / max(len(lines), 1)
        readability_score = max(0.1, 1.0 - (avg_line_length - 40) / 100) if avg_line_length > 40 else 0.9
        
        # Performance estimation (basic heuristics)
        performance_issues = ['nested_loops', 'global_variables', 'repeated_calculations']
        performance_score = 0.8  # Default good score
        
        if 'for ' in code and code.count('for ') > 1:
            # Check for nested loops
            nested_count = 0
            for i, line in enumerate(lines):
                if 'for ' in line:
                    indent_level = len(line) - len(line.lstrip())
                    for j in range(i+1, min(i+10, len(lines))):
                        if 'for ' in lines[j]:
                            next_indent = len(lines[j]) - len(lines[j].lstrip())
                            if next_indent > indent_level:
                                nested_count += 1
                                break
            performance_score = max(0.2, 0.8 - (nested_count * 0.3))
        
        return CodeQualityMetrics(
            readability_score=readability_score,
            maintainability_score=(readability_score + complexity_score + documentation_score) / 3,
            performance_score=performance_score,
            documentation_score=documentation_score,
            test_coverage_estimate=0.3,  # Placeholder
            complexity_score=complexity_score,
            security_score=0.7  # Placeholder
        )
    
    def suggest_refactoring_improvements(self, code: str, language: str, 
                                       user_level: str = "intermediate") -> List[RefactoringSuggestion]:
        """Generate intelligent refactoring suggestions based on code analysis"""
        suggestions = []
        lines = code.split('\n')
        
        # Analyze function length
        suggestions.extend(self._analyze_function_length(code, language, user_level))
        
        # Analyze variable naming
        suggestions.extend(self._analyze_variable_naming(code, language, user_level))
        
        # Analyze code duplication
        suggestions.extend(self._analyze_code_duplication(code, language, user_level))
        
        # Analyze conditional complexity
        suggestions.extend(self._analyze_conditional_complexity(code, language, user_level))
        
        # Analyze documentation
        suggestions.extend(self._analyze_documentation(code, language, user_level))
        
        # Sort by priority and user level appropriateness
        suggestions.sort(key=lambda x: (
            x.priority.value,
            0 if x.difficulty == user_level else 1
        ))
        
        return suggestions[:8]  # Return top 8 suggestions
    
    def _analyze_function_length(self, code: str, language: str, user_level: str) -> List[RefactoringSuggestion]:
        """Analyze function length and suggest extraction if needed"""
        suggestions = []
        lines = code.split('\n')
        
        current_function = None
        function_start = 0
        function_lines = 0
        
        for i, line in enumerate(lines):
            if 'def ' in line or 'function ' in line:
                # End previous function analysis
                if current_function and function_lines > 20:
                    suggestions.append(RefactoringSuggestion(
                        suggestion_id=f"extract_function_{current_function}",
                        type=RefactoringType.EXTRACT_FUNCTION,
                        title="Extract Large Function",
                        description=f"Function '{current_function}' has {function_lines} lines. Consider breaking it into smaller functions.",
                        priority=Priority.MEDIUM if function_lines > 30 else Priority.LOW,
                        difficulty="intermediate" if user_level == "beginner" else "beginner",
                        code_before='\n'.join(lines[function_start:function_start+min(10, function_lines)]) + "\n# ... rest of function",
                        code_after="# Extract logical blocks into separate functions\ndef helper_function():\n    # Extracted logic here\n    pass\n\ndef main_function():\n    helper_function()\n    # Remaining logic",
                        explanation="Large functions are harder to understand, test, and maintain. Breaking them into smaller, focused functions improves code readability and reusability.",
                        benefits=[
                            "Improved readability",
                            "Easier testing",
                            "Better reusability",
                            "Simplified debugging"
                        ],
                        learning_opportunity="Learn about single responsibility principle and function decomposition",
                        estimated_time="15-30 minutes"
                    ))
                
                # Start new function analysis
                current_function = line.split('def ')[-1].split('(')[0].strip() if 'def ' in line else line.split('function ')[-1].split('(')[0].strip()
                function_start = i
                function_lines = 1
            elif current_function and (line.strip() == '' or line.startswith(' ') or line.startswith('\t')):
                function_lines += 1
            elif current_function:
                # Function ended
                if function_lines > 20:
                    suggestions.append(RefactoringSuggestion(
                        suggestion_id=f"extract_function_{current_function}",
                        type=RefactoringType.EXTRACT_FUNCTION,
                        title="Extract Large Function",
                        description=f"Function '{current_function}' has {function_lines} lines. Consider breaking it into smaller functions.",
                        priority=Priority.MEDIUM if function_lines > 30 else Priority.LOW,
                        difficulty="intermediate" if user_level == "beginner" else "beginner",
                        code_before='\n'.join(lines[function_start:function_start+min(10, function_lines)]) + "\n# ... rest of function",
                        code_after="# Extract logical blocks into separate functions\ndef helper_function():\n    # Extracted logic here\n    pass\n\ndef main_function():\n    helper_function()\n    # Remaining logic",
                        explanation="Large functions are harder to understand, test, and maintain. Breaking them into smaller, focused functions improves code readability and reusability.",
                        benefits=[
                            "Improved readability",
                            "Easier testing", 
                            "Better reusability",
                            "Simplified debugging"
                        ],
                        learning_opportunity="Learn about single responsibility principle and function decomposition",
                        estimated_time="15-30 minutes"
                    ))
                current_function = None
                
        return suggestions
    
    def _analyze_variable_naming(self, code: str, language: str, user_level: str) -> List[RefactoringSuggestion]:
        """Analyze variable naming and suggest improvements"""
        suggestions = []
        
        # Find single letter variables (except common ones like i, j for loops)
        single_letter_vars = re.findall(r'\b[a-z]\b(?!\s*=|\s*in\s)', code)
        loop_vars = re.findall(r'for\s+([a-z])\s+in', code)
        problematic_vars = [var for var in single_letter_vars if var not in ['i', 'j', 'k'] + loop_vars]
        
        if problematic_vars:
            suggestions.append(RefactoringSuggestion(
                suggestion_id="improve_variable_naming",
                type=RefactoringType.IMPROVE_NAMING,
                title="Improve Variable Names",
                description=f"Found {len(problematic_vars)} single-letter variables that could have more descriptive names.",
                priority=Priority.MEDIUM,
                difficulty="beginner",
                code_before=f"# Single letter variables: {', '.join(set(problematic_vars))}\nx = calculate_something()\ny = process_data(x)",
                code_after="# Descriptive variable names\nresult = calculate_something()\nprocessed_data = process_data(result)",
                explanation="Descriptive variable names make code self-documenting and easier to understand. They act as inline documentation for future readers.",
                benefits=[
                    "Self-documenting code",
                    "Reduced need for comments",
                    "Easier code review",
                    "Better maintenance"
                ],
                learning_opportunity="Learn about clean code principles and meaningful naming conventions",
                estimated_time="10-15 minutes"
            ))
            
        return suggestions
    
    def _analyze_code_duplication(self, code: str, language: str, user_level: str) -> List[RefactoringSuggestion]:
        """Analyze code duplication and suggest extraction"""
        suggestions = []
        lines = code.split('\n')
        
        # Simple duplication detection (look for similar line patterns)
        line_patterns = {}
        for i, line in enumerate(lines):
            stripped = line.strip()
            if len(stripped) > 10 and not stripped.startswith('#'):
                if stripped in line_patterns:
                    line_patterns[stripped].append(i)
                else:
                    line_patterns[stripped] = [i]
        
        duplicated_lines = {pattern: occurrences for pattern, occurrences in line_patterns.items() 
                          if len(occurrences) > 1}
        
        if duplicated_lines:
            suggestions.append(RefactoringSuggestion(
                suggestion_id="remove_duplication",
                type=RefactoringType.REMOVE_DUPLICATION,
                title="Remove Code Duplication",
                description=f"Found {len(duplicated_lines)} duplicated code patterns that could be extracted into functions.",
                priority=Priority.MEDIUM,
                difficulty="intermediate",
                code_before="# Duplicated code\nresult1 = process_data(data1)\nvalidate(result1)\nstore(result1)\n\nresult2 = process_data(data2)\nvalidate(result2)\nstore(result2)",
                code_after="# Extracted function\ndef process_and_store(data):\n    result = process_data(data)\n    validate(result)\n    store(result)\n    return result\n\nresult1 = process_and_store(data1)\nresult2 = process_and_store(data2)",
                explanation="Code duplication increases maintenance burden and introduces potential for bugs. Extracting common patterns into functions follows the DRY (Don't Repeat Yourself) principle.",
                benefits=[
                    "Reduced maintenance burden",
                    "Single point of change",
                    "Fewer bugs",
                    "Improved consistency"
                ],
                learning_opportunity="Learn about the DRY principle and function extraction techniques",
                estimated_time="20-30 minutes"
            ))
            
        return suggestions
    
    def _analyze_conditional_complexity(self, code: str, language: str, user_level: str) -> List[RefactoringSuggestion]:
        """Analyze conditional complexity and suggest simplification"""
        suggestions = []
        
        # Find complex conditionals
        complex_conditions = re.findall(r'if\s+.*(?:and|or).*(?:and|or).*:', code)
        nested_ifs = re.findall(r'(\s+)if\s+.*:\s*\n\s+if\s+.*:', code)
        
        if complex_conditions or nested_ifs:
            suggestions.append(RefactoringSuggestion(
                suggestion_id="simplify_conditionals",
                type=RefactoringType.SIMPLIFY_CONDITION,
                title="Simplify Complex Conditionals",
                description=f"Found complex conditional statements that could be simplified for better readability.",
                priority=Priority.MEDIUM,
                difficulty="intermediate",
                code_before="if user.is_active and user.has_permission('read') and user.subscription.is_valid and not user.is_banned:\n    process_request()",
                code_after="def can_process_request(user):\n    return (user.is_active and \n            user.has_permission('read') and \n            user.subscription.is_valid and \n            not user.is_banned)\n\nif can_process_request(user):\n    process_request()",
                explanation="Complex conditionals are hard to read and understand. Breaking them into well-named functions or variables improves readability and testability.",
                benefits=[
                    "Improved readability",
                    "Easier testing",
                    "Better maintainability",
                    "Self-documenting logic"
                ],
                learning_opportunity="Learn about guard clauses and conditional decomposition",
                estimated_time="15-25 minutes"
            ))
            
        return suggestions
    
    def _analyze_documentation(self, code: str, language: str, user_level: str) -> List[RefactoringSuggestion]:
        """Analyze code documentation and suggest improvements"""
        suggestions = []
        lines = code.split('\n')
        
        # Count functions without docstrings
        functions_without_docs = 0
        total_functions = 0
        
        for i, line in enumerate(lines):
            if 'def ' in line:
                total_functions += 1
                # Check if next non-empty line is a docstring
                has_docstring = False
                for j in range(i+1, min(i+5, len(lines))):
                    if lines[j].strip():
                        if lines[j].strip().startswith('"""') or lines[j].strip().startswith("'''"):
                            has_docstring = True
                        break
                if not has_docstring:
                    functions_without_docs += 1
        
        if functions_without_docs > 0 and total_functions > 0:
            suggestions.append(RefactoringSuggestion(
                suggestion_id="add_documentation",
                type=RefactoringType.ADD_DOCUMENTATION,
                title="Add Function Documentation",
                description=f"{functions_without_docs} out of {total_functions} functions lack documentation. Adding docstrings improves code understanding.",
                priority=Priority.LOW if user_level == "beginner" else Priority.MEDIUM,
                difficulty="beginner",
                code_before="def calculate_total(items):\n    return sum(item.price for item in items)",
                code_after='def calculate_total(items):\n    """\n    Calculate the total price of all items.\n    \n    Args:\n        items: List of items with price attribute\n        \n    Returns:\n        float: Total price of all items\n    """\n    return sum(item.price for item in items)',
                explanation="Documentation helps other developers (and future you) understand what functions do, their parameters, and return values.",
                benefits=[
                    "Better code understanding",
                    "Easier onboarding for new team members",
                    "Improved maintainability",
                    "Professional code quality"
                ],
                learning_opportunity="Learn about writing effective documentation and docstring conventions",
                estimated_time="5-10 minutes per function"
            ))
            
        return suggestions
    
    def suggest_performance_optimizations(self, code: str, language: str, 
                                        user_level: str = "intermediate") -> List[PerformanceOptimization]:
        """Suggest performance optimizations based on code analysis"""
        optimizations = []
        
        # Analyze for common performance issues
        
        # 1. Nested loops
        if self._has_nested_loops(code):
            optimizations.append(PerformanceOptimization(
                optimization_id="nested_loops",
                performance_issue="Nested loops detected",
                current_complexity="O(n²) or higher",
                optimized_complexity="O(n) or O(n log n)",
                suggestion="Consider using hash maps, sets, or more efficient algorithms to reduce nested iterations",
                code_example="# Instead of:\nfor item1 in list1:\n    for item2 in list2:\n        if item1.id == item2.id:\n            # process\n\n# Use:\nlookup = {item.id: item for item in list2}\nfor item1 in list1:\n    if item1.id in lookup:\n        # process with lookup[item1.id]",
                impact_level=Priority.HIGH,
                explanation="Nested loops often indicate quadratic or higher time complexity. Using hash-based lookups can reduce this to linear time."
            ))
        
        # 2. Repeated calculations
        if self._has_repeated_calculations(code):
            optimizations.append(PerformanceOptimization(
                optimization_id="repeated_calculations",
                performance_issue="Repeated expensive calculations",
                current_complexity="O(n * m) where m is calculation cost",
                optimized_complexity="O(n) with memoization",
                suggestion="Cache results of expensive calculations or move invariant calculations outside loops",
                code_example="# Instead of:\nfor item in items:\n    expensive_calc = heavy_computation(constant_value)\n    result = item.value * expensive_calc\n\n# Use:\nexpensive_calc = heavy_computation(constant_value)  # Calculate once\nfor item in items:\n    result = item.value * expensive_calc",
                impact_level=Priority.MEDIUM,
                explanation="Calculations that don't change within loops should be moved outside to avoid redundant computation."
            ))
        
        # 3. Inefficient data structures
        if 'list' in code and 'in ' in code:
            optimizations.append(PerformanceOptimization(
                optimization_id="inefficient_lookup",
                performance_issue="Linear search in lists",
                current_complexity="O(n) for each lookup",
                optimized_complexity="O(1) average case",
                suggestion="Use sets or dictionaries for frequent membership testing instead of lists",
                code_example="# Instead of:\nvalid_ids = [1, 2, 3, 4, 5]  # list\nif user_id in valid_ids:  # O(n) operation\n\n# Use:\nvalid_ids = {1, 2, 3, 4, 5}  # set\nif user_id in valid_ids:  # O(1) average case",
                impact_level=Priority.MEDIUM,
                explanation="Sets and dictionaries provide O(1) average-case lookup time compared to O(n) for lists."
            ))
        
        return optimizations
    
    def _has_nested_loops(self, code: str) -> bool:
        """Check if code has nested loops"""
        lines = code.split('\n')
        for i, line in enumerate(lines):
            if 'for ' in line or 'while ' in line:
                indent_level = len(line) - len(line.lstrip())
                # Look for another loop within reasonable distance with higher indentation
                for j in range(i+1, min(i+20, len(lines))):
                    if ('for ' in lines[j] or 'while ' in lines[j]):
                        next_indent = len(lines[j]) - len(lines[j].lstrip())
                        if next_indent > indent_level:
                            return True
                    elif lines[j].strip() and len(lines[j]) - len(lines[j].lstrip()) <= indent_level:
                        break  # Exited the loop block
        return False
    
    def _has_repeated_calculations(self, code: str) -> bool:
        """Check for repeated function calls or calculations"""
        lines = code.split('\n')
        function_calls = re.findall(r'(\w+\([^)]*\))', code)
        call_counts = {}
        
        for call in function_calls:
            call_counts[call] = call_counts.get(call, 0) + 1
        
        # Check if any function call appears multiple times within loops
        in_loop = False
        for line in lines:
            if 'for ' in line or 'while ' in line:
                in_loop = True
            elif line.strip() and not line.startswith(' ') and not line.startswith('\t'):
                in_loop = False
            
            if in_loop:
                for call, count in call_counts.items():
                    if count > 2 and call in line and '(' in call:
                        return True
        
        return False
    
    def generate_responsive_suggestions(self, code: str, component_type: str = "web") -> List[str]:
        """Generate suggestions for making components responsive"""
        suggestions = []
        
        if component_type == "web":
            suggestions.extend([
                "Use CSS Grid or Flexbox for flexible layouts",
                "Implement media queries for different screen sizes",
                "Use relative units (%, em, rem, vw, vh) instead of fixed pixels",
                "Consider mobile-first responsive design approach",
                "Optimize touch targets for mobile devices (min 44px)",
                "Use responsive images with srcset attribute",
                "Implement progressive enhancement for better accessibility"
            ])
        
        # Analyze existing code for specific suggestions
        if 'px' in code:
            suggestions.append("Replace fixed pixel values with relative units for better scalability")
        
        if 'width:' in code and 'height:' in code:
            suggestions.append("Consider using aspect-ratio CSS property for maintaining proportions")
        
        return suggestions[:5]

# Global instance
code_refactoring_agent = CodeRefactoringAgent()
