from pathlib import Path
from typing import Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.code_explainer import explain_code
from app.core.scanner import scan_repository

router = APIRouter()
PROJECT_ROOT = Path("storage/extracted").resolve()
MAX_FILE_CHARS = 15_000
MAX_TOTAL_CHARS = 120_000


class ArchitectureRequest(BaseModel):
    explanations: Dict[str, str] = Field(default_factory=dict)


def _resolve_safe_path(base_dir: Path, relative_part: str) -> Path:
    resolved = (base_dir / relative_part).resolve()
    if resolved != base_dir and base_dir not in resolved.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


@router.post("/{project_id}/analyze")
def analyze_architecture(project_id: str, payload: ArchitectureRequest | None = None):
    request_payload = payload or ArchitectureRequest()
    project_path = _resolve_safe_path(PROJECT_ROOT, project_id)

    if not project_path.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")

    files = scan_repository(str(project_path))
    if not files:
        raise HTTPException(
            status_code=400, detail="No valid files found for architecture analysis"
        )

    context_parts: list[str] = []
    total_chars = 0
    included_files = 0

    for file_info in files:
        rel_path = file_info.get("file_path")
        if not rel_path:
            continue

        file_full_path = _resolve_safe_path(project_path, rel_path)
        if not file_full_path.is_file():
            continue

        content = file_full_path.read_text(encoding="utf-8", errors="replace")
        if len(content) > MAX_FILE_CHARS:
            content = content[:MAX_FILE_CHARS] + "\n... [truncated due to size]"

        language = file_info.get("language", "unknown")
        block = f"\n=== FILE: {rel_path} ({language}) ===\n"
        if rel_path in request_payload.explanations:
            block += f"[AI Summary]:\n{request_payload.explanations[rel_path]}\n"
        block += f"[Code]:\n{content}\n"

        if total_chars + len(block) > MAX_TOTAL_CHARS:
            context_parts.append("\n[Remaining files omitted to stay within context limit]\n")
            break

        context_parts.append(block)
        total_chars += len(block)
        included_files += 1

    if included_files == 0:
        raise HTTPException(
            status_code=400, detail="No readable files found for architecture analysis"
        )

    combined_context = "".join(context_parts)

    prompt = f"""You are a principal enterprise architect. Analyze this codebase and return your response in three clear sections:

1. PLAIN ENGLISH OVERVIEW: Explain what the system does, its core components, and external touchpoints in simple terms.
2. STEP-BY-STEP EXECUTION FLOW: Detail the procedural steps or data flow sequentially from input to output.
3. MERMAID DIAGRAM CODE: Provide a valid Mermaid.js flowchart syntax block (using ```mermaid ... ```) mapping the system components and data flow visually. Wrap any node text containing parentheses, commas, quotes, or special characters in double quotes, e.g. A["Step (Detail)"].

Project Context:
{combined_context}"""

    architecture_report = explain_code(prompt, "system_architecture")

    return {
        "project_id": project_id,
        "files_analyzed": included_files,
        "architecture": architecture_report,
    }