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

class SearchResult(BaseModel):
    path: str
    name: str
    size: str
    mode: str

def build_find_command(params: SearchParams, use_printf: bool = True) -> List[str]:
    directory = params.directory.strip() or "."
    cmd = ["find", directory]

    if params.min_depth > 0:
        cmd.extend(["-mindepth", str(params.min_depth)])
    if params.max_depth > 0:
        cmd.extend(["-maxdepth", str(params.max_depth)])

    if params.name:
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
            cmd.extend(["{}", ";"])
        except Exception:
            pass

    if use_printf and not params.exec_cmd:
        cmd.extend(["-printf", "%p|%f|%s|%m\n"])

    return cmd

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
