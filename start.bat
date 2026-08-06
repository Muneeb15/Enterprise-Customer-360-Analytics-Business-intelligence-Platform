@echo off
title Nexus Analytics — Starting...
color 0A

echo.
echo  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
echo  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
echo  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
echo  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
echo  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
echo  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo  Customer Intelligence Platform
echo  ════════════════════════════════════════════
echo.

:: Change to project root
cd /d "%~dp0"

:: ── Check Python ─────────────────────────────────────────────────────────────
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install Python 3.11+ and add to PATH.
    pause
    exit /b 1
)
echo  OK

:: ── Check Node ───────────────────────────────────────────────────────────────
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found. Install Node.js 20+ and add to PATH.
    pause
    exit /b 1
)
echo  OK

:: ── Activate virtualenv if it exists ─────────────────────────────────────────
if exist ".venv\Scripts\activate.bat" (
    echo [3/4] Activating virtual environment...
    call .venv\Scripts\activate.bat
    echo  OK
) else (
    echo [3/4] No .venv found - using system Python
)

:: ── Install Python deps if needed ────────────────────────────────────────────
echo [4/4] Checking Python dependencies...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo  Installing Python dependencies...
    pip install fastapi==0.115.0 "uvicorn[standard]==0.30.6" pydantic==2.9.2 ^
        pydantic-settings==2.4.0 "sqlalchemy[asyncio]==2.0.35" aiosqlite==0.20.0 ^
        alembic==1.13.3 reportlab==4.2.2 "python-jose[cryptography]==3.3.0" ^
        "passlib[bcrypt]==1.7.4" python-multipart==0.0.12 structlog==24.4.0 ^
        httpx==0.27.2 asyncpg==0.29.0 -q
    echo  Done
) else (
    echo  OK
)

:: ── Check npm deps ────────────────────────────────────────────────────────────
if not exist "node_modules\next" (
    echo Installing Node.js dependencies...
    call npm install --silent
)

echo.
echo  ════════════════════════════════════════════
echo  Starting services...
echo  ════════════════════════════════════════════
echo.

:: ── Start Backend in new window ───────────────────────────────────────────────
echo  Starting Backend  ^>  http://localhost:8000
echo  API Docs          ^>  http://localhost:8000/docs
start "Nexus Backend" cmd /k "cd /d %~dp0 && title Nexus Backend (port 8000) && color 0B && python -m uvicorn backend.main:app --reload --port 8000"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: ── Start Frontend in new window ─────────────────────────────────────────────
echo  Starting Frontend ^>  http://localhost:3000
start "Nexus Frontend" cmd /k "cd /d %~dp0 && title Nexus Frontend (port 3000) && color 0E && npm run dev"

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul

echo.
echo  ════════════════════════════════════════════
echo  Nexus Analytics is running!
echo.
echo  Frontend  : http://localhost:3000
echo  Backend   : http://localhost:8000
echo  API Docs  : http://localhost:8000/docs
echo  ════════════════════════════════════════════
echo.
echo  Opening browser...

start "" "http://localhost:3000"

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo  Press any key to close this window.
echo.
pause >nul
