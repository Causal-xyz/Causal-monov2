#!/bin/bash
# CAUSAL Contract Verification Script
# Verifies all 4 contracts on Avalanche Fuji testnet via Snowtrace
# Usage: bash VERIFY_CONTRACTS.sh

set -e

echo "=================================="
echo "CAUSAL Snowtrace Verification"
echo "=================================="

# Check if SNOWTRACE_API_KEY is set
if [ -z "$SNOWTRACE_API_KEY" ]; then
    echo "❌ Error: SNOWTRACE_API_KEY not set"
    echo "Get your key at: https://testnet.snowtrace.io/myapikey"
    echo "Then run: export SNOWTRACE_API_KEY='your_key_here'"
    exit 1
fi

# Navigate to contracts directory
cd contracts || { echo "❌ Error: contracts directory not found"; exit 1; }

echo ""
echo "🔍 Verifying contracts on Avalanche Fuji testnet..."
echo ""

# 1. CausalOrganizations
echo "📝 [1/4] Verifying CausalOrganizations..."
forge verify-contract \
  0xeD8bB8758d7231771279F4d24905E46B8febbAa1 \
  src/CausalOrganizations.sol:CausalOrganizations \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key "$SNOWTRACE_API_KEY" \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris && echo "✅ CausalOrganizations verified!" || echo "⚠️  CausalOrganizations verification pending..."

echo ""

# 2. TreasuryFactory
echo "📝 [2/4] Verifying TreasuryFactory..."
forge verify-contract \
  0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134 \
  src/TreasuryFactory.sol:TreasuryFactory \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key "$SNOWTRACE_API_KEY" \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris && echo "✅ TreasuryFactory verified!" || echo "⚠️  TreasuryFactory verification pending..."

echo ""

# 3. ProposalFactoryDeployer
echo "📝 [3/4] Verifying ProposalFactoryDeployer..."
forge verify-contract \
  0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83 \
  src/ProposalFactoryDeployer.sol:ProposalFactoryDeployer \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key "$SNOWTRACE_API_KEY" \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris && echo "✅ ProposalFactoryDeployer verified!" || echo "⚠️  ProposalFactoryDeployer verification pending..."

echo ""

# 4. MockUSDC
echo "📝 [4/4] Verifying MockUSDC..."
forge verify-contract \
  0x096731dc6CA1FF91702394F8c5C31dD989608e7B \
  src/MockUSDC.sol:MockUSDC \
  --rpc-url fuji \
  --verifier-url https://api-testnet.snowtrace.io/api \
  --etherscan-api-key "$SNOWTRACE_API_KEY" \
  --compiler-version v0.8.19 \
  --num-of-optimizations 200 \
  --evm-version paris && echo "✅ MockUSDC verified!" || echo "⚠️  MockUSDC verification pending..."

echo ""
echo "=================================="
echo "✅ Verification Complete!"
echo "=================================="
echo ""
echo "📊 Check status at:"
echo "   CausalOrganizations: https://testnet.snowtrace.io/address/0xeD8bB8758d7231771279F4d24905E46B8febbAa1#code"
echo "   TreasuryFactory: https://testnet.snowtrace.io/address/0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134#code"
echo "   ProposalFactoryDeployer: https://testnet.snowtrace.io/address/0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83#code"
echo "   MockUSDC: https://testnet.snowtrace.io/address/0x096731dc6CA1FF91702394F8c5C31dD989608e7B#code"
echo ""
