#!/bin/bash
set -e

# Store PIDs for cleanup
ANVIL_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."

  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [ -n "$ANVIL_PID" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    echo "Stopping anvil (PID: $ANVIL_PID)..."
    kill "$ANVIL_PID" 2>/dev/null || true
  fi

  echo "Cleanup complete"
  exit 0
}

# Set up trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

cd "$(dirname "$0")"

echo "Starting anvil..."
cd packages/test-dapp
anvil &
ANVIL_PID=$!
cd ../..

echo "Waiting for anvil to be ready..."
until curl -sf -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545 > /dev/null 2>&1; do
  echo "Anvil not ready yet, waiting..."
  sleep 1
done
echo "Anvil is ready! (PID: $ANVIL_PID)"

echo "Compiling contracts..."
cd packages/test-dapp
forge build

echo "Deploying contracts..."
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
echo "Contracts deployed!"

echo "Building frontend..."
yarn build

echo "Starting frontend..."
yarn start &
FRONTEND_PID=$!
cd ../..

echo "Waiting for Next.js to be ready..."
until curl --silent --fail http://localhost:3001 > /dev/null; do
  sleep 2
done
echo "Next.js is ready!"

echo ""
echo "================================================"
echo "Development environment is running!"
echo "  - Anvil:    http://127.0.0.1:8545 (PID: $ANVIL_PID)"
echo "  - Frontend: http://localhost:3001 (PID: $FRONTEND_PID)"
echo "================================================"
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for any background process to exit
wait
