import json
from app.ai.ollama_client import ask_ai


def explain_code(source_code, file_name):

    prompt = f"""
    Analyze this legacy source file.

    FILE: {file_name}

    SOURCE CODE:
    {source_code}

    Provide the following:

1. Purpose of this file.
2. Main classes and methods.
3. Input and output.
4. Business logic.
5. Database interactions.
6. External dependencies.
7. Potential modernization opportunities.

    Clearly identify anything that cannot
    be confirmed from this file alone.
    """

    return ask_ai(prompt)


def modernize_code(
    source_code,
    source_language,
    target_language,
    requirements=""
):

    prompt = f"""
    Convert the following legacy source code from {source_language} to {target_language}.
    Requirements: {requirements or "Preserve core behavior and business rules cleanly."}

    STRICT OUTPUT RULES:
    - Write ONLY 1 or 2 short sentences at the top stating what this modernized code does.
    - Immediately after those 1-2 sentences, output ONLY the modernized code inside a single code block.
    - Do NOT include headings, bullet points, explanations, migration notes, assumptions, test cases, or extra commentary.

    ORIGINAL SOURCE CODE:
    {source_code}
    """

    return ask_ai(prompt)


def suggest_analysis_questions(analysis_context: str) -> list[str]:
    prompt = f"""
    Based on the legacy codebase analysis and source context below, generate 4 to 5 concise,
    practical questions a developer or architect should ask to understand unfamiliar parts of this
    legacy system (business rules, inputs/outputs, side effects, dependencies, edge cases).

    Return ONLY a raw JSON array of strings. No markdown fences, no numbering, no extra text.

    CONTEXT:
    {analysis_context[:25000]}
    """
    raw = ask_ai(prompt).strip()
    cleaned = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()][:6]
    except Exception:
        pass

    lines = [line.lstrip("-*0123456789. ").strip() for line in cleaned.splitlines() if line.strip()]
    return [line for line in lines if line][:5]


def answer_analysis_question(question: str, analysis_context: str, history: list[dict] | None = None) -> str:
    formatted_history = ""
    if history:
        turns = history[-6:]
        formatted_history = "\n".join(
            f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in turns
        )

    prompt = f"""
    You are an assistant for the Code Analysis tab. Answer the user's question using ONLY the
    provided legacy codebase analysis and source context.
    - Be clear and direct.
    - State explicitly when something is not present or cannot be confirmed from the provided code.
    - Do not invent files, methods, or business rules.

    CONVERSATION HISTORY:
    {formatted_history or "None"}

    ANALYSIS & CODEBASE CONTEXT:
    {analysis_context}

    USER QUESTION:
    {question}
    """
    return ask_ai(prompt)


def answer_modernization_question(
    question: str,
    modernized_code: str,
    target_language: str,
    legacy_context: str = "",
    history: list[dict] | None = None,
) -> str:
    formatted_history = ""
    if history:
        turns = history[-6:]
        formatted_history = "\n".join(
            f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in turns
        )

    prompt = f"""
    You are an assistant for the Modernization tab. Answer the user's question about the
    modernized code ({target_language}) and how it relates to the original legacy behavior.
    - Keep explanations concise and practical.
    - Include short code snippets only when helpful to answer the question.
    - Clearly flag any assumptions, missing environment details, or unverified edge cases.

    CONVERSATION HISTORY:
    {formatted_history or "None"}

    MODERNIZED OUTPUT ({target_language}):
    {modernized_code}

    REFERENCE LEGACY CONTEXT:
    {legacy_context[:30000] if legacy_context else "Not provided"}

    USER QUESTION:
    {question}
    """
    return ask_ai(prompt)