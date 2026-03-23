#!/usr/bin/env bash
set -e

# ============================================================
#  OpenMAIC - AI Interactive Classroom
#  Setup & Run Script
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}  ============================================================${NC}"
echo -e "${CYAN}${BOLD}    OpenMAIC - AI Interactive Classroom${NC}"
echo -e "${CYAN}${BOLD}    Setup & Run Script${NC}"
echo -e "${CYAN}${BOLD}  ============================================================${NC}"
echo ""

# ─── Check prerequisites ───────────────────────────────────────

echo -e "${BOLD}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}  ERROR: Node.js is not installed.${NC}"
    echo "  Please install Node.js >= 20 from https://nodejs.org"
    exit 1
fi
echo "  Node.js: $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "  pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "  pnpm:    v$(pnpm -v)"
echo -e "${GREEN}  OK${NC}"
echo ""

# ─── Install dependencies ──────────────────────────────────────

echo -e "${BOLD}[2/7] Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    pnpm install
    echo "  Dependencies installed."
else
    echo "  Dependencies already installed. Skipping."
fi
echo ""

# ─── Environment configuration ─────────────────────────────────

echo -e "${BOLD}[3/7] Checking environment configuration...${NC}"

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "  Created .env.local from template."
else
    echo "  .env.local found."
fi
echo ""

# ─── Choose deployment mode ────────────────────────────────────

echo -e "${BOLD}[4/7] Choose deployment mode:${NC}"
echo ""
echo "  1. Personal Mode   (single user, browser storage, no database)"
echo "  2. Organization Mode (multi-user, PostgreSQL, auth, admin panel)"
echo ""
read -p "  Enter choice (1 or 2, default=1): " DEPLOY_MODE
DEPLOY_MODE=${DEPLOY_MODE:-1}
echo ""

# ─── LLM Provider Configuration ────────────────────────────────

echo -e "${BOLD}[5/7] LLM Provider Configuration${NC}"
echo ""
echo "  Which provider would you like to configure?"
echo ""
echo "  1. OpenAI        (GPT-4o, GPT-4o-mini)"
echo "  2. Google         (Gemini 3 Flash - recommended)"
echo "  3. Anthropic      (Claude Sonnet/Opus)"
echo "  4. DeepSeek       (DeepSeek V3)"
echo "  5. Grok           (xAI)"
echo "  6. Skip           (I'll edit .env.local manually)"
echo ""
read -p "  Enter choice (1-6, default=6): " LLM_CHOICE
LLM_CHOICE=${LLM_CHOICE:-6}

set_env_key() {
    local key="$1" value="$2"
    if grep -q "^${key}=" .env.local 2>/dev/null; then
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local && rm -f .env.local.bak
    elif grep -q "^# ${key}=" .env.local 2>/dev/null; then
        sed -i.bak "s|^# ${key}=.*|${key}=${value}|" .env.local && rm -f .env.local.bak
    else
        echo "${key}=${value}" >> .env.local
    fi
}

case $LLM_CHOICE in
    1) read -p "  Enter your OpenAI API key: " API_KEY
       [ -n "$API_KEY" ] && set_env_key "OPENAI_API_KEY" "$API_KEY" && echo "  Saved." ;;
    2) read -p "  Enter your Google API key: " API_KEY
       [ -n "$API_KEY" ] && set_env_key "GOOGLE_API_KEY" "$API_KEY" && echo "  Saved." ;;
    3) read -p "  Enter your Anthropic API key: " API_KEY
       [ -n "$API_KEY" ] && set_env_key "ANTHROPIC_API_KEY" "$API_KEY" && echo "  Saved." ;;
    4) read -p "  Enter your DeepSeek API key: " API_KEY
       [ -n "$API_KEY" ] && set_env_key "DEEPSEEK_API_KEY" "$API_KEY" && echo "  Saved." ;;
    5) read -p "  Enter your Grok API key: " API_KEY
       [ -n "$API_KEY" ] && set_env_key "GROK_API_KEY" "$API_KEY" && echo "  Saved." ;;
    *) echo "  Skipped. Edit .env.local manually." ;;
esac

echo ""

# ─── Database Setup ─────────────────────────────────────────────

echo -e "${BOLD}[6/7] Database Setup${NC}"
echo ""

if [ "$DEPLOY_MODE" = "1" ]; then
    echo "  Skipping database setup (Personal mode)"
else
    echo "  Organization mode requires PostgreSQL."
    echo ""
    echo "  1. Set up local PostgreSQL  (I have PostgreSQL installed locally)"
    echo "  2. Use Docker PostgreSQL    (auto-start a PostgreSQL container)"
    echo "  3. Bring your own database  (I have an existing PostgreSQL URL)"
    echo "  4. Use a cloud database     (Supabase, Neon, Railway, etc.)"
    echo ""
    read -p "  Enter choice (1-4): " DB_CHOICE

    case $DB_CHOICE in
        1)
            echo ""
            read -p "    Username (default=postgres): " DB_USER
            DB_USER=${DB_USER:-postgres}
            read -sp "    Password: " DB_PASS
            echo ""
            read -p "    Database name (default=openmaic): " DB_NAME
            DB_NAME=${DB_NAME:-openmaic}
            read -p "    Port (default=5432): " DB_PORT
            DB_PORT=${DB_PORT:-5432}
            DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"
            echo ""
            echo "  Connection: postgresql://${DB_USER}:***@localhost:${DB_PORT}/${DB_NAME}"
            ;;
        2)
            echo ""
            if ! command -v docker &> /dev/null; then
                echo -e "${RED}  ERROR: Docker is not installed. Install from https://docker.com${NC}"
                exit 1
            fi
            echo "  Starting PostgreSQL via Docker..."
            docker run -d --name openmaic-postgres \
                -e POSTGRES_PASSWORD=openmaic \
                -e POSTGRES_DB=openmaic \
                -p 5432:5432 \
                postgres:16-alpine 2>/dev/null || docker start openmaic-postgres 2>/dev/null
            echo "  PostgreSQL container running on port 5432."
            DB_URL="postgresql://postgres:openmaic@localhost:5432/openmaic"
            echo "  Waiting for database to be ready..."
            sleep 3
            ;;
        3)
            echo ""
            echo "  Enter your PostgreSQL connection URL:"
            echo "  Format: postgresql://user:password@host:port/database"
            echo ""
            read -p "  DATABASE_URL= " DB_URL
            ;;
        4)
            echo ""
            echo "  Paste your cloud database connection URL:"
            echo ""
            echo "  Supabase:  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
            echo "  Neon:      postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require"
            echo "  Railway:   postgresql://postgres:[password]@[host].railway.app:5432/railway"
            echo ""
            read -p "  DATABASE_URL= " DB_URL
            ;;
        *)
            echo -e "${RED}  Invalid choice.${NC}"
            exit 1
            ;;
    esac

    if [ -z "$DB_URL" ]; then
        echo -e "${RED}  ERROR: No database URL provided.${NC}"
        exit 1
    fi

    # Generate AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

    # Write to .env.local
    set_env_key "DATABASE_URL" "\"${DB_URL}\""
    set_env_key "AUTH_SECRET" "\"${AUTH_SECRET}\""
    set_env_key "DEPLOYMENT_MODE" "organization"

    echo ""
    echo "  Environment configured:"
    echo "    DATABASE_URL    set"
    echo "    AUTH_SECRET     generated"
    echo "    DEPLOYMENT_MODE organization"
    echo ""

    # Run Prisma migrations
    echo "  Running database migrations..."
    pnpm exec prisma generate > /dev/null 2>&1 || true
    if pnpm exec prisma db push 2>/dev/null; then
        echo -e "${GREEN}  Database schema created successfully.${NC}"
    else
        echo -e "${YELLOW}  WARNING: Migration failed. Check your database connection.${NC}"
    fi
fi

echo ""

# ─── Choose run mode ───────────────────────────────────────────

echo -e "${BOLD}[7/7] How would you like to run OpenMAIC?${NC}"
echo ""
echo "  1. Development mode  (pnpm dev  - hot reload, slower)"
echo "  2. Production mode   (pnpm build + start - faster)"
echo ""
read -p "  Enter choice (1 or 2, default=1): " RUNMODE
RUNMODE=${RUNMODE:-1}
echo ""

if [ "$RUNMODE" = "2" ]; then
    echo -e "${BOLD}Building for production...${NC}"
    pnpm build
    echo ""
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo -e "${GREEN}${BOLD}   OpenMAIC is starting in PRODUCTION mode${NC}"
    echo -e "${GREEN}${BOLD}   Open http://localhost:3000 in your browser${NC}"
    if [ "$DEPLOY_MODE" = "2" ]; then
        echo -e "${GREEN}${BOLD}   First user to register becomes Super Admin${NC}"
        echo -e "${GREEN}${BOLD}   Admin panel: http://localhost:3000/admin${NC}"
    fi
    echo -e "${GREEN}${BOLD}   Press Ctrl+C to stop${NC}"
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo ""
    pnpm start
else
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo -e "${GREEN}${BOLD}   OpenMAIC is starting in DEVELOPMENT mode${NC}"
    echo -e "${GREEN}${BOLD}   Open http://localhost:3000 in your browser${NC}"
    if [ "$DEPLOY_MODE" = "2" ]; then
        echo -e "${GREEN}${BOLD}   First user to register becomes Super Admin${NC}"
        echo -e "${GREEN}${BOLD}   Admin panel: http://localhost:3000/admin${NC}"
    fi
    echo -e "${GREEN}${BOLD}   Press Ctrl+C to stop${NC}"
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo ""
    pnpm dev
fi
