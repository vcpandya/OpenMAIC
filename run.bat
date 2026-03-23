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

echo [1/7] Checking prerequisites...

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

echo [2/7] Installing dependencies...

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

echo [3/7] Checking environment configuration...

if not exist ".env.local" (
    copy .env.example .env.local >nul
    echo   Created .env.local from template.
) else (
    echo   .env.local found.
)
echo.

:: ─── Choose deployment mode ────────────────────────────────────

echo [4/7] Choose deployment mode:
echo.
echo   1. Personal Mode   (single user, browser storage, no database)
echo   2. Organization Mode (multi-user, PostgreSQL, auth, admin panel)
echo.

set /p DEPLOY_MODE="  Enter choice (1 or 2, default=1): "
if "%DEPLOY_MODE%"=="" set DEPLOY_MODE=1

echo.

if "%DEPLOY_MODE%"=="2" (
    goto :org_setup
) else (
    goto :personal_setup
)

:: ─── Personal Mode Setup ───────────────────────────────────────

:personal_setup
echo   Mode: Personal
echo.

:: Check for LLM API key
echo [5/7] LLM Provider Configuration
echo.
echo   You need at least one LLM provider API key.
echo   Which provider would you like to configure?
echo.
echo   1. OpenAI        (GPT-4o, GPT-4o-mini)
echo   2. Google         (Gemini 3 Flash - recommended)
echo   3. Anthropic      (Claude Sonnet/Opus)
echo   4. DeepSeek       (DeepSeek V3)
echo   5. Grok           (xAI)
echo   6. Skip           (I'll edit .env.local manually)
echo.

set /p LLM_CHOICE="  Enter choice (1-6, default=6): "
if "%LLM_CHOICE%"=="" set LLM_CHOICE=6

if "%LLM_CHOICE%"=="1" (
    set /p API_KEY="  Enter your OpenAI API key: "
    if not "!API_KEY!"=="" (
        powershell -Command "(Get-Content .env.local) -replace '^OPENAI_API_KEY=.*', 'OPENAI_API_KEY=!API_KEY!' | Set-Content .env.local"
        echo   OpenAI API key saved.
    )
) else if "%LLM_CHOICE%"=="2" (
    set /p API_KEY="  Enter your Google API key: "
    if not "!API_KEY!"=="" (
        powershell -Command "(Get-Content .env.local) -replace '^GOOGLE_API_KEY=.*', 'GOOGLE_API_KEY=!API_KEY!' | Set-Content .env.local"
        echo   Google API key saved.
    )
) else if "%LLM_CHOICE%"=="3" (
    set /p API_KEY="  Enter your Anthropic API key: "
    if not "!API_KEY!"=="" (
        powershell -Command "(Get-Content .env.local) -replace '^ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=!API_KEY!' | Set-Content .env.local"
        echo   Anthropic API key saved.
    )
) else if "%LLM_CHOICE%"=="4" (
    set /p API_KEY="  Enter your DeepSeek API key: "
    if not "!API_KEY!"=="" (
        powershell -Command "(Get-Content .env.local) -replace '^DEEPSEEK_API_KEY=.*', 'DEEPSEEK_API_KEY=!API_KEY!' | Set-Content .env.local"
        echo   DeepSeek API key saved.
    )
) else if "%LLM_CHOICE%"=="5" (
    set /p API_KEY="  Enter your Grok API key: "
    if not "!API_KEY!"=="" (
        powershell -Command "(Get-Content .env.local) -replace '^GROK_API_KEY=.*', 'GROK_API_KEY=!API_KEY!' | Set-Content .env.local"
        echo   Grok API key saved.
    )
) else (
    echo   Skipped. Edit .env.local manually before using the app.
)

echo.
echo [6/7] Skipping database setup (Personal mode)
echo.
goto :choose_run_mode

:: ─── Organization Mode Setup ───────────────────────────────────

:org_setup
echo   Mode: Organization
echo.

:: LLM provider (same as personal)
echo [5/7] LLM Provider Configuration
echo.
echo   Which provider would you like to configure?
echo.
echo   1. OpenAI        2. Google (recommended)     3. Anthropic
echo   4. DeepSeek      5. Grok                     6. Skip
echo.

set /p LLM_CHOICE="  Enter choice (1-6, default=6): "
if "%LLM_CHOICE%"=="" set LLM_CHOICE=6

if "%LLM_CHOICE%"=="1" (
    set /p API_KEY="  Enter your OpenAI API key: "
    if not "!API_KEY!"=="" powershell -Command "(Get-Content .env.local) -replace '^OPENAI_API_KEY=.*', 'OPENAI_API_KEY=!API_KEY!' | Set-Content .env.local"
) else if "%LLM_CHOICE%"=="2" (
    set /p API_KEY="  Enter your Google API key: "
    if not "!API_KEY!"=="" powershell -Command "(Get-Content .env.local) -replace '^GOOGLE_API_KEY=.*', 'GOOGLE_API_KEY=!API_KEY!' | Set-Content .env.local"
) else if "%LLM_CHOICE%"=="3" (
    set /p API_KEY="  Enter your Anthropic API key: "
    if not "!API_KEY!"=="" powershell -Command "(Get-Content .env.local) -replace '^ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=!API_KEY!' | Set-Content .env.local"
) else if "%LLM_CHOICE%"=="4" (
    set /p API_KEY="  Enter your DeepSeek API key: "
    if not "!API_KEY!"=="" powershell -Command "(Get-Content .env.local) -replace '^DEEPSEEK_API_KEY=.*', 'DEEPSEEK_API_KEY=!API_KEY!' | Set-Content .env.local"
) else if "%LLM_CHOICE%"=="5" (
    set /p API_KEY="  Enter your Grok API key: "
    if not "!API_KEY!"=="" powershell -Command "(Get-Content .env.local) -replace '^GROK_API_KEY=.*', 'GROK_API_KEY=!API_KEY!' | Set-Content .env.local"
)

echo.
echo [6/7] Database Setup
echo.
echo   Organization mode requires PostgreSQL.
echo.
echo   1. Set up local PostgreSQL  (I have PostgreSQL installed locally)
echo   2. Use Docker PostgreSQL    (auto-start a PostgreSQL container)
echo   3. Bring your own database  (I have an existing PostgreSQL URL)
echo   4. Use a cloud database     (Supabase, Neon, Railway, etc.)
echo.

set /p DB_CHOICE="  Enter choice (1-4): "

if "%DB_CHOICE%"=="1" (
    echo.
    echo   Local PostgreSQL Setup:
    set /p DB_USER="    Username (default=postgres): "
    if "!DB_USER!"=="" set DB_USER=postgres
    set /p DB_PASS="    Password: "
    set /p DB_NAME="    Database name (default=openmaic): "
    if "!DB_NAME!"=="" set DB_NAME=openmaic
    set /p DB_PORT="    Port (default=5432): "
    if "!DB_PORT!"=="" set DB_PORT=5432
    set "DB_URL=postgresql://!DB_USER!:!DB_PASS!@localhost:!DB_PORT!/!DB_NAME!"
    echo.
    echo   Connection: !DB_URL!
) else if "%DB_CHOICE%"=="2" (
    echo.
    echo   Starting PostgreSQL via Docker...
    where docker >nul 2>nul
    if %errorlevel% neq 0 (
        color 0C
        echo   ERROR: Docker is not installed. Install from https://docker.com
        pause
        exit /b 1
    )
    docker run -d --name openmaic-postgres -e POSTGRES_PASSWORD=openmaic -e POSTGRES_DB=openmaic -p 5432:5432 postgres:16-alpine >nul 2>nul
    if %errorlevel% neq 0 (
        echo   Container may already exist. Trying to start it...
        docker start openmaic-postgres >nul 2>nul
    )
    echo   PostgreSQL container running on port 5432.
    set "DB_URL=postgresql://postgres:openmaic@localhost:5432/openmaic"
    :: Wait for PostgreSQL to be ready
    echo   Waiting for database to be ready...
    timeout /t 3 /nobreak >nul
) else if "%DB_CHOICE%"=="3" (
    echo.
    echo   Enter your PostgreSQL connection URL:
    echo   Format: postgresql://user:password@host:port/database
    echo.
    set /p DB_URL="  DATABASE_URL= "
) else if "%DB_CHOICE%"=="4" (
    echo.
    echo   Paste your cloud database connection URL:
    echo.
    echo   Supabase:  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    echo   Neon:      postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require
    echo   Railway:   postgresql://postgres:[password]@[host].railway.app:5432/railway
    echo.
    set /p DB_URL="  DATABASE_URL= "
)

if defined DB_URL (
    :: Write DATABASE_URL to .env.local
    powershell -Command "(Get-Content .env.local) -replace '^# DATABASE_URL=.*', 'DATABASE_URL=\"!DB_URL!\"' | Set-Content .env.local"

    :: Generate AUTH_SECRET
    for /f %%a in ('powershell -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"') do set AUTH_SECRET=%%a
    powershell -Command "(Get-Content .env.local) -replace '^# AUTH_SECRET=.*', 'AUTH_SECRET=\"!AUTH_SECRET!\"' | Set-Content .env.local"

    :: Set DEPLOYMENT_MODE
    powershell -Command "(Get-Content .env.local) -replace '^# DEPLOYMENT_MODE=.*', 'DEPLOYMENT_MODE=organization' | Set-Content .env.local"

    echo.
    echo   Environment configured:
    echo     DATABASE_URL set
    echo     AUTH_SECRET  generated
    echo     DEPLOYMENT_MODE=organization
    echo.

    :: Run Prisma migrations
    echo   Running database migrations...
    pnpm exec prisma generate >nul 2>nul
    pnpm exec prisma db push 2>nul
    if %errorlevel% neq 0 (
        color 0E
        echo   WARNING: Migration failed. Check your database connection.
        color 0A
    ) else (
        echo   Database schema created successfully.
    )
) else (
    color 0C
    echo   ERROR: No database URL provided.
    pause
    exit /b 1
)

echo.

:: ─── Choose run mode ───────────────────────────────────────────

:choose_run_mode
echo [7/7] How would you like to run OpenMAIC?
echo.
echo   1. Development mode  (pnpm dev  - hot reload, slower)
echo   2. Production mode   (pnpm build + start - faster)
echo.

set /p RUNMODE="  Enter choice (1 or 2, default=1): "
if "%RUNMODE%"=="" set RUNMODE=1

echo.

if "%RUNMODE%"=="2" (
    echo  Building for production...
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
    if "%DEPLOY_MODE%"=="2" (
        echo   First user to register becomes Super Admin
        echo   Admin panel: http://localhost:3000/admin
    )
    echo   Press Ctrl+C to stop
    echo  ============================================================
    echo.
    pnpm start
) else (
    echo.
    echo  ============================================================
    echo   OpenMAIC is starting in DEVELOPMENT mode
    echo   Open http://localhost:3000 in your browser
    if "%DEPLOY_MODE%"=="2" (
        echo   First user to register becomes Super Admin
        echo   Admin panel: http://localhost:3000/admin
    )
    echo   Press Ctrl+C to stop
    echo  ============================================================
    echo.
    pnpm dev
)

pause
