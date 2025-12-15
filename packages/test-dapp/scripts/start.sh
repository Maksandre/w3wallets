#!/bin/bash

cleanup() {
    echo "Shutting down..."
    kill $ANVIL_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Compile contracts
echo "Compiling contracts..."
forge build

# Start anvil in background
echo "Starting anvil..."
anvil &
ANVIL_PID=$!

# Wait for anvil to be ready
sleep 2

# Deploy contracts
echo "Deploying contracts..."
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Start Next.js dev server (foreground to keep script running)
echo "Starting Next.js..."
next dev -p 3001
