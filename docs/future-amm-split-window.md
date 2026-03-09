# Future Work: Enforced Split Window

## Completed: AMM Pool Setup Integration

The AMM setup integration has been implemented. Proposal creators can now set up AMM pools:

1. **During creation** — `createProposalWithAmm()` on the factory deploys the proposal + creates AMM pools in a single atomic transaction (3 txs: approve tokenX, approve USDC, create)
2. **After creation** — `setupAmmWithLiquidity()` on the proposal pulls tokenX + USDC from the caller, splits tokenX into yesX/noX, and creates AMMs (owner or factory callable)
3. **Legacy path** — `createAndSetAmms()` still works for manual setup (backward compatible)

The frontend supports both paths:
- Create Proposal page has an AMM toggle (enabled by default) with fee tier, seed amounts, initial prices, and multi-step approval flow
- Proposal detail page shows `SetupAmmPanel` to the owner when no AMMs are set

---

## Remaining: Enforced Split Window

### Problem

There is **no enforced split window**. Pools can be created in the same block as the proposal, giving users zero time to split tokens before trading begins.

### Proposed Solution

Add a `splitWindowDuration` parameter to `FutarchyProposalPoc`:

```solidity
uint256 public immutable splitDeadline;

constructor(..., uint256 splitWindowDuration_) {
    splitDeadline = block.timestamp + splitWindowDuration_;
}

// In _createAmms (or setupAmmWithLiquidity):
require(block.timestamp >= splitDeadline, "Split window active");
```

This guarantees users have a minimum time period to split their tokens before pools can be created and trading begins.

### Frontend Changes

On the proposal detail page, during the split window:
- Show a prominent countdown: "Split window: X:XX remaining"
- Highlight the `SplitMergePanel` component
- Disable the AMM setup button with tooltip: "Available after split window"
- After window ends: "Split window ended — ready for AMM setup"

Use the existing `useCountdown` hook from `apps/web/src/hooks/useCountdown.ts`.

### Complexity

| Task | Complexity |
|------|------------|
| Smart contract split window | Low — add immutable + require check in `_createAmms` |
| Frontend countdown | Low — reuse existing `useCountdown` hook |
| Contract redeployment | Low — standard Foundry deploy + env update |
| Testing | Low — add 1-2 Foundry tests for the window check |
