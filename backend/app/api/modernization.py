from pathlib import Path
from typing import Dict, List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.code_explainer import modernize_code, answer_modernization_question
from app.core.scanner import scan_repository

router = APIRouter()

PROJECT_ROOT = Path("storage/extracted").resolve()
MAX_FILE_CHARS = 15_000
MAX_TOTAL_CHARS = 120_000


class ModernizationRequest(BaseModel):
    target_language: str
    source_language: Optional[str] = None
    requirements: str = ""
    explanations: Dict[str, str] = Field(default_factory=dict)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ModernizationChatRequest(BaseModel):
    question: str
    modernized_output: str
    target_language: str = "modernized code"
    include_legacy_context: bool = True
    explanations: Dict[str, str] = Field(default_factory=dict)
    history: List[ChatMessage] = Field(default_factory=list)


def _resolve_safe_path(base_dir: Path, relative_part: str) -> Path:
    resolved = (base_dir / relative_part).resolve()
    if resolved != base_dir and base_dir not in resolved.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    return resolved


def _collect_project_context(
    project_id: str,
    explanations: Dict[str, str] | None = None,
) -> tuple[str, list[str]]:
    project_path = _resolve_safe_path(PROJECT_ROOT, project_id)
    if not project_path.is_dir():
        raise HTTPException(404, "Project not found")

    files = scan_repository(str(project_path))
    if not files:
        raise HTTPException(400, "No valid files found for modernization")

    explanations = explanations or {}
    context_parts: list[str] = []
    detected_languages: list[str] = []
    total_chars = 0

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

        lang = file_info.get("language", "unknown")
        if lang and lang not in detected_languages:
            detected_languages.append(lang)

        block = f"\n=== FILE: {rel_path} ({lang}) ===\n"
        if rel_path in explanations:
            block += f"[Summary]: {explanations[rel_path]}\n"
        block += f"{content}\n"

        if total_chars + len(block) > MAX_TOTAL_CHARS:
            context_parts.append("\n[Remaining files omitted to stay within context limit]\n")
            break

        context_parts.append(block)
        total_chars += len(block)

    if not context_parts:
        raise HTTPException(400, "No readable files found for modernization")

    return "".join(context_parts), detected_languages


@router.post("/{project_id}/modernize")
def modernize_project(project_id: str, payload: ModernizationRequest):
    combined_context, detected_languages = _collect_project_context(
        project_id=project_id,
        explanations=payload.explanations,
    )
    source_lang = (
        payload.source_language
        or (", ".join(detected_languages) if detected_languages else "legacy code")
    )

    modernized_code_report = modernize_code(
        source_code=combined_context,
        source_language=source_lang,
        target_language=payload.target_language,
        requirements=payload.requirements,
    )

    return {
        "project_id": project_id,
        "target_language": payload.target_language,
        "modernized_output": modernized_code_report,
    }


@router.post("/{project_id}/chat")
def chat_on_modernization(project_id: str, payload: ModernizationChatRequest):
    if not payload.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    if not payload.modernized_output.strip():
        raise HTTPException(400, "Modernized output is required before asking modernization questions")

    legacy_context = ""
    if payload.include_legacy_context:
        try:
            legacy_context, _ = _collect_project_context(
                project_id=project_id,
                explanations=payload.explanations,
            )
        except HTTPException:
            legacy_context = ""

    answer = answer_modernization_question(
        question=payload.question.strip(),
        modernized_code=payload.modernized_output,
        target_language=payload.target_language,
        legacy_context=legacy_context,
        history=[m.model_dump() for m in payload.history],
    )
    return {
        "project_id": project_id,
        "target_language": payload.target_language,
        "answer": answer,
    }