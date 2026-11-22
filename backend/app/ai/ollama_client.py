import os
from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

load_dotenv()

PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
]

SYSTEM_PROMPT = """
You are an expert legacy software
architecture analyst.

Analyze source code carefully.
Do not invent missing functionality.
Distinguish confirmed facts from
assumptions.
Return structured explanations.
""".strip()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env or your environment.")

client = genai.Client(api_key=_api_key)


def ask_ai(prompt: str) -> str:
    if not prompt or not prompt.strip():
        return ""

    # Deduplicate while keeping PRIMARY_MODEL first
    candidates = [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]
    last_error = None

    for model_name in candidates:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                ),
            )
            return response.text or ""
        except errors.ServerError as exc:
            last_error = exc
            if exc.code == 503:
                continue
            raise

    if last_error is not None:
        raise last_error
    return ""