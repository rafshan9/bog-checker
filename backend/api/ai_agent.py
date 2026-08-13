import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

def get_client():
    load_dotenv(override=True)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is missing.")
    return genai.Client(api_key=api_key)

def generate_ideas(topic: str):
    try:
        client = get_client()
    except ValueError as e:
        return {"error": str(e)}

    prompt = f"""
    You are an expert SEO strategist. The user wants to write a blog about "{topic}".
    Use your Google Search grounding to find real-time search trends and competitor metrics.
    Generate 5 highly optimized SEO blog ideas.
    
    Output exactly in this JSON format, with no markdown code blocks outside of the JSON array, just a JSON array of objects:
    [
        {{
            "title": "Example Title",
            "keywords": "keyword1, keyword2",
            "search_volume": "1k-10k",
            "difficulty": "Medium"
        }}
    ]
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}

def evaluate_post(content: str, topic: str):
    try:
        client = get_client()
    except ValueError as e:
        return {"error": str(e)}

    prompt = f"""
    You are an expert SEO reviewer. The user has written a draft blog post for the topic "{topic}".
    Use Google Search grounding to see what the top ranking pages for this topic are discussing.
    
    Evaluate the following blog post draft on SEO optimization, readability, keyword usage, and overall quality.
    
    Draft Content:
    {content}
    
    Output a JSON object with this exact structure:
    {{
        "seo_score": 8,
        "feedback": "Your actionable feedback here..."
    }}
    Note: seo_score should be an integer from 1 to 10.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}
