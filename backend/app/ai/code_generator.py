
from app.ai.ollama_client import ask_ai


def modernize_code(
    source_code,
    source_language,
    target_language,
    requirements
):

    prompt = f"""
    You are a software modernization assistant.

    SOURCE LANGUAGE:
    {source_language}

    TARGET LANGUAGE:
    {target_language}

    REQUIREMENTS:
    {requirements}

    ORIGINAL SOURCE CODE:
    {source_code}

    Tasks:

    1. Understand original behavior.
    2. Identify business rules.
    3. Generate equivalent target code.
    4. Preserve input/output behavior.
    5. Identify unsupported dependencies.
    6. Explain any assumptions.
    7. Suggest test cases.

    Return:
    - Modernized code
    - Explanation
    - Dependency changes
    - Potential compatibility issues
    - Validation checklist

    Never claim the output is verified unless
    actual tests have been executed.
    """

    return ask_ai(prompt)
