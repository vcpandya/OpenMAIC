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
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${CYAN}${BOLD}  ============================================================${NC}"
echo -e "${CYAN}${BOLD}    OpenMAIC - AI Interactive Classroom${NC}"
echo -e "${CYAN}${BOLD}    Setup & Run Script${NC}"
echo -e "${CYAN}${BOLD}  ============================================================${NC}"
echo ""

# ─── Check prerequisites ───────────────────────────────────────

echo -e "${BOLD}[1/6] Checking prerequisites...${NC}"

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

echo -e "${BOLD}[2/6] Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    pnpm install
    echo "  Dependencies installed."
else
    echo "  Dependencies already installed. Skipping."
fi
echo ""

# ─── Environment configuration ─────────────────────────────────

echo -e "${BOLD}[3/6] Checking environment configuration...${NC}"

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo ""
    echo -e "${YELLOW}  ============================================================${NC}"
    echo -e "${YELLOW}  IMPORTANT: Configure your LLM provider API key${NC}"
    echo -e "${YELLOW}  ============================================================${NC}"
    echo ""
    echo "  Edit .env.local and add at least one provider key:"
    echo ""
    echo "    OPENAI_API_KEY=sk-..."
    echo "    ANTHROPIC_API_KEY=sk-ant-..."
    echo "    GOOGLE_API_KEY=..."
    echo ""
    read -p "  Press Enter after you've configured .env.local..."
else
    echo "  .env.local found. OK"
fi
echo ""

# ─── Detect deployment mode ────────────────────────────────────

echo -e "${BOLD}[4/6] Detecting deployment mode...${NC}"

ORG_MODE=false
if grep -q "^DATABASE_URL=" .env.local 2>/dev/null; then
    DB_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2-)
    if [ -n "$DB_URL" ] && [ "$DB_URL" != '""' ] && [ "$DB_URL" != "''" ]; then
        ORG_MODE=true
    fi
fi

if [ "$ORG_MODE" = true ]; then
    echo "  Mode: Organization (PostgreSQL + Auth)"
    echo ""
    echo "  Running database migrations..."
    pnpm exec prisma generate > /dev/null 2>&1 || true
    if pnpm exec prisma db push --accept-data-loss 2>/dev/null; then
        echo "  Database schema synced."
    else
        echo -e "${YELLOW}  WARNING: Database migration failed. Check your DATABASE_URL.${NC}"
    fi
else
    echo "  Mode: Personal (no database needed)"
fi
echo ""

# ─── Choose run mode ───────────────────────────────────────────

echo -e "${BOLD}[5/6] How would you like to run OpenMAIC?${NC}"
echo ""
echo "  1. Development mode  (pnpm dev  - hot reload, slower)"
echo "  2. Production mode   (pnpm build + start - faster)"
echo ""
read -p "  Enter choice (1 or 2, default=1): " RUNMODE
RUNMODE=${RUNMODE:-1}
echo ""

# ─── Run ───────────────────────────────────────────────────────

if [ "$RUNMODE" = "2" ]; then
    echo -e "${BOLD}[6/6] Building for production...${NC}"
    pnpm build
    echo ""
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo -e "${GREEN}${BOLD}   OpenMAIC is starting in PRODUCTION mode${NC}"
    echo -e "${GREEN}${BOLD}   Open http://localhost:3000 in your browser${NC}"
    echo -e "${GREEN}${BOLD}   Press Ctrl+C to stop${NC}"
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo ""
    pnpm start
else
    echo -e "${BOLD}[6/6] Starting in development mode...${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo -e "${GREEN}${BOLD}   OpenMAIC is starting in DEVELOPMENT mode${NC}"
    echo -e "${GREEN}${BOLD}   Open http://localhost:3000 in your browser${NC}"
    echo -e "${GREEN}${BOLD}   Press Ctrl+C to stop${NC}"
    echo -e "${GREEN}${BOLD}  ============================================================${NC}"
    echo ""
    pnpm dev
fi
