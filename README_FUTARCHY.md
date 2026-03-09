Futarchy Proposal 
Overview

This repository contains a Proof of Concept implementation of Futarchy governance markets on EVM.
The system allows a DAO to decide whether a proposal should pass or fail based on market prices rather than traditional voting.
Traders speculate on the future value of a token if the proposal passes vs fails.
The proposal outcome is determined by comparing TWAP prices of conditional markets.

Core Idea

Instead of asking:
"Should this proposal pass?"

Futarchy asks:
"Would this proposal increase the value of the project?"

Traders express their belief by trading in conditional markets

Two markets exist:
PASS market
FAIL market

At resolution:
if TWAP(PASS) > TWAP(FAIL)
    proposal passes
else
    proposal fails
Architecture

System consists of two contracts
FutarchyFactoryPoc
Creates new proposals

Responsibilities:
• deploy FutarchyProposalPoc
• track proposals
• assign proposal ids

FutarchyProposalPoc
Core futarchy logic

Responsibilities:
• create conditional tokens
• split assets into YES/NO tokens
• create AMM markets
• resolve proposal via TWAP
• execute proposal action

Conditional Tokens
Each proposal creates 4 tokens

Example if token = TOKENX
yesX
noX
yesUSDC
noUSDC

These tokens represent conditional claims

Example:
yesX = TOKENX if proposal passes
noX = TOKENX if proposal fails

Token Splitting
Users create conditional tokens by splitting assets

Example:
splitX(100 TOKENX)

User receives:
100 yesX
100 noX

Same for USDC

splitUsdc(1000)

User receives:

1000 yesUSDC
1000 noUSDC
AMM Markets

Two markets are created per proposal

yesX / yesUSDC
noX / noUSDC

These are Uniswap V3 pools

Liquidity is seeded by the proposal creator

Markets allow traders to price:

Token value if proposal passes
Token value if proposal fails
Resolution

After the resolution timestamp:

The contract compares TWAP prices

Example:
PASS TWAP = 0.78
FAIL TWAP = 0.65

Since PASS > FAIL:
proposal passes
Execution

If proposal passes:
transferToken → recipient

Example:
Treasury sends 100k USDC to builder

If proposal fails:
No action executed

Settlement
After resolution users redeem winning tokens

Example:
If proposal passed:

yesX → redeemable for TOKENX
yesUSDC → redeemable for USDC
The losing tokens become worthless

Lifecycle
Full proposal lifecycle:

Create proposal
↓
Split tokens
↓
Create AMM markets
↓
Trading phase
↓
TWAP resolution
↓
Execute proposal
↓
Redeem winning tokens
Example

A DAO proposes:
Spend $100k to build an AI feature
Traders price the impact

Market outcome:
PASS market price = $1.20
FAIL market price = $0.95

Since PASS > FAIL → proposal executes

Security Considerations
This is a Proof of Concept and lacks:
• TWAP manipulation protections
• liquidity attack protections
• proposal validation
• governance access control
These must be implemented before production

Deployment Flow
Example flow for deploying a proposal

1 createProposal()

2 users split tokens

3 owner calls createAndSetAmms()

4 traders trade

5 after resolutionTimestamp call resolve()

6 users redeem tokens
Contracts
FutarchyFactoryPoc.sol
FutarchyProposalPoc.sol
ConditionalToken.sol
Dependencies
OpenZeppelin
Uniswap V3

License
MIT

Exemple :
Alice believes proposal increases value.
She buys yesX.
Bob believes proposal destroys value.
He buys noX.
Market prices reflect collective belief.
Protocol executes the outcome with highest price.
