import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
import google.generativeai as genai
import json
import re
import os

logger = logging.getLogger(__name__)

class CodeBundle(BaseModel):
    html_code: str = ""
    css_code: str = ""
    js_code: str = ""

class CodeFixRequest(BaseModel):
    original_code: CodeBundle = Field(..., description="The HTML, CSS, and JS code that has an error.")
    error_message: str = Field(..., description="The error message observed (e.g., from browser console).")
    # language: str = Field(default="html-css-js", description="Language context, e.g., html-css-js, python") 
    # We assume it's always our HTML/CSS/JS bundle for now from DynamicRenderer

class CodeFixResponse(BaseModel):
    fixed_code: CodeBundle | None = None
    status: str # e.g., "success", "failed_to_fix", "error_calling_llm"
    message: str | None = None # Further details, like the error if LLM call failed

router = APIRouter()

def get_gemini_client(request: Request) -> genai.GenerativeModel:
    if not hasattr(request.app.state, 'gemini_client') or request.app.state.gemini_client is None:
        logger.error("Gemini client not found on app.state in code_fixer_agent")
        raise HTTPException(status_code=503, detail="LLM service (Gemini) not available.")
    return request.app.state.gemini_client

@router.post("/fix-code", response_model=CodeFixResponse)
async def fix_code_endpoint(
    payload: CodeFixRequest,
    gemini_client: genai.GenerativeModel = Depends(get_gemini_client)
):
    logger.info(f"CodeFixerAgent: Received request to fix code. Error: {payload.error_message[:100]}...")

    # Construct the prompt for Gemini
    # The LLM is expected to return ONLY the HTML code, no explanations or markdown
    prompt = f"""You are an expert AI code fixing assistant.\nYou will be given a bundle of HTML, CSS, and JavaScript code, along with an error message that occurred when trying to render or run this code.\nYour task is to analyze the code and the error, then provide a fixed version of the HTML, CSS, and JavaScript bundle.\n\nError Message:\n{payload.error_message}\n\nOriginal HTML Code:\n```html\n{payload.original_code.html_code}\n```\n\nOriginal CSS Code:\n```css\n{payload.original_code.css_code}\n```\n\nOriginal JavaScript Code:\n```javascript\n{payload.original_code.js_code}\n```\n\nInstructions for your response:\n1. Carefully analyze the error and the provided code components.\n2. Provide the complete fixed HTML code as a string.\n3. Do NOT include any explanations, markdown, comments, or extra text. Only output the HTML code.\n4. Your response must start with <!DOCTYPE html> and end with </html>.\n"""

    def extract_html_only(llm_response):
        html = re.sub(r'^```html\\s*', '', llm_response.strip(), flags=re.IGNORECASE)
        html = re.sub(r'^```', '', html, flags=re.MULTILINE)
        html = re.sub(r'```$', '', html, flags=re.MULTILINE)
        # Remove everything before <!DOCTYPE html>
        html = re.split(r'<!DOCTYPE html>', html, flags=re.IGNORECASE)[-1]
        html = '<!DOCTYPE html>' + html
        # Remove anything after </html>
        html = re.split(r'</html>', html, flags=re.IGNORECASE)[0] + '</html>'
        # Remove any trailing explanations or comments after </html>
        html = re.split(r'</html>', html, flags=re.IGNORECASE)[0] + '</html>'
        # Remove any leading explanations or comments before <!DOCTYPE html>
        html = re.split(r'<!DOCTYPE html>', html, flags=re.IGNORECASE)[-1]
        html = '<!DOCTYPE html>' + html
        return html.strip()

    try:
        logger.info("Sending code fixing prompt to Gemini.")
        fix_temp = float(os.getenv("CODE_FIXER_TEMPERATURE", "0.1"))
        generation_config = genai.types.GenerationConfig(
            temperature=fix_temp,
        )
        response = await gemini_client.generate_content_async(prompt, generation_config=generation_config)

        if response.text:
            llm_output_text = response.text.strip()
            logger.debug(f"CodeFixerAgent Gemini raw response: {llm_output_text[:300]}...")
            try:
                # Extract only the HTML code
                html_code = extract_html_only(llm_output_text)
                logger.debug(f"Returning ONLY html_code to frontend (first 300 chars): {html_code[:300]}")
                fixed_bundle = CodeBundle(html_code=html_code, css_code="", js_code="")
                return CodeFixResponse(fixed_code=fixed_bundle, status="success", message="Code fixed successfully.")
            except Exception as e:
                logger.error(f"CodeFixerAgent: Error processing LLM response. Error: {e}")
                return CodeFixResponse(status="failed_to_fix", message=f"Error processing LLM response: {str(e)}")
        else:
            logger.error("CodeFixerAgent: Gemini returned no text content.")
            return CodeFixResponse(status="error_calling_llm", message="LLM returned no content.")
    except HTTPException:
        raise # Re-raise HTTPExceptions from get_gemini_client
    except Exception as e:
        logger.error(f"CodeFixerAgent: Unexpected error during LLM call: {e}", exc_info=True)
        return CodeFixResponse(status="error_calling_llm", message=f"An unexpected error occurred: {str(e)}") 