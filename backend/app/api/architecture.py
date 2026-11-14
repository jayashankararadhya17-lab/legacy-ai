from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from pathlib import Path
from app.core.scanner import scan_repository
from app.ai.code_explainer import explain_code

router = APIRouter()
PROJECT_ROOT = Path("storage/extracted")

class ArchitectureRequest(BaseModel):
    explanations: Dict[str, str] = {}

@router.post("/{project_id}/analyze")
def analyze_architecture(project_id: str, payload: ArchitectureRequest = ArchitectureRequest()):
    project_path = PROJECT_ROOT / project_id
    if not project_path.is_dir():
        raise HTTPException(404, "Project not found")

    files = scan_repository(str(project_path))
    if not files:
        raise HTTPException(400, "No valid files found for architecture analysis")

    combined_context = ""
    for file_info in files:
        rel_path = file_info["file_path"]
        file_full_path = project_path / rel_path
        
        if file_full_path.is_file():
            content = file_full_path.read_text(encoding="utf-8", errors="replace")
            combined_context += f"\n=== FILE: {rel_path} ({file_info['language']}) ===\n"
            if rel_path in payload.explanations:
                combined_context += f"[AI Summary]:\n{payload.explanations[rel_path]}\n"
            combined_context += f"[Code]:\n{content}\n"

    prompt = f"""
    You are a principal enterprise architect. Analyze this codebase and return your response in three clear sections:
    
    1. PLAIN ENGLISH OVERVIEW: Explain what the system does, its core components, and external touchpoints in simple terms.
    2. STEP-BY-STEP EXECUTION FLOW: Detail the procedural steps or data flow sequentially from input to output.
    3. MERMAID DIAGRAM CODE: Provide a valid Mermaid.js flowchart syntax block (using ```mermaid ... ```) mapping the system components and data flow visually.

    Project Context:
    {combined_context}
    """

    architecture_report = explain_code(prompt, "System Architecture & Flow Mapping")

    return {
        "project_id": project_id,
        "files_analyzed": len(files),
        "architecture": architecture_report
    }