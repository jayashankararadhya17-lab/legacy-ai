from fastapi import APIRouter, HTTPException
from pathlib import Path
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from app.core.scanner import scan_repository
from app.core.language_detector import detect_languages
from app.ai.code_explainer import (
    explain_code,
    answer_analysis_question,
    suggest_analysis_questions,
)

router = APIRouter()

PROJECT_ROOT = Path("storage/extracted").resolve()
MAX_FILE_CHARS = 15_000
MAX_TOTAL_CHARS = 100_000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AnalysisChatRequest(BaseModel):
    question: str
    explanations: Dict[str, str] = Field(default_factory=dict)
    architecture_summary: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)


class SuggestedQuestionsRequest(BaseModel):
    explanations: Dict[str, str] = Field(default_factory=dict)
    architecture_summary: Optional[str] = None


def _resolve_safe_path(base_dir: Path, relative_part: str) -> Path:
    resolved = (base_dir / relative_part).resolve()
    if resolved != base_dir and base_dir not in resolved.parents:
        raise HTTPException(status_code=400, detail="Invalid file path")
    return resolved


def _build_analysis_context(
    project_id: str,
    explanations: Dict[str, str] | None = None,
    architecture_summary: str | None = None,
) -> tuple[str, int]:
    project_path = _resolve_safe_path(PROJECT_ROOT, project_id)
    if not project_path.is_dir():
        raise HTTPException(404, "Project not found")

    files = scan_repository(str(project_path))
    if not files:
        raise HTTPException(400, "No valid files found for this project")

    explanations = explanations or {}
    parts: list[str] = []
    total_chars = 0
    included_files = 0

    if architecture_summary:
        arch_block = f"\n=== ARCHITECTURE SUMMARY ===\n{architecture_summary[:15_000]}\n"
        parts.append(arch_block)
        total_chars += len(arch_block)

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
        block = f"\n=== FILE: {rel_path} ({lang}) ===\n"
        if rel_path in explanations:
            block += f"[Analysis / Explanation]:\n{explanations[rel_path]}\n"
        block += f"[Source Code]:\n{content}\n"

        if total_chars + len(block) > MAX_TOTAL_CHARS:
            parts.append("\n[Remaining files omitted to stay within context limit]\n")
            break

        parts.append(block)
        total_chars += len(block)
        included_files += 1

    if included_files == 0:
        raise HTTPException(400, "No readable source files found for analysis")

    return "".join(parts), included_files


@router.post("/{project_id}/scan")
def scan_project(project_id: str):

    project_path = PROJECT_ROOT / project_id

    if not project_path.is_dir():
        raise HTTPException(404, "Project not found")

    files = scan_repository(str(project_path))

    return {
        "project_id": project_id,
        "files": files,
        "statistics": detect_languages(files)
    }


@router.post("/{project_id}/explain")
def explain_project_file(
    project_id: str,
    file_path: str
):

    root = (PROJECT_ROOT / project_id).resolve()

    target = (root / file_path).resolve()

    if not target.is_relative_to(root):
        raise HTTPException(400, "Invalid file path")

    if not target.is_file():
        raise HTTPException(404, "File not found")

    if target.suffix.lower() not in {
        ".java", ".py", ".js", ".ts", ".c", ".cpp", ".cbl", ".cob", ".txt"
    }:
        raise HTTPException(400, "Unsupported source file")

    if target.stat().st_size > 100_000:
        raise HTTPException(413, "File too large for this endpoint")

    code = target.read_text(
        encoding="utf-8",
        errors="replace"
    )

    explanation = explain_code(code, target.name)

    return {
        "file": file_path,
        "explanation": explanation
    }


@router.post("/{project_id}/suggested-questions")
def get_suggested_analysis_questions(
    project_id: str,
    payload: SuggestedQuestionsRequest | None = None,
):
    req = payload or SuggestedQuestionsRequest()
    context, files_used = _build_analysis_context(
        project_id=project_id,
        explanations=req.explanations,
        architecture_summary=req.architecture_summary,
    )
    questions = suggest_analysis_questions(context)
    return {
        "project_id": project_id,
        "files_analyzed": files_used,
        "suggested_questions": questions,
    }


@router.post("/{project_id}/chat")
def chat_on_analysis(project_id: str, payload: AnalysisChatRequest):
    if not payload.question.strip():
        raise HTTPException(400, "Question cannot be empty")

    context, files_used = _build_analysis_context(
        project_id=project_id,
        explanations=payload.explanations,
        architecture_summary=payload.architecture_summary,
    )
    answer = answer_analysis_question(
        question=payload.question.strip(),
        analysis_context=context,
        history=[m.model_dump() for m in payload.history],
    )
    return {
        "project_id": project_id,
        "files_analyzed": files_used,
        "answer": answer,
    }