"""
Advanced Code Analysis and Review System
Provides intelligent code review, bug detection, and educational feedback
"""

import ast
import re
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class IssueLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class IssueCategory(Enum):
    SECURITY = "security"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"
    RELIABILITY = "reliability"
    STYLE = "style"
    LOGIC = "logic"

@dataclass
class CodeIssue:
    line_number: int
    column: int
    issue_type: IssueCategory
    severity: IssueLevel
    message: str
    suggestion: str
    educational_note: str
    example_fix: Optional[str] = None

@dataclass
class CodeMetrics:
    lines_of_code: int
    cyclomatic_complexity: int
    cognitive_complexity: int
    maintainability_index: float
    technical_debt_ratio: float
    duplication_percentage: float

@dataclass
class SecurityAnalysis:
    vulnerabilities: List[CodeIssue]
    security_score: float
    risk_assessment: str
    recommendations: List[str]

@dataclass
class PerformanceAnalysis:
    bottlenecks: List[CodeIssue]
    performance_score: float
    optimization_suggestions: List[str]
    algorithmic_complexity: str

@dataclass
class ComprehensiveCodeReview:
    overall_score: float
    metrics: CodeMetrics
    issues: List[CodeIssue]
    security_analysis: SecurityAnalysis
    performance_analysis: PerformanceAnalysis
    educational_insights: List[str]
    improvement_roadmap: List[str]

class AdvancedCodeAnalyzer:
    def __init__(self):
        self.security_patterns = self._load_security_patterns()
        self.performance_patterns = self._load_performance_patterns()
        self.best_practices = self._load_best_practices()
    
    def analyze_code_comprehensive(self, code: str, language: str = "javascript", user_level: str = "beginner") -> ComprehensiveCodeReview:
        """Perform comprehensive code analysis tailored to user level"""
        
        # Calculate metrics
        metrics = self._calculate_code_metrics(code)
        
        # Detect issues
        issues = []
        issues.extend(self._analyze_security(code, language))
        issues.extend(self._analyze_performance(code, language))
        issues.extend(self._analyze_maintainability(code, language))
        issues.extend(self._analyze_style(code, language))
        issues.extend(self._analyze_logic(code, language))
        
        # Security analysis
        security_analysis = self._perform_security_analysis(code, language)
        
        # Performance analysis
        performance_analysis = self._perform_performance_analysis(code, language)
        
        # Generate educational insights based on user level
        educational_insights = self._generate_educational_insights(code, issues, user_level)
        
        # Create improvement roadmap
        improvement_roadmap = self._create_improvement_roadmap(issues, user_level)
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(metrics, issues)
        
        return ComprehensiveCodeReview(
            overall_score=overall_score,
            metrics=metrics,
            issues=issues,
            security_analysis=security_analysis,
            performance_analysis=performance_analysis,
            educational_insights=educational_insights,
            improvement_roadmap=improvement_roadmap
        )
    
    def _calculate_code_metrics(self, code: str) -> CodeMetrics:
        """Calculate comprehensive code metrics"""
        lines = [line.strip() for line in code.split('\n') if line.strip()]
        lines_of_code = len(lines)
        
        # Cyclomatic complexity
        cyclomatic_complexity = self._calculate_cyclomatic_complexity(code)
        
        # Cognitive complexity (subjective complexity)
        cognitive_complexity = self._calculate_cognitive_complexity(code)
        
        # Maintainability index (0-100)
        maintainability_index = self._calculate_maintainability_index(code, cyclomatic_complexity)
        
        # Technical debt ratio
        technical_debt_ratio = self._calculate_technical_debt(code)
        
        # Code duplication
        duplication_percentage = self._calculate_duplication(code)
        
        return CodeMetrics(
            lines_of_code=lines_of_code,
            cyclomatic_complexity=cyclomatic_complexity,
            cognitive_complexity=cognitive_complexity,
            maintainability_index=maintainability_index,
            technical_debt_ratio=technical_debt_ratio,
            duplication_percentage=duplication_percentage
        )
    
    def _calculate_cyclomatic_complexity(self, code: str) -> int:
        """Calculate McCabe cyclomatic complexity"""
        complexity = 1  # Base complexity
        
        # Decision points that increase complexity
        decision_patterns = [
            r'\bif\b', r'\belse\b', r'\belif\b', r'\bfor\b', r'\bwhile\b',
            r'\btry\b', r'\bcatch\b', r'\bswitch\b', r'\bcase\b',
            r'\band\b', r'\bor\b', r'\?\s*.*\s*:', r'\|\|', r'\&\&'
        ]
        
        for pattern in decision_patterns:
            matches = re.findall(pattern, code, re.IGNORECASE)
            complexity += len(matches)
        
        return complexity
    
    def _calculate_cognitive_complexity(self, code: str) -> int:
        """Calculate cognitive complexity (how hard it is to understand)"""
        cognitive_score = 0
        nesting_level = 0
        
        lines = code.split('\n')
        for line in lines:
            line = line.strip()
            
            # Track nesting level
            if any(keyword in line.lower() for keyword in ['if', 'for', 'while', 'try', 'function']):
                if '{' in line or line.endswith(':'):
                    nesting_level += 1
                    cognitive_score += nesting_level  # Nested structures are harder to understand
            
            if '}' in line:
                nesting_level = max(0, nesting_level - 1)
            
            # Complex expressions
            if '&&' in line or '||' in line:
                cognitive_score += 1
            
            # Ternary operators
            if '?' in line and ':' in line:
                cognitive_score += 1
        
        return cognitive_score
    
    def _calculate_maintainability_index(self, code: str, complexity: int) -> float:
        """Calculate maintainability index (0-100, higher is better)"""
        lines = len([line for line in code.split('\n') if line.strip()])
        
        if lines == 0:
            return 100.0
        
        # Simplified maintainability calculation
        base_score = 100
        complexity_penalty = complexity * 2
        length_penalty = max(0, (lines - 50) * 0.1)
        
        # Comment ratio bonus
        comment_lines = len([line for line in code.split('\n') if '//' in line or '/*' in line])
        comment_bonus = (comment_lines / lines) * 10 if lines > 0 else 0
        
        score = base_score - complexity_penalty - length_penalty + comment_bonus
        return max(0, min(100, score))
    
    def _calculate_technical_debt(self, code: str) -> float:
        """Calculate technical debt ratio"""
        debt_indicators = [
            'TODO', 'FIXME', 'HACK', 'XXX', 'BUG',
            'console.log', 'alert(', 'debugger',
            'eval(', 'with(', 'document.write'
        ]
        
        lines = code.split('\n')
        debt_lines = 0
        
        for line in lines:
            if any(indicator in line for indicator in debt_indicators):
                debt_lines += 1
        
        total_lines = len([line for line in lines if line.strip()])
        return (debt_lines / total_lines) if total_lines > 0 else 0.0
    
    def _calculate_duplication(self, code: str) -> float:
        """Calculate code duplication percentage"""
        lines = [line.strip() for line in code.split('\n') if line.strip() and not line.startswith('//')]
        
        if len(lines) < 3:
            return 0.0
        
        duplicated_lines = 0
        line_counts = {}
        
        for line in lines:
            if len(line) > 10:  # Only consider substantial lines
                line_counts[line] = line_counts.get(line, 0) + 1
        
        for line, count in line_counts.items():
            if count > 1:
                duplicated_lines += count - 1
        
        return (duplicated_lines / len(lines)) * 100
    
    def _analyze_security(self, code: str, language: str) -> List[CodeIssue]:
        """Analyze code for security vulnerabilities"""
        issues = []
        lines = code.split('\n')
        
        security_checks = [
            {
                'pattern': r'eval\s*\(',
                'message': "Use of eval() can execute arbitrary code",
                'suggestion': "Avoid eval(). Use JSON.parse() for JSON or other safe alternatives",
                'severity': IssueLevel.CRITICAL,
                'educational_note': "eval() executes any JavaScript code, making it vulnerable to code injection attacks"
            },
            {
                'pattern': r'innerHTML\s*=.*\+',
                'message': "Potential XSS vulnerability with innerHTML",
                'suggestion': "Use textContent or properly sanitize input before using innerHTML",
                'severity': IssueLevel.ERROR,
                'educational_note': "Concatenating user input with innerHTML can lead to Cross-Site Scripting (XSS) attacks"
            },
            {
                'pattern': r'document\.write\s*\(',
                'message': "document.write() is vulnerable and blocks DOM parsing",
                'suggestion': "Use modern DOM manipulation methods like createElement()",
                'severity': IssueLevel.WARNING,
                'educational_note': "document.write() can be exploited and affects page performance"
            },
            {
                'pattern': r'localStorage\.setItem.*password|localStorage\.setItem.*token',
                'message': "Storing sensitive data in localStorage",
                'suggestion': "Use secure storage methods or avoid storing sensitive data client-side",
                'severity': IssueLevel.ERROR,
                'educational_note': "localStorage is accessible to any script on the page and persists data"
            }
        ]
        
        for i, line in enumerate(lines):
            for check in security_checks:
                if re.search(check['pattern'], line, re.IGNORECASE):
                    issues.append(CodeIssue(
                        line_number=i + 1,
                        column=0,
                        issue_type=IssueCategory.SECURITY,
                        severity=check['severity'],
                        message=check['message'],
                        suggestion=check['suggestion'],
                        educational_note=check['educational_note']
                    ))
        
        return issues
    
    def _analyze_performance(self, code: str, language: str) -> List[CodeIssue]:
        """Analyze code for performance issues"""
        issues = []
        lines = code.split('\n')
        
        performance_checks = [
            {
                'pattern': r'for\s*\([^;]*\.length[^;]*;',
                'message': "Array.length called in loop condition",
                'suggestion': "Cache array.length in a variable before the loop",
                'severity': IssueLevel.WARNING,
                'educational_note': "Accessing .length property in each iteration can impact performance in large arrays"
            },
            {
                'pattern': r'document\.getElementById.*document\.getElementById',
                'message': "Multiple DOM queries",
                'suggestion': "Cache DOM elements in variables to avoid repeated queries",
                'severity': IssueLevel.INFO,
                'educational_note': "DOM queries are expensive operations; caching elements improves performance"
            },
            {
                'pattern': r'\+\=.*[\'\""].*[\'\""]',
                'message': "String concatenation in loop",
                'suggestion': "Use array.join() or template literals for better performance",
                'severity': IssueLevel.WARNING,
                'educational_note': "String concatenation creates new string objects; arrays are more efficient for building strings"
            }
        ]
        
        for i, line in enumerate(lines):
            for check in performance_checks:
                if re.search(check['pattern'], line):
                    issues.append(CodeIssue(
                        line_number=i + 1,
                        column=0,
                        issue_type=IssueCategory.PERFORMANCE,
                        severity=check['severity'],
                        message=check['message'],
                        suggestion=check['suggestion'],
                        educational_note=check['educational_note']
                    ))
        
        return issues
    
    def _analyze_maintainability(self, code: str, language: str) -> List[CodeIssue]:
        """Analyze code maintainability"""
        issues = []
        lines = code.split('\n')
        
        # Check for long functions
        function_lines = self._count_function_lines(code)
        for func_name, line_count in function_lines.items():
            if line_count > 20:
                issues.append(CodeIssue(
                    line_number=1,
                    column=0,
                    issue_type=IssueCategory.MAINTAINABILITY,
                    severity=IssueLevel.WARNING,
                    message=f"Function '{func_name}' is too long ({line_count} lines)",
                    suggestion="Break down large functions into smaller, focused functions",
                    educational_note="Smaller functions are easier to test, debug, and understand"
                ))
        
        # Check for magic numbers
        magic_numbers = re.findall(r'\b(?!0|1)\d{2,}\b', code)
        if magic_numbers:
            issues.append(CodeIssue(
                line_number=1,
                column=0,
                issue_type=IssueCategory.MAINTAINABILITY,
                severity=IssueLevel.INFO,
                message="Magic numbers found in code",
                suggestion="Replace magic numbers with named constants",
                educational_note="Named constants make code more readable and maintainable"
            ))
        
        return issues
    
    def _analyze_style(self, code: str, language: str) -> List[CodeIssue]:
        """Analyze code style and formatting"""
        issues = []
        lines = code.split('\n')
        
        # Check indentation consistency
        indent_sizes = []
        for i, line in enumerate(lines):
            if line.strip():
                indent = len(line) - len(line.lstrip())
                if indent > 0:
                    indent_sizes.append(indent)
        
        if indent_sizes:
            # Check for mixed indentation
            has_tabs = any('\t' in line for line in lines)
            has_spaces = any('  ' in line for line in lines)
            
            if has_tabs and has_spaces:
                issues.append(CodeIssue(
                    line_number=1,
                    column=0,
                    issue_type=IssueCategory.STYLE,
                    severity=IssueLevel.WARNING,
                    message="Mixed tabs and spaces for indentation",
                    suggestion="Use consistent indentation (either tabs or spaces)",
                    educational_note="Consistent indentation improves code readability"
                ))
        
        return issues
    
    def _analyze_logic(self, code: str, language: str) -> List[CodeIssue]:
        """Analyze logical issues and potential bugs"""
        issues = []
        lines = code.split('\n')
        
        logic_checks = [
            {
                'pattern': r'if\s*\([^)]*=(?!=)',
                'message': "Assignment in if condition (possible typo)",
                'suggestion': "Use == or === for comparison, = for assignment",
                'severity': IssueLevel.ERROR,
                'educational_note': "Assignment (=) in conditions often indicates a typo; use comparison operators"
            },
            {
                'pattern': r'==(?!=)',
                'message': "Use of loose equality operator",
                'suggestion': "Use strict equality (===) to avoid type coercion",
                'severity': IssueLevel.WARNING,
                'educational_note': "Strict equality prevents unexpected type conversions"
            }
        ]
        
        for i, line in enumerate(lines):
            for check in logic_checks:
                if re.search(check['pattern'], line):
                    issues.append(CodeIssue(
                        line_number=i + 1,
                        column=0,
                        issue_type=IssueCategory.LOGIC,
                        severity=check['severity'],
                        message=check['message'],
                        suggestion=check['suggestion'],
                        educational_note=check['educational_note']
                    ))
        
        return issues
    
    def _perform_security_analysis(self, code: str, language: str) -> SecurityAnalysis:
        """Perform comprehensive security analysis"""
        security_issues = [issue for issue in self._analyze_security(code, language)]
        
        # Calculate security score (0-100)
        total_issues = len(security_issues)
        critical_issues = len([i for i in security_issues if i.severity == IssueLevel.CRITICAL])
        error_issues = len([i for i in security_issues if i.severity == IssueLevel.ERROR])
        
        security_score = max(0, 100 - (critical_issues * 30) - (error_issues * 15) - (total_issues * 5))
        
        # Risk assessment
        if security_score >= 80:
            risk_assessment = "Low Risk"
        elif security_score >= 60:
            risk_assessment = "Medium Risk"
        elif security_score >= 40:
            risk_assessment = "High Risk"
        else:
            risk_assessment = "Critical Risk"
        
        recommendations = [
            "Implement input validation and sanitization",
            "Use HTTPS for all data transmission",
            "Implement proper authentication and authorization",
            "Regular security audits and updates"
        ]
        
        return SecurityAnalysis(
            vulnerabilities=security_issues,
            security_score=security_score,
            risk_assessment=risk_assessment,
            recommendations=recommendations
        )
    
    def _perform_performance_analysis(self, code: str, language: str) -> PerformanceAnalysis:
        """Perform comprehensive performance analysis"""
        performance_issues = [issue for issue in self._analyze_performance(code, language)]
        
        # Calculate performance score
        performance_score = max(0, 100 - len(performance_issues) * 10)
        
        # Algorithmic complexity assessment
        complexity = self._calculate_cyclomatic_complexity(code)
        if complexity <= 5:
            algorithmic_complexity = "O(1) - Constant time"
        elif complexity <= 10:
            algorithmic_complexity = "O(n) - Linear time"
        elif complexity <= 20:
            algorithmic_complexity = "O(n²) - Quadratic time"
        else:
            algorithmic_complexity = "O(n³+) - Higher order complexity"
        
        optimization_suggestions = [
            "Cache frequently accessed DOM elements",
            "Use efficient data structures",
            "Minimize DOM manipulations",
            "Implement lazy loading where appropriate"
        ]
        
        return PerformanceAnalysis(
            bottlenecks=performance_issues,
            performance_score=performance_score,
            optimization_suggestions=optimization_suggestions,
            algorithmic_complexity=algorithmic_complexity
        )
    
    def _generate_educational_insights(self, code: str, issues: List[CodeIssue], user_level: str) -> List[str]:
        """Generate educational insights based on user level"""
        insights = []
        
        if user_level == "beginner":
            insights.extend([
                "Focus on writing clean, readable code first",
                "Use meaningful variable and function names",
                "Add comments to explain complex logic",
                "Practice breaking down problems into smaller functions"
            ])
        elif user_level == "intermediate":
            insights.extend([
                "Consider performance implications of your code",
                "Learn about security best practices",
                "Explore design patterns for better code organization",
                "Practice writing unit tests for your functions"
            ])
        else:  # advanced
            insights.extend([
                "Optimize for maintainability and scalability",
                "Consider architectural patterns and principles",
                "Implement comprehensive error handling",
                "Focus on code documentation and team collaboration"
            ])
        
        # Add specific insights based on detected issues
        issue_categories = set(issue.issue_type for issue in issues)
        
        if IssueCategory.SECURITY in issue_categories:
            insights.append("Security is crucial - always validate and sanitize user input")
        
        if IssueCategory.PERFORMANCE in issue_categories:
            insights.append("Performance optimization should be based on actual measurements, not assumptions")
        
        return insights
    
    def _create_improvement_roadmap(self, issues: List[CodeIssue], user_level: str) -> List[str]:
        """Create a personalized improvement roadmap"""
        roadmap = []
        
        # Prioritize issues by severity
        critical_issues = [i for i in issues if i.severity == IssueLevel.CRITICAL]
        error_issues = [i for i in issues if i.severity == IssueLevel.ERROR]
        warning_issues = [i for i in issues if i.severity == IssueLevel.WARNING]
        
        if critical_issues:
            roadmap.append("1. Address critical security vulnerabilities immediately")
        
        if error_issues:
            roadmap.append("2. Fix logical errors and major issues")
        
        if warning_issues:
            roadmap.append("3. Improve code quality by addressing warnings")
        
        # Add level-appropriate next steps
        if user_level == "beginner":
            roadmap.extend([
                "4. Practice writing functions with single responsibilities",
                "5. Learn about error handling and validation",
                "6. Study common algorithms and data structures"
            ])
        elif user_level == "intermediate":
            roadmap.extend([
                "4. Learn advanced JavaScript features (ES6+)",
                "5. Study software design patterns",
                "6. Practice test-driven development"
            ])
        else:
            roadmap.extend([
                "4. Explore architectural patterns and principles",
                "5. Contribute to open-source projects",
                "6. Mentor other developers and share knowledge"
            ])
        
        return roadmap
    
    def _calculate_overall_score(self, metrics: CodeMetrics, issues: List[CodeIssue]) -> float:
        """Calculate overall code quality score"""
        base_score = metrics.maintainability_index
        
        # Deduct points for issues
        for issue in issues:
            if issue.severity == IssueLevel.CRITICAL:
                base_score -= 20
            elif issue.severity == IssueLevel.ERROR:
                base_score -= 10
            elif issue.severity == IssueLevel.WARNING:
                base_score -= 5
            else:  # INFO
                base_score -= 2
        
        return max(0, min(100, base_score))
    
    def _count_function_lines(self, code: str) -> Dict[str, int]:
        """Count lines in each function"""
        function_lines = {}
        current_function = None
        brace_count = 0
        
        lines = code.split('\n')
        for line in lines:
            # Simple function detection
            func_match = re.search(r'function\s+(\w+)', line)
            if func_match:
                current_function = func_match.group(1)
                function_lines[current_function] = 0
                brace_count = 0
            
            if current_function:
                function_lines[current_function] += 1
                brace_count += line.count('{') - line.count('}')
                
                if brace_count <= 0 and '}' in line:
                    current_function = None
        
        return function_lines
    
    def _load_security_patterns(self) -> Dict:
        """Load security vulnerability patterns"""
        return {
            "xss_patterns": [r'innerHTML\s*=', r'document\.write'],
            "injection_patterns": [r'eval\s*\(', r'setTimeout\s*\(\s*["\'][^"\']*["\']'],
            "storage_patterns": [r'localStorage\.setItem.*password']
        }
    
    def _load_performance_patterns(self) -> Dict:
        """Load performance anti-patterns"""
        return {
            "dom_patterns": [r'getElementById.*getElementById', r'querySelector.*querySelector'],
            "loop_patterns": [r'for.*\.length', r'while.*\.length'],
            "string_patterns": [r'\+\=.*["\']']
        }
    
    def _load_best_practices(self) -> Dict:
        """Load best practices patterns"""
        return {
            "naming": [r'[a-z][a-zA-Z0-9]*', r'[A-Z][a-zA-Z0-9]*'],
            "functions": [r'function\s+\w+\s*\([^)]*\)\s*{'],
            "comments": [r'//.*', r'/\*.*\*/']
        }

# Global instance
advanced_analyzer = AdvancedCodeAnalyzer()
