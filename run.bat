@echo off
setlocal enabledelayedexpansion
title OpenMAIC Setup & Run
color 0A

echo.
echo  ============================================================
echo    OpenMAIC - AI Interactive Classroom
echo    Setup ^& Run Script
echo  ============================================================
echo.

:: ─── Check prerequisites ───────────────────────────────────────

echo [1/6] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ERROR: Node.js is not installed.
    echo  Please install Node.js ^>= 20 from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%a in ('node -v') do set NODE_VER=%%a
echo   Node.js: %NODE_VER%

where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo   pnpm not found. Installing pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: Failed to install pnpm.
        pause
        exit /b 1
    )
)

for /f %%a in ('pnpm -v') do set PNPM_VER=%%a
echo   pnpm:    v%PNPM_VER%
echo   OK
echo.

:: ─── Install dependencies ──────────────────────────────────────

echo [2/6] Installing dependencies...

if not exist "node_modules" (
    pnpm install
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: pnpm install failed.
        pause
        exit /b 1
    )
    echo   Dependencies installed.
) else (
    echo   Dependencies already installed. Skipping.
)
echo.

:: ─── Environment configuration ─────────────────────────────────

echo [3/6] Checking environment configuration...

if not exist ".env.local" (
    echo   No .env.local found. Creating from template...
    copy .env.example .env.local >nul
    echo.
    color 0E
    echo  ============================================================
    echo   IMPORTANT: Configure your LLM provider API key
    echo  ============================================================
    echo.
    echo   Edit .env.local and add at least one provider key:
    echo.
    echo     OPENAI_API_KEY=sk-...
    echo     ANTHROPIC_API_KEY=sk-ant-...
    echo     GOOGLE_API_KEY=...
    echo.
    echo   Press any key after you've configured .env.local...
    echo.
    pause >nul
    color 0A
) else (
    echo   .env.local found. OK
)
echo.

:: ─── Detect deployment mode ────────────────────────────────────

echo [4/6] Detecting deployment mode...

set "ORG_MODE=false"

:: Check if DATABASE_URL is set in .env.local
findstr /i "DATABASE_URL=" .env.local | findstr /v "^#" >nul 2>nul
if %errorlevel% equ 0 (
    :: Check it's not empty
    for /f "tokens=2 delims==" %%a in ('findstr /i "DATABASE_URL=" .env.local ^| findstr /v "^#"') do (
        if not "%%a"=="" (
            set "ORG_MODE=true"
        )
    )
)

if "%ORG_MODE%"=="true" (
    echo   Mode: Organization ^(PostgreSQL + Auth^)
    echo.
    echo   Running database migrations...
    pnpm exec prisma generate >nul 2>nul
    pnpm exec prisma db push --accept-data-loss 2>nul
    if %errorlevel% neq 0 (
        color 0E
        echo   WARNING: Database migration failed. Check your DATABASE_URL.
        echo   Continuing anyway — the app will show errors if DB is unreachable.
        color 0A
    ) else (
        echo   Database schema synced.
    )
) else (
    echo   Mode: Personal ^(no database needed^)
)
echo.

:: ─── Choose run mode ───────────────────────────────────────────

echo [5/6] How would you like to run OpenMAIC?
echo.
echo   1. Development mode  (pnpm dev  - hot reload, slower)
echo   2. Production mode   (pnpm build + start - faster)
echo.

set /p RUNMODE="  Enter choice (1 or 2, default=1): "
if "%RUNMODE%"=="" set RUNMODE=1

echo.

:: ─── Run ───────────────────────────────────────────────────────

if "%RUNMODE%"=="2" (
    echo [6/6] Building for production...
    pnpm build
    if %errorlevel% neq 0 (
        color 0C
        echo  ERROR: Build failed.
        pause
        exit /b 1
    )
    echo.
    echo  ============================================================
    echo   OpenMAIC is starting in PRODUCTION mode
    echo   Open http://localhost:3000 in your browser
    echo   Press Ctrl+C to stop
    echo  ============================================================
    echo.
    pnpm start
) else (
    echo [6/6] Starting in development mode...
    echo.
    echo  ============================================================
    echo   OpenMAIC is starting in DEVELOPMENT mode
    echo   Open http://localhost:3000 in your browser
    echo   Press Ctrl+C to stop
    echo  ============================================================
    echo.
    pnpm dev
)

pause
