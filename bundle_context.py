"""
bundle_context.py
Generates a single text file containing the project structure and all relevant source files.
Run this script before starting a new chat session.
Output: project_context.txt
"""

import os

# ---- CONFIGURATION ----
# Folders and files to include
INCLUDE_EXTENSIONS = {".html", ".css", ".js", ".md"}
INCLUDE_FOLDERS = {"docs", "js", "css", ""}  # "" means root files like index.html

# Folders and files to exclude
EXCLUDE_DIRS = {".git", "node_modules", "assets", "__pycache__"}
EXCLUDE_FILES = {"bundle_context.py", "project_context.txt", "converti_docs.bat"}

# ---- COLLECT FILES ----
def collect_files(root_dir):
    """Walk the project and collect matching files."""
    result = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Remove excluded directories from traversal
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            if f in EXCLUDE_FILES:
                continue
            ext = os.path.splitext(f)[1].lower()
            if ext in INCLUDE_EXTENSIONS:
                full_path = os.path.join(dirpath, f)
                rel_path = os.path.relpath(full_path, root_dir)
                result.append(rel_path)
    return sorted(result)

# ---- GENERATE OUTPUT ----
def generate_bundle(root_dir):
    files = collect_files(root_dir)

    lines = []
    lines.append("# PROJECT CONTEXT BUNDLE")
    lines.append(f"# Generated from: {os.path.abspath(root_dir)}")
    lines.append("")

    # File tree
    lines.append("## FILE TREE")
    lines.append("```")
    for f in files:
        lines.append(f"  {f}")
    lines.append("```")
    lines.append("")

    # Contents of each file
    for f in files:
        full_path = os.path.join(root_dir, f)
        try:
            with open(full_path, "r", encoding="utf-8") as fh:
                content = fh.read()
        except Exception as e:
            content = f"[ERROR reading file: {e}]"

        lines.append(f"## FILE: {f}")
        lines.append("```")
        lines.append(content)
        lines.append("```")
        lines.append("")

    return "\n".join(lines)

# ---- MAIN ----
if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))  # script's directory = project root
    output = generate_bundle(root)

    output_path = os.path.join(root, "project_context.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"Bundle created: {output_path}")
    print(f"Files included: {len(collect_files(root))}")