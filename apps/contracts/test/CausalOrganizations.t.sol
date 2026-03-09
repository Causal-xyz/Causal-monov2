// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CausalOrganizations} from "src/CausalOrganizations.sol";
import {OrgDeployer} from "src/OrgDeployer.sol";
import {FutarchyFactoryDeployer} from "src/FutarchyFactoryDeployer.sol";
import {OrgToken} from "src/OrgToken.sol";
import {Treasury} from "src/Treasury.sol";
import {FutarchyFactoryPoc, FutarchyProposalPoc, IOracle} from "src/futarchy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDCForTest is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CausalOrganizationsTest is Test {
    CausalOrganizations public causal;
    MockUSDCForTest public usdc;

    address public founder = address(0x1);
    address public investor1 = address(0x2);
    address public investor2 = address(0x3);
    address public investor3 = address(0x4);

    uint256 public constant FUNDING_GOAL = 100_000e6; // 100k USDC
    uint256 public constant TOTAL_SUPPLY = 10_000_000e18; // 10M tokens
    uint256 public constant TOKENS_FOR_SALE = 7_000_000e18; // 70% for sale
    uint256 public constant SALE_DURATION = 7 days;
    uint256 public constant ALPHA_50_50 = 5e17; // 50/50 time vs pro-rata

    function setUp() public {
        usdc = new MockUSDCForTest();
        FutarchyFactoryDeployer factoryDeployer = new FutarchyFactoryDeployer();
        OrgDeployer deployer = new OrgDeployer(address(factoryDeployer));
        causal = new CausalOrganizations(address(usdc), address(deployer));
        deployer.setCampaign(address(causal));

        // Fund investors
        usdc.mint(investor1, 500_000e6);
        usdc.mint(investor2, 500_000e6);
        usdc.mint(investor3, 500_000e6);

        // Approve
        vm.prank(investor1);
        usdc.approve(address(causal), type(uint256).max);
        vm.prank(investor2);
        usdc.approve(address(causal), type(uint256).max);
        vm.prank(investor3);
        usdc.approve(address(causal), type(uint256).max);
    }

    // ─────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────

    function _createOrg() internal returns (uint256 orgId) {
        vm.prank(founder);
        orgId = causal.createOrganization(
            "TestOrg",
            "TORG",
            "A test organization",
            "https://example.com/logo.png",
            TOTAL_SUPPLY,
            TOKENS_FOR_SALE,
            FUNDING_GOAL,
            SALE_DURATION,
            ALPHA_50_50
        );
    }

    // ─────────────────────────────────────────────
    // Organization creation
    // ─────────────────────────────────────────────

    function test_CreateOrganization() public {
        uint256 orgId = _createOrg();

        assertEq(orgId, 0);
        assertEq(causal.orgCount(), 1);

        (string memory name, string memory symbol, string memory desc, string memory img, address f) =
            causal.getOrgInfo(orgId);
        assertEq(name, "TestOrg");
        assertEq(symbol, "TORG");
        assertEq(desc, "A test organization");
        assertEq(img, "https://example.com/logo.png");
        assertEq(f, founder);

        (
            uint256 fundingGoal,
            uint256 usdcRaised,
            uint256 tokensForSale,
            uint256 totalTokenSupply,
            uint256 saleStart,
            uint256 saleEnd,
            uint256 alpha,
            uint256 totalAccumulator,
            uint256 discretionaryCap,
            uint256 capDeadline,
            bool capSet,
            bool active,
            bool finalized,
            bool successful
        ) = causal.orgSales(orgId);

        assertEq(fundingGoal, FUNDING_GOAL);
        assertEq(usdcRaised, 0);
        assertEq(tokensForSale, TOKENS_FOR_SALE);
        assertEq(totalTokenSupply, TOTAL_SUPPLY);
        assertEq(alpha, ALPHA_50_50);
        assertTrue(active);
        assertFalse(finalized);
        assertFalse(successful);
    }

    function test_RevertCreateOrg_EmptyName() public {
        vm.prank(founder);
        vm.expectRevert(CausalOrganizations.NameRequired.selector);
        causal.createOrganization("", "TORG", "desc", "", TOTAL_SUPPLY, TOKENS_FOR_SALE, FUNDING_GOAL, SALE_DURATION, ALPHA_50_50);
    }

    function test_RevertCreateOrg_BadGoal() public {
        vm.prank(founder);
        vm.expectRevert(CausalOrganizations.BadGoal.selector);
        causal.createOrganization("Org", "ORG", "desc", "", TOTAL_SUPPLY, TOKENS_FOR_SALE, 0, SALE_DURATION, ALPHA_50_50);
    }

    // ─────────────────────────────────────────────
    // Commit
    // ─────────────────────────────────────────────

    function test_Commit() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 50_000e6);

        assertEq(causal.contributions(orgId, investor1), 50_000e6);
        assertGt(causal.accumulators(orgId, investor1), 0);
        assertEq(causal.orgContributorCount(orgId), 1);
    }

    function test_MultipleCommits() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 40_000e6);

        vm.warp(block.timestamp + 2 days);

        vm.prank(investor2);
        causal.commit(orgId, 40_000e6);

        vm.warp(block.timestamp + 2 days);

        vm.prank(investor3);
        causal.commit(orgId, 40_000e6);

        (, uint256 usdcRaised,,,,,,,,,,,,) = causal.orgSales(orgId);
        assertEq(usdcRaised, 120_000e6);
        assertEq(causal.orgContributorCount(orgId), 3);

        // Earlier investor should have higher accumulator
        uint256 acc1 = causal.accumulators(orgId, investor1);
        uint256 acc2 = causal.accumulators(orgId, investor2);
        uint256 acc3 = causal.accumulators(orgId, investor3);
        assertGt(acc1, acc2, "Early investor should have higher accumulator");
        assertGt(acc2, acc3, "Middle investor should have higher accumulator than late");
    }

    function test_RevertCommit_SaleEnded() public {
        uint256 orgId = _createOrg();
        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(investor1);
        vm.expectRevert(CausalOrganizations.SaleEnded.selector);
        causal.commit(orgId, 50_000e6);
    }

    function test_RevertCommit_ZeroAmount() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        vm.expectRevert(CausalOrganizations.ZeroAmount.selector);
        causal.commit(orgId, 0);
    }

    // ─────────────────────────────────────────────
    // Finalize
    // ─────────────────────────────────────────────

    function test_FinalizeRaise() public {
        uint256 orgId = _createOrg();

        // Invest enough to meet goal
        vm.prank(investor1);
        causal.commit(orgId, 60_000e6);
        vm.prank(investor2);
        causal.commit(orgId, 60_000e6);

        // Move past sale end
        vm.warp(block.timestamp + SALE_DURATION + 1);

        // Founder finalizes with cap at funding goal
        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        (,,,,,,,,,, bool capSet, bool active, bool finalized, bool successful) = causal.orgSales(orgId);
        assertTrue(capSet);
        assertFalse(active);
        assertTrue(finalized);
        assertTrue(successful);

        // OrgToken deployed
        address tokenAddr = causal.orgTokens(orgId);
        assertTrue(tokenAddr != address(0), "OrgToken should be deployed");
        OrgToken token = OrgToken(tokenAddr);
        assertEq(token.name(), "TestOrg");
        assertEq(token.symbol(), "TORG");

        // Treasury deployed and funded
        address treasuryAddr = causal.orgTreasuries(orgId);
        assertTrue(treasuryAddr != address(0), "Treasury should be deployed");
        assertEq(usdc.balanceOf(treasuryAddr), FUNDING_GOAL);

        // Factory deployed
        address factoryAddr = causal.orgFactories(orgId);
        assertTrue(factoryAddr != address(0), "Factory should be deployed");

        // Token minter transferred to treasury
        assertEq(token.minter(), treasuryAddr);
    }

    function test_RevertFinalize_NotFounder() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);
        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(investor1); // Not founder
        vm.expectRevert(CausalOrganizations.NotFounder.selector);
        causal.finalizeRaise(orgId, FUNDING_GOAL);
    }

    function test_RevertFinalize_BelowGoal() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);
        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(founder);
        vm.expectRevert(CausalOrganizations.BelowMinRaise.selector);
        causal.finalizeRaise(orgId, FUNDING_GOAL - 1);
    }

    function test_RevertFinalize_SaleNotEnded() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        vm.prank(founder);
        vm.expectRevert(CausalOrganizations.SaleNotEnded.selector);
        causal.finalizeRaise(orgId, FUNDING_GOAL);
    }

    // ─────────────────────────────────────────────
    // Force finalize
    // ─────────────────────────────────────────────

    function test_ForceFinalize_Successful() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        // Wait past cap deadline (saleEnd + 3 days)
        vm.warp(block.timestamp + SALE_DURATION + 3 days + 1);

        // Anyone can force finalize
        vm.prank(investor2);
        causal.forceFinalize(orgId);

        (,,,,,,,,,,,, bool finalized, bool successful) = causal.orgSales(orgId);
        assertTrue(finalized);
        assertTrue(successful);

        assertTrue(causal.orgTokens(orgId) != address(0));
        assertTrue(causal.orgTreasuries(orgId) != address(0));
    }

    function test_ForceFinalize_Failed() public {
        uint256 orgId = _createOrg();

        // Only invest 50k (below 100k goal)
        vm.prank(investor1);
        causal.commit(orgId, 50_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 3 days + 1);

        vm.prank(investor2);
        causal.forceFinalize(orgId);

        (,,,,,,,,,,,, bool finalized, bool successful) = causal.orgSales(orgId);
        assertTrue(finalized);
        assertFalse(successful);

        // No token or treasury deployed for failed sale
        assertEq(causal.orgTokens(orgId), address(0));
        assertEq(causal.orgTreasuries(orgId), address(0));
    }

    // ─────────────────────────────────────────────
    // Claim
    // ─────────────────────────────────────────────

    function test_Claim_SuccessfulSale() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 60_000e6);
        vm.prank(investor2);
        causal.commit(orgId, 60_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        // Investor 1 claims
        uint256 usdcBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        causal.claim(orgId);

        // Should have received tokens
        address tokenAddr = causal.orgTokens(orgId);
        uint256 tokenBalance = IERC20(tokenAddr).balanceOf(investor1);
        assertGt(tokenBalance, 0, "Investor should have received tokens");

        // Should have received USDC refund (committed 60k but cap is 100k)
        uint256 usdcAfter = usdc.balanceOf(investor1);
        assertGt(usdcAfter, usdcBefore, "Investor should have received USDC refund");

        assertTrue(causal.hasClaimed(orgId, investor1));
    }

    function test_Claim_FailedSale_FullRefund() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 50_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 3 days + 1);
        causal.forceFinalize(orgId);

        uint256 usdcBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        causal.claim(orgId);

        uint256 usdcAfter = usdc.balanceOf(investor1);
        assertEq(usdcAfter - usdcBefore, 50_000e6, "Should get full refund");
    }

    function test_RevertClaim_AlreadyClaimed() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 1);
        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        vm.prank(investor1);
        causal.claim(orgId);

        vm.prank(investor1);
        vm.expectRevert(CausalOrganizations.AlreadyClaimed.selector);
        causal.claim(orgId);
    }

    // ─────────────────────────────────────────────
    // Time-weighted allocation
    // ─────────────────────────────────────────────

    function test_TimeWeightedAllocation() public {
        uint256 orgId = _createOrg();

        // Investor1 commits early (at t=0), investor2 commits late (at t=6 days)
        vm.prank(investor1);
        causal.commit(orgId, 50_000e6);

        vm.warp(block.timestamp + 6 days);

        vm.prank(investor2);
        causal.commit(orgId, 50_000e6);

        // Both committed equal amounts, but investor1 should get more tokens
        // because of the time-weighting (alpha = 50%)
        uint256 share1 = causal.getFinalShare(orgId, investor1);
        uint256 share2 = causal.getFinalShare(orgId, investor2);

        assertGt(share1, share2, "Early investor should have higher share with alpha > 0");
    }

    function test_PureProRata_AlphaZero() public {
        // Create org with alpha = 0 (pure pro-rata)
        vm.prank(founder);
        uint256 orgId = causal.createOrganization(
            "ProRataOrg", "PRO", "Pure pro-rata", "",
            TOTAL_SUPPLY, TOKENS_FOR_SALE, FUNDING_GOAL, SALE_DURATION, 0
        );

        vm.prank(investor1);
        causal.commit(orgId, 50_000e6);

        vm.warp(block.timestamp + 6 days);

        vm.prank(investor2);
        causal.commit(orgId, 50_000e6);

        // With alpha=0, both should get equal share
        uint256 share1 = causal.getFinalShare(orgId, investor1);
        uint256 share2 = causal.getFinalShare(orgId, investor2);

        assertEq(share1, share2, "With alpha=0, shares should be equal for equal amounts");
    }

    // ─────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────

    function test_GetUserAllocation() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 1);
        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        (uint256 tokens, uint256 refund, uint256 shareBps) = causal.getUserAllocation(orgId, investor1);

        assertEq(tokens, TOKENS_FOR_SALE, "Sole investor should get all sale tokens");
        assertEq(refund, 120_000e6 - FUNDING_GOAL, "Refund should be excess over cap");
        assertEq(shareBps, 10000, "Sole investor should have 100% share");
    }

    function test_GetCurrentMultiplier() public {
        uint256 orgId = _createOrg();

        (uint256 num, uint256 den) = causal.getCurrentMultiplier(orgId);
        assertEq(num, SALE_DURATION); // Full time remaining
        assertEq(den, SALE_DURATION);

        vm.warp(block.timestamp + SALE_DURATION / 2);
        (num, den) = causal.getCurrentMultiplier(orgId);
        assertEq(num, SALE_DURATION / 2); // Half time remaining
        assertEq(den, SALE_DURATION);
    }

    function test_GetTokenPrice() public {
        uint256 orgId = _createOrg();
        uint256 price = causal.getTokenPrice(orgId);
        // price = fundingGoal * 1e18 / tokensForSale = 100_000e6 * 1e18 / 7_000_000e18
        assertGt(price, 0);
    }

    // ─────────────────────────────────────────────
    // Full lifecycle: Fundraise → Futarchy proposal
    // ─────────────────────────────────────────────

    function test_FullLifecycle_FundraiseToProposal() public {
        // Phase 1: Fundraise
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        // Investor claims tokens
        vm.prank(investor1);
        causal.claim(orgId);

        address tokenAddr = causal.orgTokens(orgId);
        address treasuryAddr = causal.orgTreasuries(orgId);
        address factoryAddr = causal.orgFactories(orgId);

        // Verify token balance
        uint256 investorTokens = IERC20(tokenAddr).balanceOf(investor1);
        assertEq(investorTokens, TOKENS_FOR_SALE, "Sole investor gets all sale tokens");

        // Verify treasury balance
        assertEq(usdc.balanceOf(treasuryAddr), FUNDING_GOAL, "Treasury has raised USDC");

        // Phase 2: Create a futarchy proposal via the factory
        FutarchyFactoryPoc factory = FutarchyFactoryPoc(factoryAddr);

        vm.prank(founder);
        address proposalAddr = factory.createProposal(
            "Hire Auditor",
            tokenAddr,
            address(usdc),
            block.timestamp + 2 days,
            address(usdc), // transferToken (unused in treasury mode)
            address(0x999), // recipient
            0, // transferAmount (unused in treasury mode)
            50_000e6, // usdcRequested from treasury
            0, // tokensToMint
            3600 // twapWindow (1 hour)
        );

        // Verify the proposal was authorized in the treasury
        Treasury treasury = Treasury(treasuryAddr);
        assertTrue(treasury.authorizedProposals(proposalAddr), "Proposal should be authorized");

        // Verify proposal state
        FutarchyProposalPoc proposal = FutarchyProposalPoc(proposalAddr);
        assertEq(proposal.title(), "Hire Auditor");
        assertEq(address(proposal.tokenX()), tokenAddr);
        assertEq(proposal.usdcRequested(), 50_000e6);
        assertEq(address(proposal.treasury()), treasuryAddr);
    }

    // ─────────────────────────────────────────────
    // Founder allocation
    // ─────────────────────────────────────────────

    function test_FounderGetsRemainingTokens() public {
        uint256 orgId = _createOrg();

        vm.prank(investor1);
        causal.commit(orgId, 120_000e6);

        vm.warp(block.timestamp + SALE_DURATION + 1);

        vm.prank(founder);
        causal.finalizeRaise(orgId, FUNDING_GOAL);

        address tokenAddr = causal.orgTokens(orgId);
        uint256 founderBalance = IERC20(tokenAddr).balanceOf(founder);
        uint256 expectedFounder = TOTAL_SUPPLY - TOKENS_FOR_SALE;
        assertEq(founderBalance, expectedFounder, "Founder should get remaining tokens");
    }
}
