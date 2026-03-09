# @causal/contracts — Smart Contracts

Fundraise-to-governance platform smart contracts built with Foundry (Solidity 0.8.24).

## Contracts

| Contract | Description |
|----------|-------------|
| **CausalOrganizations** | Singleton: create orgs, commit USDC, finalize fundraises, claim tokens |
| **OrgDeployer** | Factory: deploys OrgToken + Treasury per org, delegates factory to FutarchyFactoryDeployer |
| **FutarchyFactoryDeployer** | Deploys FutarchyFactoryPoc instances (extracted to stay under EIP-170 size limit) |
| **OrgToken** | ERC20 governance token with controlled minting (minter role) |
| **Treasury** | Per-org treasury holding raised USDC, authorizes futarchy proposals |
| **FutarchyFactoryPoc** | Factory for creating futarchy proposals (per-org, owned by founder) |
| **FutarchyProposalPoc** | Futarchy proposal with conditional tokens, resolved via Uniswap V3 TWAP |
| **ConditionalToken** | ERC20 for conditional outcome tokens (yesX, noX, yesUsdc, noUsdc) |
| **MockTokenX** | Test ERC20 governance token (CTK, 18 decimals, public mint + faucet) |
| **MockUSDC** | Test stablecoin (mUSDC, 6 decimals, public mint + faucet) |

## Deployed Addresses — Avalanche Fuji Testnet (43113)

**Deployment date:** 2026-03-09
**Deployer:** `0x1AeC293573a30ad0A7Ab55F1F64785Cf094A66De`

### Causal Contracts

| Contract | Address |
|----------|---------|
| MockTokenX | [`0xecFa95675aFF2F3776F53853Bb8da5a82015FB51`](https://testnet.snowscan.xyz/address/0xecFa95675aFF2F3776F53853Bb8da5a82015FB51) |
| MockUSDC | [`0xbeA10d851aD86B86a277aC046C24Eb989dfd027c`](https://testnet.snowscan.xyz/address/0xbeA10d851aD86B86a277aC046C24Eb989dfd027c) |
| FutarchyFactoryDeployer | [`0xBA9E14280bcf15eE6bfB7f68CF51299A6081db37`](https://testnet.snowscan.xyz/address/0xBA9E14280bcf15eE6bfB7f68CF51299A6081db37) |
| OrgDeployer | [`0x5FCeE979aAEA164B132DA3C64624eC41F89E01fA`](https://testnet.snowscan.xyz/address/0x5FCeE979aAEA164B132DA3C64624eC41F89E01fA) |
| CausalOrganizations | [`0xFF2f657C62Fa4167EFf334F7d48Ff2aA6C49Bc2B`](https://testnet.snowscan.xyz/address/0xFF2f657C62Fa4167EFf334F7d48Ff2aA6C49Bc2B) |

> OrgToken, Treasury, and FutarchyFactoryPoc are deployed dynamically per-organization during `finalizeRaise()` via OrgDeployer (which delegates factory deployment to FutarchyFactoryDeployer).

### Uniswap V3 (Self-Deployed)

| Contract | Address |
|----------|---------|
| UniswapV3Factory | [`0x6739FCFDC0c6939939C0e8D55188E8D0D973E617`](https://testnet.snowscan.xyz/address/0x6739FCFDC0c6939939C0e8D55188E8D0D973E617) |
| NonfungiblePositionManager | [`0xD7144710B6152526FB33699B166B5917a73f67FE`](https://testnet.snowscan.xyz/address/0xD7144710B6152526FB33699B166B5917a73f67FE) |
| SwapRouter02 | [`0x701067e5f83d71975988BE412Bbd922D806fd29D`](https://testnet.snowscan.xyz/address/0x701067e5f83d71975988BE412Bbd922D806fd29D) |
| QuoterV2 | [`0xF58D6a43C5DF38D29816640A2E9fC26F73CFAA0d`](https://testnet.snowscan.xyz/address/0xF58D6a43C5DF38D29816640A2E9fC26F73CFAA0d) |
| TickLens | [`0x4d606ed92695a10f2dCEA1280569377dd6924F7a`](https://testnet.snowscan.xyz/address/0x4d606ed92695a10f2dCEA1280569377dd6924F7a) |
| UniswapV3Staker | [`0x79Edf619F9A280EAc91436726Fda343EAF394a8C`](https://testnet.snowscan.xyz/address/0x79Edf619F9A280EAc91436726Fda343EAF394a8C) |
| Multicall2 | [`0xC38684ef087ffAb644870AD1c8b288C90C107fe6`](https://testnet.snowscan.xyz/address/0xC38684ef087ffAb644870AD1c8b288C90C107fe6) |
| ProxyAdmin | [`0x4aCBA95b62f4dACe54fC760eD439E67071f5b3f6`](https://testnet.snowscan.xyz/address/0x4aCBA95b62f4dACe54fC760eD439E67071f5b3f6) |
| NFTDescriptor | [`0xd8a53a5E08fe3C51FDbD03fd21B181c802A4214F`](https://testnet.snowscan.xyz/address/0xd8a53a5E08fe3C51FDbD03fd21B181c802A4214F) |
| NonfungibleTokenPositionDescriptor | [`0x99e71AC36429bbD11Db4686B5fE623480e2C2007`](https://testnet.snowscan.xyz/address/0x99e71AC36429bbD11Db4686B5fE623480e2C2007) |
| DescriptorProxy | [`0x06d92Bbe12Aa0431b37b231e7AA0586101707Ca3`](https://testnet.snowscan.xyz/address/0x06d92Bbe12Aa0431b37b231e7AA0586101707Ca3) |
| V3Migrator | [`0x50E3f2B8098Ff5077A689969450EeA97Cc042e05`](https://testnet.snowscan.xyz/address/0x50E3f2B8098Ff5077A689969450EeA97Cc042e05) |

**WAVAX (Fuji):** `0xd00ae08403B9bbb9124bB305C09058E32C39A48c`

## Architecture

```
CausalOrganizations (singleton)
  ├── createOrganization()  → stores org info + fundraise params
  ├── commit()              → investors send USDC (time-weighted accumulator)
  ├── finalizeRaise()       → founder finalizes, calls OrgDeployer:
  │     └── OrgDeployer.deployOrg()
  │           ├── OrgToken       (ERC20 governance token)
  │           ├── Treasury       (holds USDC, authorizes proposals)
  │           └── FutarchyFactoryPoc
  │                 └── createProposal()
  │                       └── FutarchyProposalPoc
  │                             ├── 4x ConditionalToken (yesX, noX, yesUsdc, noUsdc)
  │                             ├── split/merge operations
  │                             ├── Uniswap V3 AMM pools (YES and NO markets)
  │                             └── resolve() via 1-hour TWAP oracle
  ├── forceFinalize()       → anyone can finalize after grace period
  └── claim()               → investors redeem tokens + USDC refund
```

## Commands

```sh
# Build
forge build

# Test (uses test profile with optimizer disabled)
FOUNDRY_PROFILE=test forge test -vvv

# Format
forge fmt

# Deploy to Fuji
source .env
forge create src/OrgDeployer.sol:OrgDeployer \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

forge create src/CausalOrganizations.sol:CausalOrganizations \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast \
  --constructor-args <USDC_ADDRESS> <ORG_DEPLOYER_ADDRESS>

# Wire OrgDeployer → CausalOrganizations
cast send <ORG_DEPLOYER_ADDRESS> "setCampaign(address)" <CAUSAL_ORGANIZATIONS_ADDRESS> \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# Verify on Snowtrace
forge verify-contract <ADDRESS> src/<Contract>.sol:<Contract> \
  --chain-id 43113 \
  --compiler-version 0.8.26 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.routescan.io/v2/network/testnet/evm/43113/etherscan

# Deploy Uniswap V3 (from cloned github.com/Uniswap/deploy-v3)
node dist/index.js \
  -pk <PRIVATE_KEY_WITH_0x> \
  -j https://api.avax-test.network/ext/bc/C/rpc \
  -w9 0xd00ae08403B9bbb9124bB305C09058E32C39A48c \
  -ncl AVAX \
  -o <OWNER_ADDRESS> \
  -c 1
```

## Environment Variables

Copy `.env.example` to `.env`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVATE_KEY` | Yes | — | Deployer private key (with 0x prefix) |
| `RPC_URL` | No | `https://api.avax-test.network/ext/bc/C/rpc` | Avalanche Fuji RPC |
| `SNOWTRACE_API_KEY` | No | — | For contract verification on Snowtrace |
| `ETHERSCAN_API_KEY` | No | — | Alias for Snowtrace verification |

## Dependencies

- OpenZeppelin v5.6.1 (ERC20, Ownable, ReentrancyGuard, SafeERC20)
- Uniswap V3 Core v1.0.0 (pools, oracle)
- Uniswap V3 Periphery v1.3.0 (position manager, liquidity)

## Solidity Version

`^0.8.24` compiled with Solc 0.8.26, `via_ir = true`, optimizer enabled (200 runs).

Test profile disables optimizer to avoid `block.timestamp` caching issues in Foundry tests.
