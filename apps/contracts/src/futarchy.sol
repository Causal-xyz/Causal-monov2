// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface ITreasury {
    function authorizeProposal(address proposal) external;
    function spendFunds(address recipient, uint256 amount) external;
    function mintTokens(address recipient, uint256 amount) external;
}

interface IOracle {
    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory observationInfo);
}

interface IUniswapV3Factory {
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        uint24 indexed fee,
        int24 tickSpacing,
        address pool
    );
    event FeeAmountEnabled(uint24 indexed fee, int24 indexed tickSpacing);

    function owner() external view returns (address);
    function feeAmountTickSpacing(uint24 fee) external view returns (int24);
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
    function setOwner(address _owner) external;
    function enableFeeAmount(uint24 fee, int24 tickSpacing) external;
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);

    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
}

contract ConditionalToken is ERC20 {
    error NotManager();

    address public immutable manager;
    uint8 private immutable _tokenDecimals;

    constructor(
        string memory name_,
        string memory symbol_,
        address manager_,
        uint8 tokenDecimals_
    ) ERC20(name_, symbol_) {
        manager = manager_;
        _tokenDecimals = tokenDecimals_;
    }

    modifier onlyManager() {
        if (msg.sender != manager) revert NotManager();
        _;
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }

    function mint(address to, uint256 amount) external onlyManager {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyManager {
        _burn(from, amount);
    }
}

contract FutarchyProposalPoc is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Outcome {
        Unresolved,
        Yes,
        No
    }

    error AlreadyResolved();
    error NotResolved();
    error ZeroAmount();
    error InvalidOutcome();
    error ProposalClosed();
    error ResolutionPeriodNotOver();
    error AmmsAlreadySet();
    error AmmsNotSet();
    error UniswapV3PoolCreationFailed();
    error UniswapV3LiquidityAdditionFailed();
    error InvalidFeeTier();
    error TransferFailed();

    uint256 public immutable proposalId;
    string public title;

    IERC20 public immutable tokenX;
    IERC20 public immutable usdc;

    // Proposal action: on Yes, transfer tokens to recipient
    IERC20 public immutable transferToken;
    address public immutable recipient;
    uint256 public immutable transferAmount;

    // Treasury integration (optional — address(0) for standalone mode)
    ITreasury public immutable treasury;
    uint256 public immutable usdcRequested;
    uint256 public immutable tokensToMint;

    ConditionalToken public immutable yesX;
    ConditionalToken public immutable noX;
    ConditionalToken public immutable yesUsdc;
    ConditionalToken public immutable noUsdc;

    uint256 public immutable resolutionTimestamp;
    IUniswapV3Factory public uniswapV3Factory;
    INonfungiblePositionManager public positionManager;
    IOracle public ammYesPair;
    IOracle public ammNoPair;

    uint256 public yesPositionTokenId;
    uint256 public noPositionTokenId;

    Outcome public outcome;

    event SplitX(address indexed caller, address indexed receiver, uint256 amount);
    event SplitUsdc(address indexed caller, address indexed receiver, uint256 amount);
    event MergeX(address indexed caller, address indexed receiver, uint256 amount);
    event MergeUsdc(address indexed caller, address indexed receiver, uint256 amount);
    event Resolved(uint256 indexed proposalId, Outcome outcome);
    event RedeemedX(address indexed caller, address indexed receiver, Outcome indexed winningSide, uint256 amount);
    event RedeemedUsdc(address indexed caller, address indexed receiver, Outcome indexed winningSide, uint256 amount);
    event AmmsSet(address ammYesPair, address ammNoPair);
    event Executed(uint256 indexed proposalId, address indexed recipient, address token, uint256 amount);

    constructor(
        uint256 proposalId_,
        string memory title_,
        address owner_,
        address tokenX_,
        address usdc_,
        uint256 resolutionTimestamp_,
        address transferToken_,
        address recipient_,
        uint256 transferAmount_,
        address treasury_,
        uint256 usdcRequested_,
        uint256 tokensToMint_
    ) Ownable(owner_) {
        require(tokenX_ != address(0), "tokenX=0");
        require(usdc_ != address(0), "usdc=0");
        require(recipient_ != address(0), "recipient=0");
        require(transferToken_ != address(0), "transferToken=0");

        proposalId = proposalId_;
        title = title_;
        tokenX = IERC20(tokenX_);
        usdc = IERC20(usdc_);
        resolutionTimestamp = resolutionTimestamp_;
        transferToken = IERC20(transferToken_);
        recipient = recipient_;
        transferAmount = transferAmount_;
        treasury = ITreasury(treasury_);
        usdcRequested = usdcRequested_;
        tokensToMint = tokensToMint_;

        string memory pid = Strings.toString(proposalId_);
        string memory xSymbol = IERC20Metadata(tokenX_).symbol();
        string memory usdcSymbol = IERC20Metadata(usdc_).symbol();
        uint8 xDecimals = IERC20Metadata(tokenX_).decimals();
        uint8 usdcDecimals = IERC20Metadata(usdc_).decimals();

        yesX = new ConditionalToken(
            string.concat(xSymbol, " YES (P", pid, ")"),
            string.concat("y", xSymbol, "-P", pid),
            address(this),
            xDecimals
        );
        noX = new ConditionalToken(
            string.concat(xSymbol, " NO (P", pid, ")"),
            string.concat("n", xSymbol, "-P", pid),
            address(this),
            xDecimals
        );
        yesUsdc = new ConditionalToken(
            string.concat(usdcSymbol, " YES (P", pid, ")"),
            string.concat("y", usdcSymbol, "-P", pid),
            address(this),
            usdcDecimals
        );
        noUsdc = new ConditionalToken(
            string.concat(usdcSymbol, " NO (P", pid, ")"),
            string.concat("n", usdcSymbol, "-P", pid),
            address(this),
            usdcDecimals
        );
    }

    modifier onlyUnresolved() {
        if (outcome != Outcome.Unresolved) revert ProposalClosed();
        _;
    }

    modifier onlyResolved() {
        if (outcome == Outcome.Unresolved) revert NotResolved();
        _;
    }

    function createAndSetAmms(
        address uniswapV3Factory_,
        address positionManager_,
        uint24 fee,
        uint160 initialPriceYesXUsdcSqrtX96,
        uint160 initialPriceNoXUsdcSqrtX96,
        uint256 yesXLiquidityAmount,
        uint256 noXLiquidityAmount,
        uint256 usdcForYesXPoolLiquidity,
        uint256 usdcForNoXPoolLiquidity
    ) external onlyOwner {
        if (address(ammYesPair) != address(0) || address(ammNoPair) != address(0)) {
            revert AmmsAlreadySet();
        }

        uniswapV3Factory = IUniswapV3Factory(uniswapV3Factory_);
        positionManager = INonfungiblePositionManager(positionManager_);

        int24 tickSpacing = uniswapV3Factory.feeAmountTickSpacing(fee);
        if (tickSpacing == 0) revert InvalidFeeTier();

        if (yesX.balanceOf(address(this)) < yesXLiquidityAmount) revert ZeroAmount();
        if (noX.balanceOf(address(this)) < noXLiquidityAmount) revert ZeroAmount();
        if (usdc.balanceOf(address(this)) < usdcForYesXPoolLiquidity + usdcForNoXPoolLiquidity) {
            revert ZeroAmount();
        }

        (int24 tickLower, int24 tickUpper) = _fullRangeTicks(tickSpacing);

        // yesX / USDC
        (address token0YesX, address token1YesX, bool yesXIsToken0) =
            address(yesX) < address(usdc)
                ? (address(yesX), address(usdc), true)
                : (address(usdc), address(yesX), false);

        address yesXUsdcPool = positionManager.createAndInitializePoolIfNecessary(
            token0YesX,
            token1YesX,
            fee,
            initialPriceYesXUsdcSqrtX96
        );
        if (yesXUsdcPool == address(0)) revert UniswapV3PoolCreationFailed();

        // noX / USDC
        (address token0NoX, address token1NoX, bool noXIsToken0) =
            address(noX) < address(usdc)
                ? (address(noX), address(usdc), true)
                : (address(usdc), address(noX), false);

        address noXUsdcPool = positionManager.createAndInitializePoolIfNecessary(
            token0NoX,
            token1NoX,
            fee,
            initialPriceNoXUsdcSqrtX96
        );
        if (noXUsdcPool == address(0)) revert UniswapV3PoolCreationFailed();

        ammYesPair = IOracle(yesXUsdcPool);
        ammNoPair = IOracle(noXUsdcPool);

        IERC20(address(yesX)).forceApprove(address(positionManager), yesXLiquidityAmount);
        IERC20(address(noX)).forceApprove(address(positionManager), noXLiquidityAmount);
        usdc.forceApprove(
            address(positionManager),
            usdcForYesXPoolLiquidity + usdcForNoXPoolLiquidity
        );

        INonfungiblePositionManager.MintParams memory yesMintParams =
            INonfungiblePositionManager.MintParams({
                token0: token0YesX,
                token1: token1YesX,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: yesXIsToken0 ? yesXLiquidityAmount : usdcForYesXPoolLiquidity,
                amount1Desired: yesXIsToken0 ? usdcForYesXPoolLiquidity : yesXLiquidityAmount,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp + 1 hours
            });

        (
            uint256 mintedYesTokenId,
            uint128 yesLiquidity,
            uint256 amount0YesX,
            uint256 amount1YesX
        ) = positionManager.mint(yesMintParams);

        if (yesLiquidity == 0 || amount0YesX == 0 || amount1YesX == 0) {
            revert UniswapV3LiquidityAdditionFailed();
        }
        yesPositionTokenId = mintedYesTokenId;

        INonfungiblePositionManager.MintParams memory noMintParams =
            INonfungiblePositionManager.MintParams({
                token0: token0NoX,
                token1: token1NoX,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: noXIsToken0 ? noXLiquidityAmount : usdcForNoXPoolLiquidity,
                amount1Desired: noXIsToken0 ? usdcForNoXPoolLiquidity : noXLiquidityAmount,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp + 1 hours
            });

        (
            uint256 mintedNoTokenId,
            uint128 noLiquidity,
            uint256 amount0NoX,
            uint256 amount1NoX
        ) = positionManager.mint(noMintParams);

        if (noLiquidity == 0 || amount0NoX == 0 || amount1NoX == 0) {
            revert UniswapV3LiquidityAdditionFailed();
        }
        noPositionTokenId = mintedNoTokenId;

        emit AmmsSet(address(ammYesPair), address(ammNoPair));
    }

    function _fullRangeTicks(int24 tickSpacing)
        internal
        pure
        returns (int24 tickLower, int24 tickUpper)
    {
        tickLower = (-887272 / tickSpacing) * tickSpacing;
        tickUpper = (887272 / tickSpacing) * tickSpacing;
    }

    function resolve() external onlyUnresolved {
        if (block.timestamp < resolutionTimestamp) revert ResolutionPeriodNotOver();
        if (address(ammYesPair) == address(0) || address(ammNoPair) == address(0)) revert AmmsNotSet();

        int56 yesTwap = getTwap(ammYesPair);
        int56 noTwap = getTwap(ammNoPair);

        outcome = yesTwap > noTwap ? Outcome.Yes : Outcome.No;
        emit Resolved(proposalId, outcome);

        if (outcome == Outcome.Yes) {
            if (address(treasury) != address(0)) {
                // Treasury mode: spend USDC and/or mint tokens via treasury
                if (usdcRequested > 0) {
                    treasury.spendFunds(recipient, usdcRequested);
                }
                if (tokensToMint > 0) {
                    treasury.mintTokens(recipient, tokensToMint);
                }
            } else {
                // Standalone mode: direct transfer (backwards compatible)
                transferToken.safeTransfer(recipient, transferAmount);
            }
            emit Executed(proposalId, recipient, address(transferToken), transferAmount);
        }
    }

    function getTwap(IOracle pool) internal view returns (int56) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = 3600;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);
        return (tickCumulatives[1] - tickCumulatives[0]) / 3600;
    }

    function splitX(uint256 amount, address receiver) external nonReentrant onlyUnresolved {
        if (amount == 0) revert ZeroAmount();
        tokenX.safeTransferFrom(msg.sender, address(this), amount);
        yesX.mint(receiver, amount);
        noX.mint(receiver, amount);
        emit SplitX(msg.sender, receiver, amount);
    }

    function splitUsdc(uint256 amount, address receiver) external nonReentrant onlyUnresolved {
        if (amount == 0) revert ZeroAmount();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        yesUsdc.mint(receiver, amount);
        noUsdc.mint(receiver, amount);
        emit SplitUsdc(msg.sender, receiver, amount);
    }

    function mergeX(uint256 amount, address receiver) external nonReentrant onlyUnresolved {
        if (amount == 0) revert ZeroAmount();
        yesX.burn(msg.sender, amount);
        noX.burn(msg.sender, amount);
        tokenX.safeTransfer(receiver, amount);
        emit MergeX(msg.sender, receiver, amount);
    }

    function mergeUsdc(uint256 amount, address receiver) external nonReentrant onlyUnresolved {
        if (amount == 0) revert ZeroAmount();
        yesUsdc.burn(msg.sender, amount);
        noUsdc.burn(msg.sender, amount);
        usdc.safeTransfer(receiver, amount);
        emit MergeUsdc(msg.sender, receiver, amount);
    }

    function redeemWinningX(uint256 amount, address receiver) external nonReentrant onlyResolved {
        if (amount == 0) revert ZeroAmount();
        if (outcome == Outcome.Yes) {
            yesX.burn(msg.sender, amount);
        } else if (outcome == Outcome.No) {
            noX.burn(msg.sender, amount);
        } else {
            revert InvalidOutcome();
        }
        tokenX.safeTransfer(receiver, amount);
        emit RedeemedX(msg.sender, receiver, outcome, amount);
    }

    function redeemWinningUsdc(uint256 amount, address receiver) external nonReentrant onlyResolved {
        if (amount == 0) revert ZeroAmount();
        if (outcome == Outcome.Yes) {
            yesUsdc.burn(msg.sender, amount);
        } else if (outcome == Outcome.No) {
            noUsdc.burn(msg.sender, amount);
        } else {
            revert InvalidOutcome();
        }
        usdc.safeTransfer(receiver, amount);
        emit RedeemedUsdc(msg.sender, receiver, outcome, amount);
    }

    function getTokenSet() external view returns (address yesX_, address noX_, address yesUsdc_, address noUsdc_) {
        return (address(yesX), address(noX), address(yesUsdc), address(noUsdc));
    }
}

contract FutarchyFactoryPoc is Ownable {
    uint256 public proposalCount;
    mapping(uint256 => address) public proposals;

    /// @notice Treasury address for this factory. address(0) for standalone mode.
    ITreasury public immutable treasury;

    constructor(address owner_, address treasury_) Ownable(owner_) {
        treasury = ITreasury(treasury_);
    }

    /// @notice Create a new futarchy proposal with treasury integration.
    /// @param title Proposal title
    /// @param tokenX Governance token (OrgToken) address
    /// @param usdc USDC address
    /// @param resolutionTimestamp When the proposal can be resolved
    /// @param transferToken Token to transfer on YES (used in standalone mode)
    /// @param recipient Who receives funds/tokens on YES outcome
    /// @param transferAmount Amount to transfer on YES (standalone mode)
    /// @param usdcRequested USDC to spend from treasury on YES (treasury mode)
    /// @param tokensToMint Governance tokens to mint via treasury on YES (treasury mode)
    function createProposal(
        string memory title,
        address tokenX,
        address usdc,
        uint256 resolutionTimestamp,
        address transferToken,
        address recipient,
        uint256 transferAmount,
        uint256 usdcRequested,
        uint256 tokensToMint
    ) external onlyOwner returns (address) {
        proposalCount++;
        FutarchyProposalPoc proposal = new FutarchyProposalPoc(
            proposalCount,
            title,
            msg.sender,
            tokenX,
            usdc,
            resolutionTimestamp,
            transferToken,
            recipient,
            transferAmount,
            address(treasury),
            usdcRequested,
            tokensToMint
        );
        proposals[proposalCount] = address(proposal);

        // Authorize the proposal in the treasury (if treasury mode)
        if (address(treasury) != address(0)) {
            treasury.authorizeProposal(address(proposal));
        }

        return address(proposal);
    }
}
