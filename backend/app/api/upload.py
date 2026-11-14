from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from uuid import uuid4
from zipfile import ZipFile, BadZipFile
import shutil

router = APIRouter()

UPLOAD_DIR = Path("storage/uploads")
EXTRACT_DIR = Path("storage/extracted")

MAX_UPLOAD = 100 * 1024 * 1024
MAX_EXTRACTED = 500 * 1024 * 1024

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXTRACT_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/")
async def upload_project(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(400, "Invalid file name")

    project_id = str(uuid4())
    filename_lower = file.filename.lower()
    
    archive = UPLOAD_DIR / f"{project_id}_{file.filename}"
    destination = EXTRACT_DIR / project_id
    destination.mkdir(parents=True, exist_ok=True)

    size = 0

    # Save uploaded file chunk by chunk with size limit check
    file_path = destination / file.filename
    with file_path.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)

            if size > MAX_UPLOAD:
                shutil.rmtree(destination, ignore_errors=True)
                raise HTTPException(413, "Upload too large")

            output.write(chunk)

    # If it's a ZIP archive, extract it and remove the loose zip file
    if filename_lower.endswith(".zip"):
        try:
            with ZipFile(file_path) as zip_file:
                total = 0

                for info in zip_file.infolist():
                    if info.is_dir():
                        continue

                    target = (destination / info.filename).resolve()

                    if not target.is_relative_to(destination.resolve()):
                        raise HTTPException(400, "Invalid ZIP path")

                    total += info.file_size

                    if total > MAX_EXTRACTED:
                        raise HTTPException(413, "Extracted project too large")

                zip_file.extractall(destination)
                
            # Remove the original zip archive file after successful extraction
            file_path.unlink(missing_ok=True)

        except (BadZipFile, OSError):
            shutil.rmtree(destination, ignore_errors=True)
            raise HTTPException(400, "Invalid ZIP archive")

        except Exception:
            shutil.rmtree(destination, ignore_errors=True)
            raise

    return {
        "project_id": project_id,
        "message": "File/Project uploaded successfully"
    }