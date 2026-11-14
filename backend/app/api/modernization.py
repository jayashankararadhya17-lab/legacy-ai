from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from pathlib import Path
from app.core.scanner import scan_repository
from app.ai.code_explainer import explain_code

router = APIRouter()  # <-- This attribute is missing in your current modernization.py

PROJECT_ROOT = Path("storage/extracted")

class ModernizationRequest(BaseModel):
    target_language: str
    explanations: Dict[str, str] = {}

@router.post("/{project_id}/modernize")
def modernize_project(project_id: str, payload: ModernizationRequest):
    project_path = PROJECT_ROOT / project_id
    if not project_path.is_dir():
        raise HTTPException(404, "Project not found")

    files = scan_repository(str(project_path))
    if not files:
        raise HTTPException(400, "No valid files found for modernization")

    combined_context = ""
    for file_info in files:
        rel_path = file_info["file_path"]
        file_full_path = project_path / rel_path
        
        if file_full_path.is_file():
            content = file_full_path.read_text(encoding="utf-8", errors="replace")
            combined_context += f"\n=== FILE: {rel_path} ({file_info['language']}) ===\n"
            if rel_path in payload.explanations:
                combined_context += f"[AI Summary]:\n{payload.explanations[rel_path]}\n"
            combined_context += f"[Source Code]:\n{content}\n"

    prompt = f"""
    You are an expert enterprise software modernization engineer. 
    Your task is to convert the following legacy codebase into modern, clean, production-ready {payload.target_language}.
    
    Provide:
    1. Modernization Strategy & Migration Notes
    2. Complete, functional modernized code implementation in {payload.target_language}.

    Project Source Files & Context:
    {combined_context}
    """

    modernized_code_report = explain_code(prompt, f"Modernization to {payload.target_language}")

    return {
        "project_id": project_id,
        "target_language": payload.target_language,
        "modernized_output": modernized_code_report
    }