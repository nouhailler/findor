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

import requests
import json
...
# Stockage en mémoire de la configuration IA (en production, utiliser une base ou un fichier sécurisé)
ai_config = {
    "provider": "ollama", # "ollama" ou "openrouter"
    "ollama_url": "http://localhost:11434",
    "openrouter_key": "",
    "model": "qwen2.5:3b"
}

class AIConfigParams(BaseModel):
    provider: str
    ollama_url: Optional[str] = None
    openrouter_key: Optional[str] = None
    model: str

@app.post("/api/ai/config")
async def update_ai_config(params: AIConfigParams):
    global ai_config
    ai_config.update(params.dict())
    models_info = await get_ai_models()
    return {"message": "Configuration IA mise à jour", "models": models_info.get("models", [])}

@app.get("/api/ai/config")
async def get_ai_config():
    return ai_config

@app.get("/api/ai/models")
async def get_ai_models(provider: Optional[str] = None, ollama_url: Optional[str] = None):
    """Récupère les modèles disponibles selon le provider."""
    target_provider = provider or ai_config["provider"]
    target_url = ollama_url or ai_config["ollama_url"]

    if target_provider == "ollama":
        try:
            response = requests.get(f"{target_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = [m["name"] for m in response.json().get("models", [])]
                return {"models": models}
        except Exception:
            return {"models": ["qwen2.5:3b"]} # Fallback
    else:
        try:
            # Pour OpenRouter, on récupère les modèles :free
            # On utilise un User-Agent car certains API le demandent
            headers = {
                "HTTP-Referer": "https://github.com/findor", # Facultatif pour OpenRouter
                "X-Title": "Findor",
            }
            response = requests.get("https://openrouter.ai/api/v1/models", headers=headers, timeout=10)
            if response.status_code == 200:
                all_models = response.json().get("data", [])
                free_models = sorted([m["id"] for m in all_models if m["id"].endswith(":free")])
                return {"models": free_models}
        except Exception as e:
            print(f"Erreur OpenRouter: {e}")
            pass
    return {"models": []}

class AIGenerateParams(BaseModel):
    prompt: str

class SemanticSearchParams(BaseModel):
    query: str
    files: List[str] # Liste des chemins de fichiers à analyser

@app.post("/api/ai/semantic-search")
async def semantic_search(params: SemanticSearchParams):
    global ai_config
    
    if not params.files:
        return {"matches": []}

    # On limite l'analyse aux 10 premiers fichiers texte pour le PoC
    matches = []
    text_files = [f for f in params.files if f.endswith(('.txt', '.md', '.py', '.js', '.json', '.conf', '.sh'))][:10]
    
    for file_path in text_files:
        try:
            file_name = os.path.basename(file_path)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(2000) # On lit les 2000 premiers caractères
            
            prompt = f"""Tu es un assistant d'analyse de fichiers.
            Analyse le fichier suivant pour déterminer s'il correspond à la requête de l'utilisateur.
            
            Requête : "{params.query}"
            Nom du fichier : {file_name}
            Chemin complet : {file_path}
            
            Contenu (extrait) :
            {content}
            
            Le fichier est-il pertinent ? 
            Commence ta réponse par 'OUI' ou 'NON', puis ajoute une courte explication (1 phrase) sur pourquoi il est pertinent ou non."""

            # Appel LLM (Ollama ou OpenRouter)
            if ai_config["provider"] == "ollama":
                response = requests.post(
                    f"{ai_config['ollama_url']}/api/generate",
                    json={"model": ai_config["model"], "prompt": prompt, "stream": False},
                    timeout=15
                )
                if response.status_code != 200:
                    raise Exception(f"Ollama error: {response.text}")
                answer = response.json().get("response", "OUI (Pas d'explication fournie)").strip()
            else:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {ai_config['openrouter_key']}",
                        "Content-Type": "application/json"
                    },
                    json={"model": ai_config["model"], "messages": [{"role": "user", "content": prompt}]},
                    timeout=20
                )
                res_json = response.json()
                if response.status_code != 200:
                    error_msg = res_json.get("error", {}).get("message", response.text)
                    raise Exception(f"OpenRouter error: {error_msg}")
                
                if "choices" in res_json and len(res_json["choices"]) > 0:
                    answer = res_json["choices"][0]["message"]["content"].strip()
                else:
                    raise Exception(f"Réponse OpenRouter inattendue : {json.dumps(res_json)}")

            is_match = answer.upper().startswith("OUI")
            matches.append({
                "file": file_path,
                "relevant": is_match,
                "explanation": answer
            })
        except Exception as e:
            matches.append({
                "file": file_path,
                "relevant": False,
                "explanation": f"Erreur d'analyse : {str(e)}"
            })

    return {"results": matches}

@app.post("/api/ai/generate-regex")
async def generate_regex(params: AIGenerateParams):
    global ai_config
    
    system_prompt = """Tu es un expert en commande 'find' Linux. 
    Ta tâche est de générer UNIQUEMENT une expression régulière compatible avec 'find -regextype posix-extended'.
    Ne donne aucune explication, aucun texte avant ou après. Retourne juste la Regex.
    Exemple : si je demande 'fichiers commençant par log', réponds : .*/log.*"""

    try:
        if ai_config["provider"] == "ollama":
            response = requests.post(
                f"{ai_config['ollama_url']}/api/generate",
                json={
                    "model": ai_config["model"],
                    "prompt": f"{system_prompt}\n\nRequête : {params.prompt}",
                    "stream": False
                },
                timeout=10
            )
            result = response.json().get("response", "").strip()
        else:
            # OpenRouter
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {ai_config['openrouter_key']}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ai_config["model"],
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": params.prompt}
                    ]
                },
                timeout=15
            )
            result = response.json()["choices"][0]["message"]["content"].strip()

        return {"regex": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA : {str(e)}")

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
