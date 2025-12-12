#!/bin/bash
set -e

echo "Waiting for Anvil to be ready..."

# Wait for anvil to be available
until curl -sf -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://anvil:8545 > /dev/null 2>&1; do
  echo "Anvil not ready yet, waiting..."
  sleep 1
done

echo "Anvil is ready!"

# Deploy contracts
echo "Deploying contracts..."
forge script script/Deploy.s.sol --rpc-url http://anvil:8545 --broadcast

echo "Contracts deployed!"

# Start the frontend
echo "Starting frontend..."
yarn start &
FRONTEND_PID=$!

echo "Waiting for Next.js to be ready..."
until curl --silent --fail http://localhost:3001 > /dev/null; do
  sleep 2
done
echo "Next.js is ready!"

# Keep the container running
wait $FRONTEND_PID
