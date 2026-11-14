
# # from pathlib import Path

# # SUPPORTED_EXTENSIONS = {
# #     ".cbl": "COBOL",  # <-- Add this
# #     ".cob": "COBOL",
# #     ".txt": "Text",
# #     ".java": "Java",
# #     ".py": "Python",
# #     ".js": "JavaScript",
# #     ".ts": "TypeScript",
# #     ".c": "C",
# #     ".cpp": "C++",
# #     ".sql": "SQL",
# #     ".php": "PHP",
# #     ".cs": "C#",
# #     ".xml": "XML",
# #     ".json": "JSON",
# #     ".yaml": "YAML",
# #     ".yml": "YAML"
# # }

# # IGNORE_DIRS = {
# #     ".git", "node_modules", "venv",
# #     "__pycache__", "target", "dist"
# # }


# # def scan_repository(root_path: str):
# #     root = Path(root_path)

# #     files = []

# #     for path in root.rglob("*"):

# #         if not path.is_file():
# #             continue

# #         if any(part in IGNORE_DIRS for part in path.parts):
# #             continue

# #         if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
# #             continue

# #         try:
# #             relative_path = str(path.relative_to(root))

# #             files.append({
# #                 "file_name": path.name,
# #                 "file_path": relative_path,
# #                 "language": SUPPORTED_EXTENSIONS[
# #                     path.suffix.lower()
# #                 ],
# #                 "size": path.stat().st_size
# #             })

# #         except OSError:
# #             continue

# #     return files


# from pathlib import Path

# SUPPORTED_EXTENSIONS = {
#     ".cbl": "COBOL",
#     ".cob": "COBOL",
#     ".txt": "Text",
#     ".java": "Java",
#     ".py": "Python",
#     ".js": "JavaScript",
#     ".ts": "TypeScript",
#     ".c": "C",
#     ".cpp": "C++",
#     ".sql": "SQL",
#     ".php": "PHP",
#     ".cs": "C#",
#     ".xml": "XML",
#     ".json": "JSON",
#     ".yaml": "YAML",
#     ".yml": "YAML"
# }

# IGNORE_DIRS = {
#     ".git", "node_modules", "venv",
#     "__pycache__", "target", "dist"
# }


# def scan_repository(root_path: str):
#     root = Path(root_path)
#     files = []

#     # Check both recursive and direct children in case it's a loose file upload
#     paths_to_scan = list(root.rglob("*"))

#     for path in paths_to_scan:
#         if not path.is_file():
#             continue

#         if any(part in IGNORE_DIRS for part in path.parts):
#             continue

#         if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
#             continue

#         try:
#             relative_path = str(path.relative_to(root))

#             files.append({
#                 "file_name": path.name,
#                 "file_path": relative_path,
#                 "language": SUPPORTED_EXTENSIONS[path.suffix.lower()],
#                 "size": path.stat().st_size
#             })

#         except OSError:
#             continue

#     return files


from pathlib import Path

SUPPORTED_EXTENSIONS = {
    ".cbl": "COBOL",
    ".cob": "COBOL",
    ".txt": "Text",
    ".java": "Java",
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".c": "C",
    ".cpp": "C++",
    ".sql": "SQL",
    ".php": "PHP",
    ".cs": "C#",
    ".xml": "XML",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML"
}

IGNORE_DIRS = {
    ".git", "node_modules", "venv",
    "__pycache__", "target", "dist"
}


def scan_repository(root_path: str):
    root = Path(root_path)
    files = []

    paths_to_scan = list(root.rglob("*"))

    for path in paths_to_scan:
        if not path.is_file():
            continue

        if any(part in IGNORE_DIRS for part in path.parts):
            continue

        filename_lower = path.name.lower()

        # Detect COBOL even if saved with a trailing .txt extension
        if ".cbl" in filename_lower or ".cob" in filename_lower:
            language = "COBOL"
        elif path.suffix.lower() in SUPPORTED_EXTENSIONS:
            language = SUPPORTED_EXTENSIONS[path.suffix.lower()]
        else:
            continue

        try:
            relative_path = str(path.relative_to(root))

            files.append({
                "file_name": path.name,
                "file_path": relative_path,
                "language": language,
                "size": path.stat().st_size
            })

        except OSError:
            continue

    return files