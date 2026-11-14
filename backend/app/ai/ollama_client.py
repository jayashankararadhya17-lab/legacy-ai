
import ollama

MODEL = "qwen2.5-coder:7b"


def ask_ai(prompt: str):

    response = ollama.chat(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """
                You are an expert legacy software
                architecture analyst.

                Analyze source code carefully.
                Do not invent missing functionality.
                Distinguish confirmed facts from
                assumptions.
                Return structured explanations.
                """
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        options={
            "temperature": 0.1
        }
    )

    return response["message"]["content"]
