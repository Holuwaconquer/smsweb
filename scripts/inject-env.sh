#!/bin/bash
# Script to inject environment variables into supabase-config.js before deployment
# Run this during the build process: ./scripts/inject-env.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Injecting environment variables...${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local file not found!${NC}"
    echo "Please create .env.local with your Supabase credentials:"
    echo "  VITE_SUPABASE_URL=your_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_key"
    exit 1
fi

# Source environment variables
export $(cat .env.local | grep -v '#' | xargs)

# Validate required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in .env.local${NC}"
    exit 1
fi

# Create a temporary file with injected variables
CONFIG_FILE="js/supabase-config.js"
TEMP_FILE="${CONFIG_FILE}.tmp"

# Replace placeholders in supabase-config.js
sed "s|VITE_SUPABASE_URL|${VITE_SUPABASE_URL}|g; s|VITE_SUPABASE_ANON_KEY|${VITE_SUPABASE_ANON_KEY}|g" "$CONFIG_FILE" > "$TEMP_FILE"

# Verify the injection worked
if grep -q "${VITE_SUPABASE_URL}" "$TEMP_FILE"; then
    mv "$TEMP_FILE" "$CONFIG_FILE"
    echo -e "${GREEN}✓ Environment variables injected successfully${NC}"
    echo -e "${GREEN}  URL: ${VITE_SUPABASE_URL}${NC}"
    echo -e "${GREEN}  Key: ${VITE_SUPABASE_ANON_KEY:0:20}...${NC}"
else
    rm "$TEMP_FILE"
    echo -e "${RED}Error: Failed to inject environment variables${NC}"
    exit 1
fi
