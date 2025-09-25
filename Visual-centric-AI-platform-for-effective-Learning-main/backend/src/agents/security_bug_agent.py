"""
Security and Bug Detection Agent
Specialized in identifying potential security vulnerabilities, bugs, and code quality issues.
"""

import re
import ast
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class VulnerabilityType(Enum):
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    COMMAND_INJECTION = "command_injection"
    PATH_TRAVERSAL = "path_traversal"
    HARDCODED_SECRETS = "hardcoded_secrets"
    INSECURE_RANDOM = "insecure_random"
    WEAK_CRYPTO = "weak_crypto"
    UNVALIDATED_INPUT = "unvalidated_input"
    INFORMATION_DISCLOSURE = "information_disclosure"
    INSECURE_DESERIALIZATION = "insecure_deserialization"

class BugType(Enum):
    NULL_POINTER = "null_pointer"
    ARRAY_OUT_OF_BOUNDS = "array_out_of_bounds"
    INFINITE_LOOP = "infinite_loop"
    MEMORY_LEAK = "memory_leak"
    RACE_CONDITION = "race_condition"
    LOGIC_ERROR = "logic_error"
    TYPE_ERROR = "type_error"
    RESOURCE_LEAK = "resource_leak"
    DEADLOCK = "deadlock"
    EXCEPTION_NOT_HANDLED = "exception_not_handled"

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class SecurityIssue:
    issue_id: str
    vulnerability_type: VulnerabilityType
    severity: Severity
    title: str
    description: str
    location: str
    code_snippet: str
    recommendation: str
    cwe_id: Optional[str]  # Common Weakness Enumeration ID
    learning_resource: str
    fix_example: str

@dataclass
class BugReport:
    bug_id: str
    bug_type: BugType
    severity: Severity
    title: str
    description: str
    location: str
    code_snippet: str
    fix_suggestion: str
    prevention_tip: str
    test_suggestion: str

@dataclass
class CodeQualityIssue:
    issue_id: str
    category: str  # naming, structure, complexity, etc.
    severity: Severity
    title: str
    description: str
    location: str
    suggestion: str
    example: str

class SecurityBugDetectionAgent:
    def __init__(self):
        self.security_patterns = self._initialize_security_patterns()
        self.bug_patterns = self._initialize_bug_patterns()
        
    def _initialize_security_patterns(self) -> Dict[VulnerabilityType, List[Dict]]:
        """Initialize security vulnerability detection patterns"""
        return {
            VulnerabilityType.SQL_INJECTION: [
                {
                    "pattern": r"execute\s*\(\s*[\"'].*\%s.*[\"']\s*\%",
                    "description": "String formatting in SQL queries"
                },
                {
                    "pattern": r"query\s*=.*\+.*",
                    "description": "String concatenation in SQL queries"
                },
                {
                    "pattern": r"SELECT.*\+.*FROM",
                    "description": "Dynamic SQL query construction"
                }
            ],
            VulnerabilityType.XSS: [
                {
                    "pattern": r"innerHTML\s*=\s*.*request\.",
                    "description": "Direct user input to innerHTML"
                },
                {
                    "pattern": r"document\.write\s*\(.*request\.",
                    "description": "User input in document.write"
                },
                {
                    "pattern": r"\.html\s*\(.*request\.",
                    "description": "User input in HTML content"
                }
            ],
            VulnerabilityType.COMMAND_INJECTION: [
                {
                    "pattern": r"os\.system\s*\(.*input\(",
                    "description": "User input in system commands"
                },
                {
                    "pattern": r"subprocess\..*shell=True.*input\(",
                    "description": "User input in shell commands"
                },
                {
                    "pattern": r"eval\s*\(.*input\(",
                    "description": "User input in eval function"
                }
            ],
            VulnerabilityType.HARDCODED_SECRETS: [
                {
                    "pattern": r"password\s*=\s*[\"'][^\"']{8,}[\"']",
                    "description": "Hardcoded password"
                },
                {
                    "pattern": r"api_key\s*=\s*[\"'][A-Za-z0-9]{20,}[\"']",
                    "description": "Hardcoded API key"
                },
                {
                    "pattern": r"secret\s*=\s*[\"'][^\"']{10,}[\"']",
                    "description": "Hardcoded secret"
                }
            ],
            VulnerabilityType.PATH_TRAVERSAL: [
                {
                    "pattern": r"open\s*\(.*\+.*request\.",
                    "description": "User input in file paths"
                },
                {
                    "pattern": r"\.\.\/",
                    "description": "Directory traversal pattern"
                }
            ]
        }
    
    def _initialize_bug_patterns(self) -> Dict[BugType, List[Dict]]:
        """Initialize bug detection patterns"""
        return {
            BugType.NULL_POINTER: [
                {
                    "pattern": r"(\w+)\.(\w+)\s*(?!.*if.*\1)",
                    "description": "Object method call without null check"
                }
            ],
            BugType.INFINITE_LOOP: [
                {
                    "pattern": r"while\s+True\s*:(?!.*break)(?!.*return)",
                    "description": "While True loop without break or return"
                },
                {
                    "pattern": r"for.*range\(\d+\).*while.*:",
                    "description": "Nested loop that might not terminate"
                }
            ],
            BugType.ARRAY_OUT_OF_BOUNDS: [
                {
                    "pattern": r"\[\s*len\s*\(\s*\w+\s*\)\s*\]",
                    "description": "Array access with length as index"
                },
                {
                    "pattern": r"\[\s*\d+\s*\](?!.*len\()",
                    "description": "Fixed index access without bounds check"
                }
            ],
            BugType.EXCEPTION_NOT_HANDLED: [
                {
                    "pattern": r"(open\s*\(|requests\.(get|post)|json\.loads)\s*\([^)]*\)(?!\s*try|\s*except)",
                    "description": "Operations that can raise exceptions without handling"
                }
            ],
            BugType.LOGIC_ERROR: [
                {
                    "pattern": r"if\s+\w+\s*=\s*\w+",
                    "description": "Assignment in if condition (should be ==)"
                },
                {
                    "pattern": r"(\w+)\s*==\s*(\w+)\s*and\s*\1\s*==\s*(?!\2)",
                    "description": "Contradictory conditions"
                }
            ]
        }
    
    def detect_security_vulnerabilities(self, code: str, language: str) -> List[SecurityIssue]:
        """Detect potential security vulnerabilities in code"""
        vulnerabilities = []
        lines = code.split('\n')
        
        for vuln_type, patterns in self.security_patterns.items():
            for pattern_info in patterns:
                pattern = pattern_info["pattern"]
                description = pattern_info["description"]
                
                matches = re.finditer(pattern, code, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = code[:match.start()].count('\n') + 1
                    line_content = lines[line_num - 1] if line_num <= len(lines) else ""
                    
                    vulnerability = self._create_security_issue(
                        vuln_type, description, line_num, line_content, match.group()
                    )
                    vulnerabilities.append(vulnerability)
        
        # Additional context-aware analysis
        vulnerabilities.extend(self._analyze_security_context(code, language))
        
        return vulnerabilities
    
    def detect_bugs(self, code: str, language: str) -> List[BugReport]:
        """Detect potential bugs in code"""
        bugs = []
        lines = code.split('\n')
        
        for bug_type, patterns in self.bug_patterns.items():
            for pattern_info in patterns:
                pattern = pattern_info["pattern"]
                description = pattern_info["description"]
                
                matches = re.finditer(pattern, code, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = code[:match.start()].count('\n') + 1
                    line_content = lines[line_num - 1] if line_num <= len(lines) else ""
                    
                    bug = self._create_bug_report(
                        bug_type, description, line_num, line_content, match.group()
                    )
                    bugs.append(bug)
        
        # AST-based analysis for Python
        if language.lower() == 'python':
            bugs.extend(self._analyze_python_ast(code))
        
        return bugs
    
    def _create_security_issue(self, vuln_type: VulnerabilityType, description: str, 
                             line_num: int, line_content: str, matched_code: str) -> SecurityIssue:
        """Create a security issue report"""
        severity_map = {
            VulnerabilityType.SQL_INJECTION: Severity.CRITICAL,
            VulnerabilityType.XSS: Severity.HIGH,
            VulnerabilityType.COMMAND_INJECTION: Severity.CRITICAL,
            VulnerabilityType.HARDCODED_SECRETS: Severity.HIGH,
            VulnerabilityType.PATH_TRAVERSAL: Severity.HIGH,
            VulnerabilityType.INSECURE_RANDOM: Severity.MEDIUM,
            VulnerabilityType.WEAK_CRYPTO: Severity.HIGH,
            VulnerabilityType.UNVALIDATED_INPUT: Severity.MEDIUM,
            VulnerabilityType.INFORMATION_DISCLOSURE: Severity.MEDIUM,
            VulnerabilityType.INSECURE_DESERIALIZATION: Severity.HIGH
        }
        
        recommendations = {
            VulnerabilityType.SQL_INJECTION: "Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.",
            VulnerabilityType.XSS: "Sanitize and validate all user input. Use proper encoding when outputting data to HTML.",
            VulnerabilityType.COMMAND_INJECTION: "Use subprocess with a list of arguments instead of shell=True. Validate and sanitize all inputs.",
            VulnerabilityType.HARDCODED_SECRETS: "Store secrets in environment variables or secure configuration files. Never commit secrets to version control.",
            VulnerabilityType.PATH_TRAVERSAL: "Validate file paths and use allowlists. Resolve paths and check they're within allowed directories."
        }
        
        fix_examples = {
            VulnerabilityType.SQL_INJECTION: "# Instead of:\nquery = f'SELECT * FROM users WHERE id = {user_id}'\n# Use:\ncursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))",
            VulnerabilityType.XSS: "# Instead of:\nelement.innerHTML = user_input\n# Use:\nelement.textContent = user_input  # or proper sanitization",
            VulnerabilityType.COMMAND_INJECTION: "# Instead of:\nos.system(f'ls {user_path}')\n# Use:\nsubprocess.run(['ls', user_path], check=True)",
            VulnerabilityType.HARDCODED_SECRETS: "# Instead of:\nAPI_KEY = 'sk-1234567890abcdef'\n# Use:\nAPI_KEY = os.getenv('API_KEY')",
            VulnerabilityType.PATH_TRAVERSAL: "# Instead of:\nopen(user_path, 'r')\n# Use:\npath = os.path.realpath(user_path)\nif path.startswith(ALLOWED_DIR):\n    open(path, 'r')"
        }
        
        return SecurityIssue(
            issue_id=f"sec_{vuln_type.value}_{line_num}",
            vulnerability_type=vuln_type,
            severity=severity_map.get(vuln_type, Severity.MEDIUM),
            title=f"{vuln_type.value.replace('_', ' ').title()} Vulnerability",
            description=description,
            location=f"Line {line_num}",
            code_snippet=line_content.strip(),
            recommendation=recommendations.get(vuln_type, "Review and validate this code for security issues."),
            cwe_id=self._get_cwe_id(vuln_type),
            learning_resource=f"Learn more about {vuln_type.value.replace('_', ' ')} prevention",
            fix_example=fix_examples.get(vuln_type, "// See documentation for secure implementation")
        )
    
    def _create_bug_report(self, bug_type: BugType, description: str, 
                          line_num: int, line_content: str, matched_code: str) -> BugReport:
        """Create a bug report"""
        severity_map = {
            BugType.NULL_POINTER: Severity.HIGH,
            BugType.ARRAY_OUT_OF_BOUNDS: Severity.HIGH,
            BugType.INFINITE_LOOP: Severity.MEDIUM,
            BugType.MEMORY_LEAK: Severity.MEDIUM,
            BugType.RACE_CONDITION: Severity.HIGH,
            BugType.LOGIC_ERROR: Severity.MEDIUM,
            BugType.TYPE_ERROR: Severity.MEDIUM,
            BugType.RESOURCE_LEAK: Severity.MEDIUM,
            BugType.DEADLOCK: Severity.HIGH,
            BugType.EXCEPTION_NOT_HANDLED: Severity.MEDIUM
        }
        
        fix_suggestions = {
            BugType.NULL_POINTER: "Add null/None checks before accessing object properties or methods.",
            BugType.ARRAY_OUT_OF_BOUNDS: "Check array length before accessing elements. Use safe indexing methods.",
            BugType.INFINITE_LOOP: "Add proper exit conditions to loops. Include break statements or modify loop variables.",
            BugType.LOGIC_ERROR: "Review the conditional logic. Use == for comparison, = for assignment.",
            BugType.EXCEPTION_NOT_HANDLED: "Wrap risky operations in try-catch blocks and handle exceptions appropriately."
        }
        
        test_suggestions = {
            BugType.NULL_POINTER: "Test with null/empty inputs to verify proper handling.",
            BugType.ARRAY_OUT_OF_BOUNDS: "Test with arrays of different sizes including empty arrays.",
            BugType.INFINITE_LOOP: "Test loop termination conditions with boundary values.",
            BugType.LOGIC_ERROR: "Create unit tests for all conditional branches.",
            BugType.EXCEPTION_NOT_HANDLED: "Test error scenarios to ensure graceful failure handling."
        }
        
        return BugReport(
            bug_id=f"bug_{bug_type.value}_{line_num}",
            bug_type=bug_type,
            severity=severity_map.get(bug_type, Severity.MEDIUM),
            title=f"Potential {bug_type.value.replace('_', ' ').title()}",
            description=description,
            location=f"Line {line_num}",
            code_snippet=line_content.strip(),
            fix_suggestion=fix_suggestions.get(bug_type, "Review this code for potential issues."),
            prevention_tip=f"To prevent {bug_type.value.replace('_', ' ')}, always validate inputs and use defensive programming practices.",
            test_suggestion=test_suggestions.get(bug_type, "Add comprehensive tests for this functionality.")
        )
    
    def _analyze_security_context(self, code: str, language: str) -> List[SecurityIssue]:
        """Perform context-aware security analysis"""
        issues = []
        
        # Check for insecure random number generation
        if re.search(r'random\.random\(\)|Math\.random\(\)', code):
            issues.append(SecurityIssue(
                issue_id="sec_weak_random",
                vulnerability_type=VulnerabilityType.INSECURE_RANDOM,
                severity=Severity.MEDIUM,
                title="Insecure Random Number Generation",
                description="Using predictable random number generators for security-sensitive operations",
                location="Multiple locations",
                code_snippet="random.random() or Math.random()",
                recommendation="Use cryptographically secure random number generators for security-sensitive operations.",
                cwe_id="CWE-338",
                learning_resource="Learn about secure random number generation",
                fix_example="# Use secrets module in Python:\nimport secrets\ntoken = secrets.token_hex(16)"
            ))
        
        # Check for potential information disclosure
        if re.search(r'print\s*\(.*password|console\.log\(.*password', code, re.IGNORECASE):
            issues.append(SecurityIssue(
                issue_id="sec_info_disclosure",
                vulnerability_type=VulnerabilityType.INFORMATION_DISCLOSURE,
                severity=Severity.MEDIUM,
                title="Potential Information Disclosure",
                description="Sensitive information might be logged or printed",
                location="Debug/logging statements",
                code_snippet="Logging sensitive data",
                recommendation="Remove or redact sensitive information from logs and debug output.",
                cwe_id="CWE-532",
                learning_resource="Learn about secure logging practices",
                fix_example="# Instead of logging sensitive data:\nlogger.info(f'Password: {password}')\n# Use:\nlogger.info('User authentication attempted')"
            ))
        
        return issues
    
    def _analyze_python_ast(self, code: str) -> List[BugReport]:
        """Analyze Python code using AST for more accurate bug detection"""
        bugs = []
        
        try:
            tree = ast.parse(code)
            
            # Check for potential attribute access without object validation
            for node in ast.walk(tree):
                if isinstance(node, ast.Attribute):
                    # Check if there's a preceding None check
                    bugs.append(BugReport(
                        bug_id=f"ast_attribute_access_{node.lineno}",
                        bug_type=BugType.NULL_POINTER,
                        severity=Severity.MEDIUM,
                        title="Potential Attribute Access on None",
                        description="Attribute access without null check",
                        location=f"Line {node.lineno}",
                        code_snippet=f"Accessing attribute '{node.attr}'",
                        fix_suggestion="Add None check before accessing attributes",
                        prevention_tip="Always validate objects before accessing their attributes",
                        test_suggestion="Test with None values to ensure proper handling"
                    ))
                    
        except SyntaxError:
            # Skip AST analysis if code has syntax errors
            pass
        
        return bugs[:3]  # Limit to prevent too many similar issues
    
    def _get_cwe_id(self, vuln_type: VulnerabilityType) -> str:
        """Get Common Weakness Enumeration ID for vulnerability type"""
        cwe_mapping = {
            VulnerabilityType.SQL_INJECTION: "CWE-89",
            VulnerabilityType.XSS: "CWE-79",
            VulnerabilityType.COMMAND_INJECTION: "CWE-78",
            VulnerabilityType.PATH_TRAVERSAL: "CWE-22",
            VulnerabilityType.HARDCODED_SECRETS: "CWE-798",
            VulnerabilityType.INSECURE_RANDOM: "CWE-338",
            VulnerabilityType.WEAK_CRYPTO: "CWE-327",
            VulnerabilityType.UNVALIDATED_INPUT: "CWE-20",
            VulnerabilityType.INFORMATION_DISCLOSURE: "CWE-532",
            VulnerabilityType.INSECURE_DESERIALIZATION: "CWE-502"
        }
        return cwe_mapping.get(vuln_type)
    
    def generate_security_summary(self, issues: List[SecurityIssue], bugs: List[BugReport]) -> Dict[str, Any]:
        """Generate a comprehensive security summary"""
        
        # Count issues by severity
        security_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for issue in issues:
            security_by_severity[issue.severity.value] += 1
            
        bugs_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for bug in bugs:
            bugs_by_severity[bug.severity.value] += 1
        
        # Calculate overall security score (0-100)
        total_issues = len(issues) + len(bugs)
        critical_weight = 10
        high_weight = 5
        medium_weight = 2
        low_weight = 1
        
        penalty = (
            security_by_severity["critical"] * critical_weight +
            security_by_severity["high"] * high_weight +
            security_by_severity["medium"] * medium_weight +
            security_by_severity["low"] * low_weight +
            bugs_by_severity["critical"] * critical_weight +
            bugs_by_severity["high"] * high_weight +
            bugs_by_severity["medium"] * medium_weight +
            bugs_by_severity["low"] * low_weight
        )
        
        security_score = max(0, 100 - penalty)
        
        # Generate recommendations
        recommendations = []
        if security_by_severity["critical"] > 0:
            recommendations.append("Address critical security vulnerabilities immediately")
        if security_by_severity["high"] > 0:
            recommendations.append("Fix high-severity security issues before deployment")
        if bugs_by_severity["high"] > 0:
            recommendations.append("Resolve high-severity bugs to prevent runtime failures")
        if total_issues > 10:
            recommendations.append("Consider code review and security testing processes")
        
        return {
            "security_score": security_score,
            "total_issues": total_issues,
            "security_issues": len(issues),
            "bug_reports": len(bugs),
            "severity_breakdown": {
                "security": security_by_severity,
                "bugs": bugs_by_severity
            },
            "recommendations": recommendations,
            "next_steps": [
                "Fix critical and high-severity issues first",
                "Implement input validation and sanitization",
                "Add comprehensive error handling",
                "Conduct security code review",
                "Add unit tests for edge cases"
            ]
        }

# Global instance
security_bug_agent = SecurityBugDetectionAgent()
