
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
