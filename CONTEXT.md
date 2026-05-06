# Findor Pro - Project Context 🔍

## Overview
Findor Pro is an advanced Graphical User Interface (GUI) for the Linux `find` command. It aims to make file searching more accessible and powerful by providing a user-friendly interface for complex search parameters, integrated AI analysis, and multi-platform support (Desktop & Web).

## Architecture

### 1. Desktop Application
- **Language:** Python 3.10+
- **UI Framework:** PyQt6
- **Core File:** `findor.py`
- **Description:** A standalone desktop application that provides a direct interface to the `find` command.

### 2. Web Application
- **Backend:**
  - **Framework:** FastAPI
  - **Server:** Uvicorn
  - **Location:** `backend/`
  - **Main Logic:** `backend/main.py`
  - **Dependencies:** `fastapi`, `uvicorn`, `requests`, `python-multipart`
- **Frontend:**
  - **Framework:** React 19 (TypeScript)
  - **Build Tool:** Vite
  - **Location:** `frontend/`
  - **Key Technologies:** TailwindCSS (mentioned in README style descriptions, though `package.json` shows standard React), CSS modules.

### 3. AI Integration (v3.0.0+)
- **Providers:** Ollama (local) and OpenRouter (cloud).
- **Features:**
  - Dynamic model selection.
  - Semantic file analysis.
  - Contextual explanations for search results.
  - Relevance indicators.

## Project Structure
```text
/
├── findor.py           # PyQt6 Desktop application
├── backend/            # FastAPI Backend
│   ├── main.py
│   └── requirements.txt
├── frontend/           # React Frontend (Vite/TS)
│   ├── src/
│   └── package.json
├── build/              # Debian package build files (v1.0.0, v2.0.0)
├── findor_*.deb        # Generated Debian packages
├── start.sh            # Launch script for the web version
└── README.md           # Project documentation
```

## Features
- **Visual Find Builder:** GUI for `find` flags (depth, size, mtime, permissions, etc.).
- **Regex Assistant:** Helper for creating search patterns.
- **AI Analysis:** semantic understanding of file contents and names.
- **Theming:** Support for Dark and Light modes.
- **Packaging:** Distributed as Debian (.deb) packages.

## Development Commands
- **Launch Web Version:** `./start.sh`
- **Backend Only:** `cd backend && pip install -r requirements.txt && python3 main.py`
- **Frontend Only:** `cd frontend && npm install && npm run dev`
- **Desktop Version:** `python3 findor.py` (requires PyQt6)
