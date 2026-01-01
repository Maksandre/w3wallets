#!/bin/bash

cleanup() {
    echo "Shutting down..."
    kill $ANVIL_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing anvil process
if pgrep -x "anvil" > /dev/null; then
    echo "Killing existing anvil process..."
    pkill -x anvil
    sleep 1
fi

# Compile contracts
echo "Compiling contracts..."
forge build

# Start anvil in background
echo "Starting anvil..."
anvil &
ANVIL_PID=$!

# Wait for anvil to be ready
sleep 2

# Fund test accounts with 100 ETH using anvil's RPC
echo "Funding test accounts..."
curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_setBalance","params":["0xA08B4E6a0AafE4df964a6406E78444C17d368AfB","0x56BC75E2D63100000"],"id":1}'

curl -s -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"anvil_setBalance","params":["0xDe26DF5e0F0D1d0426466013D1fe56aD0B6f80E6","0x56BC75E2D63100000"],"id":1}'
echo ""

# Deploy contracts
echo "Deploying contracts..."
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Build and start Next.js production server
echo "Building Next.js..."
next build

echo "Starting Next.js..."
next start -p 3001
