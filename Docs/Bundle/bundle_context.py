#!/usr/bin/env python3
"""
bundle_context.py

Genera un file di testo unico contenente tutti i documenti di progetto.

Uso:
    python bundle_context.py

Output:
    project_context.txt nella root del progetto
"""

import os
import sys
from datetime import datetime

DOCS_SUBFOLDERS = ["GameDesign", "Roadmap", "Technical", "Skills"]
ROOT_FILES = ["ProjectContext.md"]
OUTPUT_FILE = "project_context.txt"


def find_project_root():
    """Trova la root del progetto cercando la cartella Docs risalendo."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    current = script_dir
    print(f"[debug] Script dir: {current}")

    # Risali fino a 5 livelli cercando una cartella che contenga "Docs"
    for _ in range(5):
        docs_path = os.path.join(current, "Docs")
        if os.path.isdir(docs_path):
            print(f"[debug] Root trovata: {current}")
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent

    print("[errore] Impossibile trovare la root del progetto (cartella Docs non trovata).")
    print(f"[errore] Cercato a partire da: {script_dir}")
    sys.exit(1)


def collect_files(root):
    files = []
    print("[debug] Raccolta file...")

    for fname in ROOT_FILES:
        path = os.path.join(root, fname)
        if os.path.isfile(path):
            files.append(path)
            print(f"  + {fname}")
        else:
            print(f"  - (opzionale) non trovato: {fname}")

    docs_dir = os.path.join(root, "Docs")
    for subfolder in DOCS_SUBFOLDERS:
        folder_path = os.path.join(docs_dir, subfolder)
        if not os.path.isdir(folder_path):
            print(f"  - cartella non trovata: Docs/{subfolder}")
            continue

        md_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".md"))
        for fname in md_files:
            files.append(os.path.join(folder_path, fname))
            print(f"  + Docs/{subfolder}/{fname}")

    return files


def build_bundle(root, files):
    lines = []
    lines.append("=" * 80)
    lines.append("PROJECT CONTEXT BUNDLE")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Project root: {root}")
    lines.append("=" * 80)
    lines.append("")
    lines.append("FILE TREE")
    lines.append("-" * 80)
    for f in files:
        rel = os.path.relpath(f, root).replace(os.sep, "/")
        lines.append(f"  {rel}")
    lines.append("")
    lines.append("=" * 80)
    lines.append("")

    for f in files:
        rel = os.path.relpath(f, root).replace(os.sep, "/")
        lines.append(f"## FILE: {rel}")
        lines.append("")
        try:
            with open(f, "r", encoding="utf-8") as fh:
                lines.append(fh.read())
        except Exception as e:
            lines.append(f"[Errore nella lettura del file: {e}]")
        lines.append("")
        lines.append("=" * 80)
        lines.append("")

    return "\n".join(lines)


def main():
    print("=== bundle_context.py ===")
    root = find_project_root()
    files = collect_files(root)

    if not files:
        print("[errore] Nessun file trovato.")
        sys.exit(1)

    print(f"\n[debug] Totale file: {len(files)}")
    bundle = build_bundle(root, files)
    output_path = os.path.join(root, OUTPUT_FILE)

    try:
        with open(output_path, "w", encoding="utf-8") as fh:
            fh.write(bundle)
    except Exception as e:
        print(f"[errore] Scrittura fallita: {e}")
        sys.exit(1)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\n[OK] Bundle generato: {output_path}")
    print(f"[OK] Dimensione: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()