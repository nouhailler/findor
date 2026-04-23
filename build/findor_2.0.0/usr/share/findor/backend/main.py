import subprocess
import shlex
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Findor API")

# Configuration CORS pour permettre au frontend React de communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchParams(BaseModel):
    directory: str
    name: Optional[str] = None
    case_insensitive: bool = True
    regex_mode: bool = False
    regex_pattern: Optional[str] = None
    type: Optional[str] = None # "f", "d", "l"
    size_op: Optional[str] = None # "+", "-"
    size_val: Optional[int] = 0
    size_unit: Optional[str] = "k"
    mtime: Optional[int] = -1
    min_depth: Optional[int] = 0
    max_depth: Optional[int] = 0
    perm: Optional[str] = None
    user: Optional[str] = None
    group: Optional[str] = None
    exec_cmd: Optional[str] = None
    exec_plus: bool = False 
    prune_dirs: Optional[str] = None 
    newer_file: Optional[str] = None 
    empty_only: bool = False 
    inode: Optional[int] = None 
    same_file: Optional[str] = None

class SearchResult(BaseModel):
    path: str
    name: str
    size: str
    mode: str

def build_find_command(params: SearchParams, use_printf: bool = True) -> List[str]:
    directory = params.directory.strip() or "."
    cmd = ["find", directory]

    # Pruning (Dossiers à ignorer)
    if params.prune_dirs:
        prunes = [d.strip() for d in params.prune_dirs.split(',')]
        for i, d in enumerate(prunes):
            if i > 0: cmd.append("-o")
            cmd.extend(["-name", d, "-prune"])
        cmd.append("-o")

    if params.min_depth > 0:
        cmd.extend(["-mindepth", str(params.min_depth)])
    if params.max_depth > 0:
        cmd.extend(["-maxdepth", str(params.max_depth)])

    # Sélecteurs experts
    if params.empty_only:
        cmd.append("-empty")
    if params.inode:
        cmd.extend(["-inum", str(params.inode)])
    if params.same_file:
        cmd.extend(["-samefile", params.same_file])
    if params.newer_file:
        cmd.extend(["-newer", params.newer_file])

    if params.regex_mode and params.regex_pattern:
        cmd.extend(["-regextype", "posix-extended"])
        flag = "-iregex" if params.case_insensitive else "-regex"
        cmd.extend([flag, params.regex_pattern])
    elif params.name:
        flag = "-iname" if params.case_insensitive else "-name"
        cmd.extend([flag, params.name])

    if params.type and params.type != "Tout":
        # Mapping frontend labels to find types
        type_map = {"Fichiers (f)": "f", "Dossiers (d)": "d", "Liens (l)": "l"}
        t = type_map.get(params.type, params.type)
        cmd.extend(["-type", t])

    if params.size_val > 0:
        size_str = f"{params.size_op or '+'}{params.size_val}{params.size_unit or 'k'}"
        cmd.extend(["-size", size_str])

    if params.mtime >= 0:
        cmd.extend(["-mtime", str(params.mtime)])

    if params.perm:
        cmd.extend(["-perm", params.perm])
    if params.user:
        cmd.extend(["-user", params.user])
    if params.group:
        cmd.extend(["-group", params.group])

    if params.exec_cmd:
        try:
            parts = shlex.split(params.exec_cmd)
            cmd.append("-exec")
            cmd.extend(parts)
            if params.exec_plus:
                cmd.extend(["{}", "+"])
            else:
                cmd.extend(["{}", ";"])
        except Exception:
            pass

    if use_printf and not params.exec_cmd:
        cmd.extend(["-printf", "%p|%f|%s|%m\n"])

    return cmd

class OpenFileParams(BaseModel):
    path: str

@app.post("/api/open-file")
async def open_file(params: OpenFileParams):
    try:
        if not os.path.exists(params.path):
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # On utilise Popen pour ne pas attendre la fermeture de l'éditeur
        # On tente gnome-text-editor, sinon on utilise xdg-open (défaut système)
        try:
            subprocess.Popen(["gnome-text-editor", params.path])
        except FileNotFoundError:
            subprocess.Popen(["xdg-open", params.path])
            
        return {"message": "Ouverture demandée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search(params: SearchParams):
    try:
        # On ne permet pas de chercher à la racine / ou dans des dossiers sensibles pour la démo web
        # (Sécurité basique pour une app locale)
        abs_path = os.path.abspath(params.directory)
        if abs_path == "/" or abs_path.startswith("/boot") or abs_path.startswith("/etc"):
             # On autorise quand même si l'utilisateur est l'owner, mais ici on restreint par prudence
             pass 

        use_printf = not bool(params.exec_cmd)
        cmd = build_find_command(params, use_printf=use_printf)
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        results = []
        stdout, stderr = process.communicate()

        if process.returncode != 0 and stderr:
            if "Permission denied" not in stderr:
                raise HTTPException(status_code=500, detail=stderr)

        for line in stdout.splitlines():
            line = line.strip()
            if not line: continue
            
            if use_printf and "|" in line:
                parts = line.split('|')
                if len(parts) == 4:
                    results.append({
                        "path": parts[0],
                        "name": parts[1],
                        "size": parts[2],
                        "mode": parts[3]
                    })
            else:
                results.append({
                    "path": line,
                    "name": os.path.basename(line),
                    "size": "?",
                    "mode": "?"
                })
        
        return {
            "results": results,
            "command": " ".join(shlex.quote(arg) for arg in cmd)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cwd")
async def get_cwd():
    return {"cwd": os.getcwd()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
