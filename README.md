CAUSAL
CAUSAL is a futarchy-based governance protocol built on the Avalanche C-chain network.It allows organizations to raise capital, manage treasuries, and execute governance decisions using prediction markets.
Instead of traditional voting, CAUSAL uses markets to determine whether a proposal should be executed. Traders buy and sell conditional assets that represent the expected outcome of a proposal. The protocol then executes the outcome that the market predicts will maximize value.

Overview
CAUSAL provides a complete lifecycle for on-chain organizations:
1. Organization creation
2. Capital fundraising
3. Treasury management
4. Proposal creation
5. Prediction market trading
6. Market-based governance execution
All contracts are deployed and verified on the Avalanche Fuji testnet.

Core Mechanism: Futarchy
Futarchy is a governance model where markets decide which actions are expected to produce the best outcomes.
For each proposal, CAUSAL creates two conditional markets:
* PASS market — token price if the proposal is executed
* FAIL market — token price if the proposal is rejected
Participants trade in both markets.At the end of the trading period, the protocol compares the time-weighted average price (TWAP) of both markets.
If:
PASS_TWAP > FAIL_TWAP → the proposal passes.
Otherwise the proposal fails.
The proposal that the market believes will produce the highest value is automatically executed.

System Architecture
The protocol consists of several main components.

Organizations
Organizations can be created by founders to manage capital and governance.
Each organization defines:
* a governance token
* fundraising parameters
* treasury configuration
* governance market parameters
Once created, the organization operates entirely on-chain.

Fundraising
Organizations raise capital through a structured token sale.
Contributors commit USDC during a fundraising window.Early contributors receive a larger allocation through a time-weighted mechanism.
At the end of the sale, the founder sets the final raise amount using a discretionary cap. If the sale was oversubscribed, excess funds are refunded proportionally.
After finalization:
* tokens are distributed to contributors
* the treasury contract is deployed
* accepted USDC is transferred to the treasury

Treasury
Each organization has an on-chain treasury that holds the funds raised during the sale.
The treasury:
* stores USDC raised by the organization
* executes spending proposals
* interacts with governance markets
Treasury actions can only occur through approved governance proposals.

Proposals
Governance proposals define actions the organization may take.
Examples include:
* allocating treasury funds
* executing integrations
* changing protocol parameters
* strategic decisions
Each proposal contains an executable action that will run if the proposal passes.

Prediction Markets
When a proposal is activated, the protocol launches two conditional markets:
PASS marketFAIL market
Users trade conditional tokens representing the value of the organization if the proposal passes or fails.
Market prices reflect collective expectations about the outcome.

Resolution
At the end of the trading phase, the protocol determines the result using a TWAP comparison.
PASS_TWAP > FAIL_TWAP→ proposal passes and execution occurs.
FAIL_TWAP ≥ PASS_TWAP→ proposal fails and no action is taken.
This mechanism ensures that governance decisions align with expected market value.

Proposal Lifecycle
The full lifecycle of a proposal follows these steps:
1. Proposal creation
2. Stake activation
3. Conditional markets launch
4. Market trading phase
5. TWAP resolution
6. Execution or rejection
If the proposal passes, the encoded action is executed automatically.

Repository Structure
contracts/
  src/        Solidity contracts
  test/       Contract tests
  script/     Deployment scripts
  out/        Generated ABIs and artifacts

frontend/
  Next.js application
Smart contracts are written in Solidity and deployed using Foundry.The frontend is built with Next.js.

Key Links
| What | Link |
|------|------|
| **Testnet Explorer** | https://testnet.snowtrace.io |
| **Mainnet Explorer** | https://snowtrace.io |
| **Get Testnet AVAX** | https://faucet.avax.network |
| **Get Snowtrace Key** | https://testnet.snowtrace.io/myapikey |
| **Foundry Docs** | https://book.getfoundry.sh/ |
| **Solidity Docs** | https://docs.soliditylang.org/ |

Testnet Deployment
Network: Avalanche Fuji TestnetChain ID: 43113
Deployed contracts:
CausalOrganizationsTreasuryFactoryProposalFactoryDeployerMockUSDC
All contracts are verified on Snowtrace.

Deployments
| Program | Contract Addresses |
|------|------|
| **CausalOrganizations** |0xeD8bB8758d7231771279F4d24905E46B8febbAa1 |
| **TreasuryFactory** | 0x6447E0E25488Ff7E5BC5f6270cc25Bd46189B134 |
| **ProposalFactoryDeployer** | 0x0D9E90BB5BAA72b70fA6164d859048a9Fc57AB83 |
| **MockUSDC** | 0x096731dc6CA1FF91702394F8c5C31dD989608e7B |
Current Addresses Avalanche Fuji Testnet - Chain ID 43113

Technology Stack
Smart contracts: SolidityFramework: FoundryFrontend: Next.jsNetwork: AvalancheDependencies: OpenZeppelin

Philosophy
CAUSAL replaces traditional governance voting with market signals.
Instead of asking token holders what they prefer, the protocol asks markets what outcome will create the most value.
Participants who correctly predict outcomes are rewarded, while governance decisions follow the signal produced by market prices.

