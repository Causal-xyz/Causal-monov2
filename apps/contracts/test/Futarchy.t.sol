// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {FutarchyFactoryPoc, FutarchyProposalPoc, IOracle, IUniswapV3Factory, INonfungiblePositionManager} from "src/futarchy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing purposes
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock Oracle that implements the IOracle interface
contract MockOracle is IOracle {
    int56 internal tickCumulativeStart;
    int56 internal tickCumulativeEnd;

    function setObserveResponse(int56 start, int56 end) external {
        tickCumulativeStart = start;
        tickCumulativeEnd = end;
    }

    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory observationInfo)
    {
        // This is a simplified mock. It ignores secondsAgos and returns pre-set values.
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = tickCumulativeStart;
        tickCumulatives[1] = tickCumulativeEnd;
        return (tickCumulatives, new uint160[](0));
    }
}

// Mock Uniswap V3 Factory
contract MockUniswapV3Factory is IUniswapV3Factory {
    address public override owner;
    mapping(uint24 => int24) public override feeAmountTickSpacing;
    mapping(address => mapping(address => mapping(uint24 => address))) public override getPool;

    constructor(address _owner) {
        owner = _owner;
    }

    function setOwner(address _owner) external override {
        owner = _owner;
    }

    function enableFeeAmount(uint24 fee, int24 tickSpacing_) external override {
        feeAmountTickSpacing[fee] = tickSpacing_;
    }

    function createPool(address tokenA, address tokenB, uint24 fee) external override returns (address pool) {
        pool = getPool[tokenA][tokenB][fee];
    }
}

// Mock Position Manager that implements INonfungiblePositionManager
contract MockPositionManager is INonfungiblePositionManager {
    mapping(address => uint256) public balances;
    uint256 public nextTokenId = 1;

    address[] public poolsToReturn;
    uint256 public poolIndex;

    function addPool(address pool) external {
        poolsToReturn.push(pool);
    }

    function createAndInitializePoolIfNecessary(
        address,
        address,
        uint24,
        uint160
    ) external payable override returns (address pool) {
        pool = poolsToReturn[poolIndex++];
    }

    function mint(MintParams calldata params)
        external
        payable
        override
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        if (params.token0 != address(0)) {
            IERC20(params.token0).transferFrom(msg.sender, address(this), params.amount0Desired);
            balances[params.token0] += params.amount0Desired;
        }
        if (params.token1 != address(0)) {
            IERC20(params.token1).transferFrom(msg.sender, address(this), params.amount1Desired);
            balances[params.token1] += params.amount1Desired;
        }

        tokenId = nextTokenId++;
        amount0 = params.amount0Desired;
        amount1 = params.amount1Desired;
        liquidity = 123;
    }
}

contract FutarchyTest is Test {
    FutarchyFactoryPoc public factory;
    FutarchyProposalPoc public proposal;
    MockERC20 public tokenX;
    MockERC20 public usdc;
    MockUniswapV3Factory public mockFactoryV3;
    MockPositionManager public mockPositionManager;

    MockOracle public mockYesPool;
    MockOracle public mockNoPool;

    address public owner = address(0x1);
    address public paymentTarget = address(0x2);
    uint256 public constant TRANSFER_AMOUNT = 500 ether;
    uint24 public constant FEE = 3000; // 0.3% fee
    int24 public constant TICK_SPACING = 60;

    function setUp() public {
        vm.startPrank(owner);
        tokenX = new MockERC20("Token X", "TX");
        usdc = new MockERC20("USD Coin", "USDC");
        factory = new FutarchyFactoryPoc(owner, address(0));

        mockFactoryV3 = new MockUniswapV3Factory(owner);
        mockFactoryV3.enableFeeAmount(FEE, TICK_SPACING);

        mockYesPool = new MockOracle();
        mockNoPool = new MockOracle();

        mockPositionManager = new MockPositionManager();
        mockPositionManager.addPool(address(mockYesPool));
        mockPositionManager.addPool(address(mockNoPool));

        vm.stopPrank();
    }

    function test_CreateProposal() public {
        vm.startPrank(owner);
        uint256 resolutionTs = block.timestamp + 2 days;
        address proposalAddr = factory.createProposal("Test Proposal", address(tokenX), address(usdc), resolutionTs, address(usdc), paymentTarget, TRANSFER_AMOUNT, 0, 0, 3600);
        proposal = FutarchyProposalPoc(proposalAddr);

        // Split tokenX to get yesX and noX into the proposal
        tokenX.mint(owner, 1000 ether);
        tokenX.approve(address(proposal), 1000 ether);
        proposal.splitX(1000 ether, address(proposal));
        usdc.mint(address(proposal), 2000 ether + TRANSFER_AMOUNT);

        // Define initial prices and liquidity amounts
        uint160 initialPriceYesXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint160 initialPriceNoXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint256 liquidityAmount = 1000 ether;

        // Call createAndSetAmms
        proposal.createAndSetAmms(
            address(mockFactoryV3),
            address(mockPositionManager),
            FEE,
            initialPriceYesXUsdcSqrtX96,
            initialPriceNoXUsdcSqrtX96,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount
        );

        assertEq(proposal.resolutionTimestamp(), resolutionTs);
        assertEq(address(proposal.ammYesPair()), address(mockYesPool));
        assertEq(address(proposal.ammNoPair()), address(mockNoPool));
        vm.stopPrank();
    }

    function test_ResolveYesWins() public {
        vm.startPrank(owner);
        uint256 resolutionTs = block.timestamp + 2 days;
        address proposalAddr = factory.createProposal("Test Proposal", address(tokenX), address(usdc), resolutionTs, address(usdc), paymentTarget, TRANSFER_AMOUNT, 0, 0, 3600);
        proposal = FutarchyProposalPoc(proposalAddr);

        // Split tokenX to get yesX and noX into the proposal
        tokenX.mint(owner, 1000 ether);
        tokenX.approve(address(proposal), 1000 ether);
        proposal.splitX(1000 ether, address(proposal));
        usdc.mint(address(proposal), 2000 ether + TRANSFER_AMOUNT);

        // Define initial prices and liquidity amounts
        uint160 initialPriceYesXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint160 initialPriceNoXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint256 liquidityAmount = 1000 ether;

        // Call createAndSetAmms
        proposal.createAndSetAmms(
            address(mockFactoryV3),
            address(mockPositionManager),
            FEE,
            initialPriceYesXUsdcSqrtX96,
            initialPriceNoXUsdcSqrtX96,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount
        );
        vm.stopPrank();

        // YES wins: average tick is higher
        mockYesPool.setObserveResponse(1000, 1000 + (150 * 3600)); // avg tick 150
        mockNoPool.setObserveResponse(500, 500 + (100 * 3600));    // avg tick 100

        vm.warp(resolutionTs + 1); // Move time forward
        
        proposal.resolve();

        assertEq(uint(proposal.outcome()), uint(FutarchyProposalPoc.Outcome.Yes));
        assertEq(usdc.balanceOf(paymentTarget), TRANSFER_AMOUNT);
    }

    function test_ResolveNoWins() public {
        vm.startPrank(owner);
        uint256 resolutionTs = block.timestamp + 2 days;
        address proposalAddr = factory.createProposal("Test Proposal", address(tokenX), address(usdc), resolutionTs, address(usdc), paymentTarget, TRANSFER_AMOUNT, 0, 0, 3600);
        proposal = FutarchyProposalPoc(proposalAddr);

        // Split tokenX to get yesX and noX into the proposal
        tokenX.mint(owner, 1000 ether);
        tokenX.approve(address(proposal), 1000 ether);
        proposal.splitX(1000 ether, address(proposal));
        usdc.mint(address(proposal), 2000 ether + TRANSFER_AMOUNT);

        // Define initial prices and liquidity amounts
        uint160 initialPriceYesXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint160 initialPriceNoXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint256 liquidityAmount = 1000 ether;

        // Call createAndSetAmms
        proposal.createAndSetAmms(
            address(mockFactoryV3),
            address(mockPositionManager),
            FEE,
            initialPriceYesXUsdcSqrtX96,
            initialPriceNoXUsdcSqrtX96,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount
        );
        vm.stopPrank();

        // NO wins: average tick is higher or equal
        mockYesPool.setObserveResponse(1000, 1000 + (100 * 3600)); // avg tick 100
        mockNoPool.setObserveResponse(500, 500 + (150 * 3600));    // avg tick 150

        vm.warp(resolutionTs + 1);
        
        proposal.resolve();

        assertEq(uint(proposal.outcome()), uint(FutarchyProposalPoc.Outcome.No));
        assertEq(usdc.balanceOf(paymentTarget), 0);
    }
    
    function test_FailResolveBeforeTimestamp() public {
        vm.startPrank(owner);
        uint256 resolutionTs = block.timestamp + 2 days;
        address proposalAddr = factory.createProposal("Test Proposal", address(tokenX), address(usdc), resolutionTs, address(usdc), paymentTarget, TRANSFER_AMOUNT, 0, 0, 3600);
        proposal = FutarchyProposalPoc(proposalAddr);

        // Split tokenX to get yesX and noX into the proposal
        tokenX.mint(owner, 1000 ether);
        tokenX.approve(address(proposal), 1000 ether);
        proposal.splitX(1000 ether, address(proposal));
        usdc.mint(address(proposal), 2000 ether + TRANSFER_AMOUNT);

        // Define initial prices and liquidity amounts
        uint160 initialPriceYesXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint160 initialPriceNoXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint256 liquidityAmount = 1000 ether;

        // Call createAndSetAmms
        proposal.createAndSetAmms(
            address(mockFactoryV3),
            address(mockPositionManager),
            FEE,
            initialPriceYesXUsdcSqrtX96,
            initialPriceNoXUsdcSqrtX96,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount
        );
        vm.stopPrank();

        vm.expectRevert(FutarchyProposalPoc.ResolutionPeriodNotOver.selector);
        proposal.resolve();
    }

    function test_FailResolveTwice() public {
        vm.startPrank(owner);
        uint256 resolutionTs = block.timestamp + 2 days;
        address proposalAddr = factory.createProposal("Test Proposal", address(tokenX), address(usdc), resolutionTs, address(usdc), paymentTarget, TRANSFER_AMOUNT, 0, 0, 3600);
        proposal = FutarchyProposalPoc(proposalAddr);

        // Split tokenX to get yesX and noX into the proposal
        tokenX.mint(owner, 1000 ether);
        tokenX.approve(address(proposal), 1000 ether);
        proposal.splitX(1000 ether, address(proposal));
        usdc.mint(address(proposal), 2000 ether + TRANSFER_AMOUNT);

        // Define initial prices and liquidity amounts
        uint160 initialPriceYesXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint160 initialPriceNoXUsdcSqrtX96 = 79228162514264337593543950336; // Equivalent to 1:1 price
        uint256 liquidityAmount = 1000 ether;

        // Call createAndSetAmms
        proposal.createAndSetAmms(
            address(mockFactoryV3),
            address(mockPositionManager),
            FEE,
            initialPriceYesXUsdcSqrtX96,
            initialPriceNoXUsdcSqrtX96,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount,
            liquidityAmount
        );
        vm.stopPrank();

        // YES wins
        mockYesPool.setObserveResponse(1000, 1000 + (150 * 3600));
        mockNoPool.setObserveResponse(500, 500 + (100 * 3600));

        vm.warp(resolutionTs + 1);
        
        proposal.resolve(); // First resolution
        
        assertEq(uint(proposal.outcome()), uint(FutarchyProposalPoc.Outcome.Yes));

        vm.expectRevert(FutarchyProposalPoc.ProposalClosed.selector);
        proposal.resolve(); // Second resolution should fail
    }
}
