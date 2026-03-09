# Testing the Minimal Campaign System

## What Was Deployed

**MinimalCampaignFactory**: `0x91050CAb311690F4e19efA3c12F64d5cb693Df51`

This is an ULTRA minimal version with:
- **NO OpenZeppelin dependencies** - pure Solidity only
- **~2.3KB deployed bytecode** - tiny contract
- **Manual ERC20 transfers** - using low-level `call()` instead of SafeERC20
- **Solidity 0.8.17** - pre-PUSH0
- **Paris EVM** target

## Why This Should Work

If this STILL fails with "invalid opcode 0xb0", then the issue is NOT:
- OpenZeppelin libraries (not using any)
- Contract complexity (simplest possible)
- Bytecode size (only 2.3KB)
- PUSH0 opcode (using 0.8.17)

The issue would be something fundamental with:
- The Avalanche RPC endpoint
- Your wallet/transaction setup
- The frontend transaction construction

## Testing Steps

### Option 1: Test via Frontend
1. Open the frontend
2. Try to create a campaign
3. Check if you get the same "invalid opcode 0xb0" error

### Option 2: Test via Cast (Command Line)
```bash
cd CAUSAL/contracts

# Try to create a campaign directly via cast
cast send 0x91050CAb311690F4e19efA3c12F64d5cb693Df51 \
  "createCampaign(string,uint256,uint256)" \
  "Test Campaign" 1000000000 30 \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key YOUR_PRIVATE_KEY \
  --legacy
```

### Option 3: Check Existing Deployments
The factory deployed successfully at block height, so at least THAT transaction worked.

Try calling a read function:
```bash
cast call 0x91050CAb311690F4e19efA3c12F64d5cb693Df51 \
  "getCampaignCount()" \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```

This should return `0x0000...` (0 campaigns).

## What to Report Back

Please tell me:
1. **Which test method** you used (frontend, cast, or something else)
2. **The exact error message** including transaction hash if available
3. **Where the error appears** (MetaMask popup, console, transaction explorer)
4. **Any transaction hash** so I can look it up on Snowtrace

## If It STILL Fails

If even this ultra-minimal contract fails, we need to check:

1. **Your wallet setup** - is it configured for Avalanche Fuji?
2. **Gas settings** - try manually setting higher gas
3. **RPC endpoint** - try a different Avalanche Fuji RPC:
   - `https://api.avax-test.network/ext/bc/C/rpc` (official)
   - `https://ava-testnet.public.blastapi.io/ext/bc/C/rpc` (alternative)
   - `https://avalanche-fuji-c-chain.publicnode.com` (alternative)

4. **Transaction parameters** - something in how the transaction is being constructed

## Contract Code

The MinimalCampaign is literally just:
- Constructor that sets immutable variables
- `contribute()` with manual ERC20 transfer
- `claimRefund()` with manual ERC20 transfer
- `getInfo()` view function

NO libraries, NO inheritance (except implicit), NO complexity.

If this doesn't work, the problem is environmental, not with the contracts.
