#!/bin/bash
set -e

# ─── Omnicasp Guardrail Agent — Deploy Script ────────────────────────────
# Step 1: Fund your account at https://testnet.casper.network/faucet
#   Public Key: 01b92419fd31587a2575ff5f52563d56bb5122d56c07ffb393dee1d7c121772292
# Step 2: Run this script

NODE="http://65.109.115.124:7777"
WASM="contract/target/wasm32-unknown-unknown/release/guardrail.wasm"
KEY="keys/secret_key.pem"
ACCOUNT_HASH="account-hash-e5c617e1471fa276361a56d532755c0848645c0d74bc1e9164059a5f631d2038"

echo "🚀 Deploying Guardrail Contract to Casper Testnet..."
echo "   Account: $ACCOUNT_HASH"
echo ""

casper-client put-transaction session \
  -n "$NODE" \
  --chain-name casper-test \
  -g 5 \
  -p 500000000000 \
  --pricing-mode classic \
  --standard-payment true \
  -w "$WASM" \
  --session-arg "admin:key='$ACCOUNT_HASH'" \
  -k "$KEY" 2>&1

echo ""
echo "✅ Save the contract hash from the output above (look for 'hash-...')"
echo "   Then set it in: agent/.env and app/config/index.tsx"
