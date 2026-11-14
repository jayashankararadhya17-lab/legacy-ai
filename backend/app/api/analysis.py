
from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.core.scanner import scan_repository
from app.core.language_detector import detect_languages
from app.ai.code_explainer import explain_code

router = APIRouter()

PROJECT_ROOT = Path("storage/extracted")


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
        ".java", ".py", ".js", ".ts", ".c", ".cpp", ".cbl", ".cob", ".txt"  # <-- Add .cbl and .cob here
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
