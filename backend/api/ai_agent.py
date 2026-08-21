import os
import json
import requests
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from groq import Groq
# pyrefly: ignore [missing-import]
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception


def is_retriable_error(exception):
    error_str = str(exception)
    return "503" in error_str or "429" in error_str or "500" in error_str


def get_client():
    """Initialize the Groq client with API key from environment."""
    load_dotenv(override=True)
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing.")
    return Groq(api_key=api_key)


def get_google_suggestions(topic: str) -> list[str]:
    """
    Fetch real keyword suggestions from Google Autocomplete API.
    This is a free, public endpoint that returns what people actually search for.
    """
    suggestions = []
    
    # Query variations to get diverse keyword suggestions
    queries = [
        topic,
        f"how to {topic}",
        f"best {topic}",
        f"{topic} tips",
        f"{topic} guide",
    ]
    
    for query in queries:
        try:
            response = requests.get(
                "https://suggestqueries.google.com/complete/search",
                params={
                    "client": "firefox",
                    "q": query,
                    "hl": "en",
                },
                timeout=5,
            )
            if response.status_code == 200:
                data = response.json()
                if len(data) > 1 and isinstance(data[1], list):
                    suggestions.extend(data[1])
        except Exception:
            continue
    
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for s in suggestions:
        lower = s.lower()
        if lower not in seen:
            seen.add(lower)
            unique.append(s)
    
    return unique[:20]  # Return top 20 unique suggestions


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception(is_retriable_error)
)
def chat_with_retry(client, messages, model="openai/gpt-oss-120b"):
    """Send a chat completion request to Groq with retry logic."""
    return client.chat.completions.create(
        model=model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.7,
    )


def generate_ideas(topic: str):
    """
    Generate SEO blog ideas using real Google keyword data + Groq LLM.
    
    Flow:
    1. Fetch real keyword suggestions from Google Autocomplete
    2. Pass them to the LLM to generate structured blog ideas
    3. Return 5 ideas with titles, keywords, estimated volume & difficulty
    """
    try:
        client = get_client()
    except ValueError as e:
        return {"error": str(e)}

    # Step 1: Get real keyword suggestions from Google
    real_keywords = get_google_suggestions(topic)
    keywords_str = ", ".join(real_keywords) if real_keywords else "none found"

    # Step 2: Generate ideas using LLM with real keyword context
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert SEO strategist. You must respond with valid JSON only. "
                "Your response must be a JSON object with a single key \"ideas\" containing an array of 5 objects."
            ),
        },
        {
            "role": "user",
            "content": f"""The user wants to write a blog about "{topic}".

Here are REAL keyword suggestions that people are actually searching on Google right now:
{keywords_str}

Based on these real search queries, generate 5 highly optimized SEO blog ideas.
For each idea, estimate the search volume range and keyword difficulty based on your knowledge.

Respond with this exact JSON structure:
{{
    "ideas": [
        {{
            "title": "SEO-optimized blog title (include primary keyword naturally)",
            "keywords": "primary keyword, secondary keyword, long-tail keyword",
            "search_volume": "estimated range like 1k-10k, 10k-100k, or 100-1k",
            "difficulty": "Low, Medium, or High"
        }}
    ]
}}

Guidelines for better ranking potential:
- Titles should include the primary keyword near the beginning
- Target a mix of high-volume competitive keywords and low-competition long-tail keywords
- Include question-based titles (these rank well in featured snippets)
- Keywords should be comma-separated and include related LSI keywords
- Estimate difficulty based on how competitive the niche typically is""",
        },
    ]

    try:
        response = chat_with_retry(client, messages)
        result = json.loads(response.choices[0].message.content)
        # Return just the ideas array to maintain the same API contract
        return result.get("ideas", result)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"error": "We've hit the free rate limit for the AI model. Please wait a minute and try again."}
        if "503" in error_msg or "500" in error_msg:
            return {"error": "The AI model is currently experiencing high demand. Please try again in a few moments."}
        return {"error": error_msg}


def evaluate_post(content: str, topic: str):
    """
    Evaluate a blog post for SEO quality with a comprehensive checklist.
    
    Returns:
    - seo_score (1-10)
    - feedback (detailed text feedback)
    - checklist (array of pass/fail items for granular display)
    """
    try:
        client = get_client()
    except ValueError as e:
        return {"error": str(e)}

    # Get current real keywords for this topic to compare against
    real_keywords = get_google_suggestions(topic)
    keywords_str = ", ".join(real_keywords[:10]) if real_keywords else "none available"

    word_count = len(content.split())

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert SEO auditor who helps blog posts rank on Google. "
                "You must respond with valid JSON only. Be strict but fair in your scoring. "
                "A score of 8+ means the post is ready to publish and has strong ranking potential."
            ),
        },
        {
            "role": "user",
            "content": f"""Evaluate this blog post draft for the topic "{topic}".

The post has {word_count} words.

Here are REAL keywords people search for this topic on Google:
{keywords_str}

--- BLOG POST CONTENT ---
{content}
--- END CONTENT ---

Analyze this post against a comprehensive SEO checklist and provide your evaluation.

Respond with this exact JSON structure:
{{
    "seo_score": 7,
    "feedback": "A detailed 2-3 paragraph summary of what's working, what needs improvement, and specific actionable steps to improve ranking potential.",
    "checklist": [
        {{
            "item": "Primary Keyword in Title/H1",
            "passed": true,
            "suggestion": "Good - primary keyword appears in the title"
        }},
        {{
            "item": "Keyword in First 100 Words",
            "passed": false,
            "suggestion": "Add your primary keyword within the first 100 words of the introduction"
        }},
        {{
            "item": "Content Length (1500+ words)",
            "passed": false,
            "suggestion": "Current word count is {word_count}. Aim for at least 1,500 words for competitive topics"
        }},
        {{
            "item": "Heading Structure (H2/H3 hierarchy)",
            "passed": true,
            "suggestion": "Good use of subheadings"
        }},
        {{
            "item": "Meta Description Quality",
            "passed": false,
            "suggestion": "Add a compelling meta description under 160 characters that includes your primary keyword"
        }},
        {{
            "item": "Internal/External Linking",
            "passed": false,
            "suggestion": "Add 2-3 internal links and 1-2 authoritative external links"
        }},
        {{
            "item": "Keyword Density (1-2%)",
            "passed": true,
            "suggestion": "Keyword usage is within the optimal range"
        }},
        {{
            "item": "Readability & Paragraph Length",
            "passed": true,
            "suggestion": "Paragraphs are digestible and easy to scan"
        }},
        {{
            "item": "Unique Value / E-E-A-T Signals",
            "passed": false,
            "suggestion": "Add personal experience, data, or unique insights to demonstrate expertise"
        }},
        {{
            "item": "Call-to-Action / Engagement",
            "passed": false,
            "suggestion": "Add a clear CTA or question at the end to boost engagement signals"
        }}
    ]
}}

Important:
- The checklist MUST have exactly 10 items covering the categories above
- Each item must have "item" (string), "passed" (boolean), and "suggestion" (string)
- The seo_score should reflect how many checklist items pass (roughly: 10 passed = 10, 5 passed = 5)
- The feedback should be actionable and specific to THIS content, not generic advice
- Reference the real keywords when suggesting improvements""",
        },
    ]

    try:
        response = chat_with_retry(client, messages)
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"error": "We've hit the free rate limit for the AI model. Please wait a minute and try again."}
        if "503" in error_msg or "500" in error_msg:
            return {"error": "The AI model is currently experiencing high demand. Please try again in a few moments."}
        return {"error": error_msg}
