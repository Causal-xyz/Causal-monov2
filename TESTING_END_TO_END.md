# End-to-End Testing Guide - CAUSAL Platform

## Overview
This guide walks you through the complete user flow for the CAUSAL platform on Avalanche Fuji testnet.

## Prerequisites
- Avalanche Fuji testnet AVAX in wallet
- Fuji USDC from faucet: https://faucet.avax-test.network/
- Founder wallet (primary account)
- 2 additional treasury signer wallets

## Network Details
- **Chain**: Avalanche C-Chain Fuji (43113)
- **RPC**: https://api.avax-test.network/ext/bc/C/rpc
- **Testnet Explorer**: https://testnet.snowtrace.io/

## Test Data
Use these environment variables for deployment and testing:

```bash
# Contract addresses on Fuji
export CAUSAL_ORGS=0x381D01247299fA094cd41AF38E55814FCdf91930
export USDC=0xcb5476cb8b6dF47Bd85B9528B0F049F14a80de2b
export FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# Organization test data (adjust as needed)
export ORG_ID=<org-id-from-creation>
export FOUNDER=<your-address>
export TREASURY_ADDR=<treasury-v2-address>
export PROJECT_TOKEN=<token-address-after-finalization>
```

## Step 1: Create an Organization

1. Visit http://localhost:3000/
2. Navigate to "Create Organization" or use the form
3. Fill in organization details:
   - **Name**: e.g., "Test DAO"
   - **Symbol**: e.g., "TDAO"
   - **Description**: Project description
   - **Total Token Supply**: 12,000,000 (recommended)
   - **Tokens for Sale**: 10,000,000
   - **Funding Goal**: $10,000 USDC
   - **Sale Duration**: 5 minutes (for testing)
   - **Monthly Budget**: $5,000 USDC
   - **Alpha (time weighting)**: 0.5 (50% time-weighted, 50% pro-rata)
   - **Treasury Signers**: Add 3+ addresses
4. Submit and pay the 0.05 ETH launch fee
5. **Save the Organization ID** from the success message

## Step 2: Contribute to Fundraise

1. Navigate to `/organizations/<org-id>`
2. **Approve USDC**: Click "Approve USDC" (one-time)
3. **Commit funds**:
   - Enter USDC amount (e.g., $5,000)
   - Click "Commit"
   - Early commitments get higher time-weighted allocation
4. **Repeat with additional wallets** to test time-weighting
   - Commit different amounts at different times
   - Early supporters should get larger share

## Step 3: Finalize Fundraise

1. Wait for 5-minute sale period to end (or check countdown)
2. Navigate back to `/organizations/<org-id>`
3. As the founder, click "Finalize Raise"
4. Set **Discretionary Cap**:
   - Minimum: Funding goal ($10,000)
   - Maximum: Total committed amount
   - Example: If $30,000 raised, founder can accept $15,000-$30,000
5. Provide **Treasury Address** (TreasuryV2 address)
6. Submit transaction

**What happens automatically:**
- ✅ Token contract deployed (ERC20)
- ✅ Founder receives 2,000,000 reserved tokens
- ✅ 10,000,000 tokens locked for distribution to contributors
- ✅ USDC transferred to treasury
- ✅ Sale marked as successful

## Step 4: Claim Tokens & Check Allocation

1. Navigate back to org page
2. Click "Claim Tokens"
3. Receive:
   - **Tokens**: Calculated using time-weighted formula
     ```
     share = alpha × (time_weight) + (1-alpha) × (pro_rata)
     tokens = share × 10,000,000
     ```
   - **Refund**: Pro-rata refund if oversubscribed
4. Check your token balance in the dashboard

**Expected result:**
- Early contributors should have more tokens than late contributors
- Total tokens distributed = 10,000,000
- Total refunded = (total_committed - accepted_cap)

## Step 5: Proposal Factory (Auto-Deployed)

✅ **The ProposalFactoryV2 is automatically deployed and registered during Step 3 (Finalize Fundraise).**

When you finalize the fundraise and provide a Treasury address, the system will:
1. Deploy the ERC20 token
2. **Auto-deploy ProposalFactoryV2** for governance
3. **Auto-register the factory** in CausalOrganizations
4. Transfer USDC to the treasury

You don't need to do anything manually—the factory is ready for proposals immediately after finalization!

## Step 6: Create a Proposal

1. Navigate to `/organizations/<org-id>/dashboard`
2. Click "+ New Proposal"
3. Fill in proposal details:
   - **Title**: "Fund Marketing Campaign"
   - **Description**: Detailed proposal description
   - **USDC Requested**: $5,000
   - **Recipient**: Address to receive funds
   - **Tokens to Mint** (optional): Additional token creation
   - **Team Sponsored**: Check if founder-backed (-3% threshold)
4. Click "Submit On-Chain"

**What happens:**
- ConditionalProposal contract deployed
- Two ConditionalMarket contracts created (PASS/FAIL)
- Proposal enters **Staking** phase (500K token stake required)

## Step 7: Stake on Proposal

1. Still on `/organizations/<org-id>/dashboard`
2. In the proposal list, click the proposal card
3. Navigate to `/organizations/<org-id>/proposals/<proposal-address>`
4. In the **Staking Phase**:
   - **Stake tokens**: Approve tokens, then stake 500K+ tokens
   - This activates the proposal

## Step 8: Trade Markets

1. After staking reaches 500K tokens, proposal moves to **Trading** phase (5 minutes for testing)
2. On the proposal page, use the trading panel:
   - Select "IF PASS" or "IF FAIL" market tab
   - **Buy**: Click amount buttons ($500, $1k, $2.5k, MAX) and "Buy YES/NO"
   - **Sell**: Sell your position back to liquidity pool
3. Watch the countdown timer for phase transitions

**Market mechanics:**
- Simple AMM with linear price impact
- YES + NO = constant product (roughly)
- Earlier trades get better prices
- Last-minute changes affect TWAP

## Step 9: Proposal Resolution

The proposal automatically transitions through phases:
1. **Staking** (0→500K tokens) - First 5 min
2. **Trading** (active markets) - Next 5 min
3. **Pending** (no trading) - 30 sec cooldown
4. **Recording** (TWAP snapshot) - 1 min window
5. **Resolved** (PASS/FAIL determined) - Automatic
6. **Executed** (treasury spends USDC) - Auto for PASS

Check **Status** in dashboard or proposal page.

## Step 10: Redeem Winning Tokens

1. After resolution, if you held winning tokens (PASS or FAIL):
   - Navigate to `/organizations/<org-id>/proposals/<proposal-address>`
   - Find "Redeem" button
   - Click to redeem 1:1 for USDC

2. **Expected payout**:
   - If PASS won: Your PASS tokens → USDC
   - If FAIL won: Your FAIL tokens → USDC
   - Losing tokens: Worthless (but no loss if you had backing)

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Insufficient allowance" | Haven't approved tokens | Click Approve button first |
| "Active proposal exists" | Can't create while one is active | Click "Clear Finished Proposal" |
| Factory not showing | Factory not deployed yet | Follow Step 5 deployment |
| Tokens not received | Claimed in wrong order | Claim after finalization only |
| Wrong refund amount | Alpha weighting applied | Check formula with explorer |
| Market prices stuck | Block time issue | Reload page or wait 5s |

## Verification Checklist

After completing end-to-end flow, verify:

- [ ] Organization created with correct details
- [ ] Token deployed at finalization (visible in dashboard)
- [ ] Treasury received USDC (check `TreasuryV2.getBalance()`)
- [ ] Founder received reserved tokens (2M)
- [ ] Contributors received time-weighted tokens
- [ ] Refunds calculated correctly (oversubscribed case)
- [ ] Proposal created successfully
- [ ] Markets show reasonable prices (NOT 0, NOT infinite)
- [ ] Proposal resolved correctly (PASS if > 50% YES, FAIL otherwise)
- [ ] Treasury USDC decreased after execution
- [ ] Winners can redeem tokens

## Performance Targets

- Token claim: <10 seconds
- Proposal creation: <15 seconds (2 contract deployments)
- Market trade: <8 seconds (AMM state update)
- Proposal resolution: Automatic at phase transitions

## Notes

- **Testnet phases are fast** (5 min trading vs 3 days production)
- **All funds return to contributors** if funding goal not met
- **Time-weighting rewards early commitment** (configurable via alpha)
- **Discretionary cap provides founder control** while remaining unruggable
- **Markets are permissionless** - anyone can trade once activated
