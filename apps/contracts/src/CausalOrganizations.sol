// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {OrgToken} from "./OrgToken.sol";
import {Treasury} from "./Treasury.sol";
import {OrgDeployer} from "./OrgDeployer.sol";

/// @title CausalOrganizations
/// @notice Singleton contract managing all organizations, fundraises, and token sales.
///         Uses time-weighted allocation: early commitments receive larger token allocations.
///
///         Allocation formula:
///           accumulator_i  = committed_i * timeRemaining_at_commit
///           timeShare_i    = accumulator_i / totalAccumulator
///           proRataShare_i = committed_i / totalCommitted
///           finalShare_i   = alpha * timeShare_i + (1 - alpha) * proRataShare_i
///           userTokens_i   = finalShare_i * tokensForSale
///           userAccepted_i = finalShare_i * finalRaise
///           refund_i       = committed_i - userAccepted_i
contract CausalOrganizations is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────

    uint256 private constant PRECISION = 1e18;
    uint256 private constant CAP_WINDOW = 3 days;

    // ─────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────

    error NotOwner();
    error NotFounder();
    error NameRequired();
    error SymbolRequired();
    error BadTokenAlloc();
    error BadGoal();
    error BadDuration();
    error AlphaExceedsPrecision();
    error SaleNotActive();
    error SaleNotStarted();
    error SaleNotEnded();
    error SaleEnded();
    error ZeroAmount();
    error AlreadyFinalized();
    error BelowMinRaise();
    error ExceedsCommitted();
    error NotFinalized();
    error NoContribution();
    error AlreadyClaimed();
    error GracePeriodNotOver();
    error TooEarlyForWithdrawal();
    error NoFunds();

    // ─────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────

    IERC20 public immutable usdc;
    OrgDeployer public immutable orgDeployer;
    address public owner;
    uint256 public orgCount;

    struct OrgInfo {
        string name;
        string symbol;
        string description;
        string imageUrl;
        address founder;
    }

    struct OrgSale {
        uint256 fundingGoal;
        uint256 usdcRaised;
        uint256 tokensForSale;
        uint256 totalTokenSupply;
        uint256 saleStart;
        uint256 saleEnd;
        uint256 alpha; // 0–1e18: weighting toward time-based share
        uint256 totalAccumulator;
        uint256 discretionaryCap;
        uint256 capDeadline; // saleEnd + CAP_WINDOW
        bool capSet;
        bool active;
        bool finalized;
        bool successful;
    }

    mapping(uint256 => OrgInfo) internal orgInfos;
    mapping(uint256 => OrgSale) public orgSales;
    mapping(uint256 => address) public orgTokens;
    mapping(uint256 => address) public orgTreasuries;
    mapping(uint256 => address) public orgFactories;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => uint256)) public accumulators;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => address[]) internal orgContributors;
    mapping(uint256 => uint256) public orgContributorCount;
    mapping(address => uint256[]) public founderOrgs;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event OrganizationCreated(
        uint256 indexed orgId, address indexed founder, string name, string symbol
    );
    event Committed(
        uint256 indexed orgId, address indexed user, uint256 amount, uint256 accumulator
    );
    event DiscretionaryCapSet(uint256 indexed orgId, uint256 cap);
    event SaleFinalized(
        uint256 indexed orgId, bool successful, uint256 finalRaise, address token
    );
    event Claimed(
        uint256 indexed orgId, address indexed user, uint256 tokens, uint256 refund
    );
    event TreasuryDeployed(
        uint256 indexed orgId, address indexed treasury, uint256 amount
    );
    event FactoryDeployed(uint256 indexed orgId, address indexed factory);

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    constructor(address usdc_, address orgDeployer_) {
        usdc = IERC20(usdc_);
        orgDeployer = OrgDeployer(orgDeployer_);
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────
    // Organization creation
    // ─────────────────────────────────────────────

    /// @notice Create a new organization with a fundraise campaign.
    /// @param _name Organization name (also used for the ERC20 token name)
    /// @param _symbol Token symbol
    /// @param _description Short description of the organization
    /// @param _imageUrl Organization logo/image URL
    /// @param _totalTokenSupply Total supply of governance tokens to mint
    /// @param _tokensForSale Tokens allocated for sale to investors
    /// @param _fundingGoal Minimum USDC to raise for the sale to succeed
    /// @param _saleDuration Duration of the sale window in seconds
    /// @param _alpha Time-weighting parameter: 0=pure pro-rata, 1e18=pure time-weighted
    function createOrganization(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _imageUrl,
        uint256 _totalTokenSupply,
        uint256 _tokensForSale,
        uint256 _fundingGoal,
        uint256 _saleDuration,
        uint256 _alpha
    ) external returns (uint256 orgId) {
        if (bytes(_name).length == 0) revert NameRequired();
        if (bytes(_symbol).length == 0) revert SymbolRequired();
        if (_tokensForSale == 0 || _tokensForSale > _totalTokenSupply) revert BadTokenAlloc();
        if (_fundingGoal == 0) revert BadGoal();
        if (_saleDuration == 0) revert BadDuration();
        if (_alpha > PRECISION) revert AlphaExceedsPrecision();

        orgId = orgCount++;

        orgInfos[orgId] = OrgInfo({
            name: _name,
            symbol: _symbol,
            description: _description,
            imageUrl: _imageUrl,
            founder: msg.sender
        });

        uint256 saleEnd = block.timestamp + _saleDuration;
        orgSales[orgId] = OrgSale({
            fundingGoal: _fundingGoal,
            usdcRaised: 0,
            tokensForSale: _tokensForSale,
            totalTokenSupply: _totalTokenSupply,
            saleStart: block.timestamp,
            saleEnd: saleEnd,
            alpha: _alpha,
            totalAccumulator: 0,
            discretionaryCap: 0,
            capDeadline: saleEnd + CAP_WINDOW,
            capSet: false,
            active: true,
            finalized: false,
            successful: false
        });

        founderOrgs[msg.sender].push(orgId);

        emit OrganizationCreated(orgId, msg.sender, _name, _symbol);
    }

    // ─────────────────────────────────────────────
    // Commit USDC
    // ─────────────────────────────────────────────

    /// @notice Commit USDC to a fundraise. Accumulator tracks time-weighted score.
    function commit(uint256 orgId, uint256 usdcAmount) external nonReentrant {
        OrgSale storage sale = orgSales[orgId];
        if (!sale.active) revert SaleNotActive();
        if (block.timestamp < sale.saleStart) revert SaleNotStarted();
        if (block.timestamp > sale.saleEnd) revert SaleEnded();
        if (usdcAmount == 0) revert ZeroAmount();

        uint256 timeRemaining = sale.saleEnd - block.timestamp;
        uint256 acc = usdcAmount * timeRemaining;

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        if (contributions[orgId][msg.sender] == 0) {
            orgContributors[orgId].push(msg.sender);
            orgContributorCount[orgId]++;
        }

        contributions[orgId][msg.sender] += usdcAmount;
        accumulators[orgId][msg.sender] += acc;
        sale.usdcRaised += usdcAmount;
        sale.totalAccumulator += acc;

        emit Committed(orgId, msg.sender, usdcAmount, acc);
    }

    // ─────────────────────────────────────────────
    // Finalize raise
    // ─────────────────────────────────────────────

    /// @notice Founder finalizes the raise and sets the discretionary cap.
    ///         Auto-deploys OrgToken, Treasury, and FutarchyFactoryPoc.
    function finalizeRaise(uint256 orgId, uint256 finalCap) external nonReentrant {
        OrgSale storage sale = orgSales[orgId];
        if (msg.sender != orgInfos[orgId].founder) revert NotFounder();
        if (block.timestamp <= sale.saleEnd) revert SaleNotEnded();
        if (!sale.active) revert AlreadyFinalized();
        if (finalCap < sale.fundingGoal) revert BelowMinRaise();
        if (finalCap > sale.usdcRaised) revert ExceedsCommitted();

        sale.discretionaryCap = finalCap;
        sale.capSet = true;
        sale.active = false;
        sale.finalized = true;
        sale.successful = true;

        _deployOrgInfrastructure(orgId, finalCap);

        emit DiscretionaryCapSet(orgId, finalCap);
        emit SaleFinalized(orgId, true, finalCap, orgTokens[orgId]);
    }

    /// @notice Anyone can force-finalize if the founder hasn't acted within CAP_WINDOW.
    ///         Defaults finalCap to totalCommitted.
    function forceFinalize(uint256 orgId) external nonReentrant {
        OrgSale storage sale = orgSales[orgId];
        if (!sale.active) revert AlreadyFinalized();
        if (block.timestamp <= sale.capDeadline) revert GracePeriodNotOver();

        uint256 finalCap = sale.usdcRaised;
        sale.discretionaryCap = finalCap;
        sale.capSet = true;
        sale.active = false;
        sale.finalized = true;
        sale.successful = finalCap >= sale.fundingGoal;

        if (sale.successful) {
            _deployOrgInfrastructure(orgId, finalCap);
        }

        emit SaleFinalized(orgId, sale.successful, finalCap, orgTokens[orgId]);
    }

    // ─────────────────────────────────────────────
    // Internal deployment
    // ─────────────────────────────────────────────

    function _deployOrgInfrastructure(uint256 orgId, uint256 finalCap) internal {
        OrgInfo storage info = orgInfos[orgId];
        OrgSale storage sale = orgSales[orgId];

        // 1. Deploy OrgToken, Treasury, and FutarchyFactoryPoc via OrgDeployer
        (address tokenAddr, address treasuryAddr, address factoryAddr) =
            orgDeployer.deployOrg(info.name, info.symbol, address(this), address(usdc), info.founder);

        OrgToken token = OrgToken(tokenAddr);
        orgTokens[orgId] = tokenAddr;

        // Mint sale tokens to this contract (distributed on claim)
        token.mint(address(this), sale.tokensForSale);

        // Mint remaining supply to founder
        uint256 founderAlloc = sale.totalTokenSupply - sale.tokensForSale;
        if (founderAlloc > 0) {
            token.mint(info.founder, founderAlloc);
        }

        // 2. Transfer raised USDC to Treasury
        orgTreasuries[orgId] = treasuryAddr;
        usdc.safeTransfer(treasuryAddr, finalCap);
        emit TreasuryDeployed(orgId, treasuryAddr, finalCap);

        // 3. Record factory
        orgFactories[orgId] = factoryAddr;
        emit FactoryDeployed(orgId, factoryAddr);

        // 4. Wire: Treasury knows token + factory, token minter → treasury
        Treasury(treasuryAddr).initialize(tokenAddr, factoryAddr);
        token.transferMinter(treasuryAddr);
    }

    // ─────────────────────────────────────────────
    // Claim tokens + refund
    // ─────────────────────────────────────────────

    /// @notice Claim governance tokens and USDC refund after finalization.
    ///         If the sale failed, investors get a full USDC refund.
    function claim(uint256 orgId) external nonReentrant {
        OrgSale storage sale = orgSales[orgId];
        if (!sale.finalized) revert NotFinalized();
        if (contributions[orgId][msg.sender] == 0) revert NoContribution();
        if (hasClaimed[orgId][msg.sender]) revert AlreadyClaimed();

        hasClaimed[orgId][msg.sender] = true;

        if (!sale.successful) {
            // Full refund
            uint256 fullRefund = contributions[orgId][msg.sender];
            usdc.safeTransfer(msg.sender, fullRefund);
            emit Claimed(orgId, msg.sender, 0, fullRefund);
            return;
        }

        uint256 finalRaise = sale.discretionaryCap;
        uint256 finalShare = _getFinalShare(orgId, msg.sender);

        // Tokens = finalShare * tokensForSale
        uint256 tokens = (finalShare * sale.tokensForSale) / PRECISION;

        // Accepted USDC = finalShare * finalRaise
        uint256 accepted = (finalShare * finalRaise) / PRECISION;

        // Refund = committed - accepted
        uint256 committed = contributions[orgId][msg.sender];
        uint256 refund = committed > accepted ? committed - accepted : 0;

        if (refund > 0) {
            usdc.safeTransfer(msg.sender, refund);
        }

        if (tokens > 0) {
            IERC20(orgTokens[orgId]).safeTransfer(msg.sender, tokens);
        }

        emit Claimed(orgId, msg.sender, tokens, refund);
    }

    // ─────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────

    /// @notice Returns the final share (PRECISION-scaled) for a user.
    function getFinalShare(uint256 orgId, address user) external view returns (uint256) {
        return _getFinalShare(orgId, user);
    }

    function _getFinalShare(uint256 orgId, address user) internal view returns (uint256) {
        OrgSale storage sale = orgSales[orgId];
        uint256 committed = contributions[orgId][user];
        if (committed == 0 || sale.usdcRaised == 0) return 0;

        uint256 alpha = sale.alpha;
        uint256 proRataShare = (committed * PRECISION) / sale.usdcRaised;

        if (sale.totalAccumulator == 0 || alpha == 0) {
            return proRataShare;
        }

        uint256 userAcc = accumulators[orgId][user];
        uint256 timeShare = (userAcc * PRECISION) / sale.totalAccumulator;

        // finalShare = alpha * timeShare + (1 - alpha) * proRataShare
        return (alpha * timeShare + (PRECISION - alpha) * proRataShare) / PRECISION;
    }

    /// @notice Returns the user's estimated token allocation and refund.
    function getUserAllocation(uint256 orgId, address user)
        external
        view
        returns (uint256 estimatedTokens, uint256 estimatedRefund, uint256 finalShareBps)
    {
        OrgSale storage sale = orgSales[orgId];
        if (contributions[orgId][user] == 0) return (0, 0, 0);

        uint256 finalRaise = sale.capSet ? sale.discretionaryCap : sale.usdcRaised;
        uint256 fs = _getFinalShare(orgId, user);

        estimatedTokens = (fs * sale.tokensForSale) / PRECISION;
        uint256 accepted = (fs * finalRaise) / PRECISION;
        uint256 committed = contributions[orgId][user];
        estimatedRefund = committed > accepted ? committed - accepted : 0;
        finalShareBps = fs / (PRECISION / 10000);
    }

    /// @notice Returns the current accumulator multiplier for a new commitment.
    function getCurrentMultiplier(uint256 orgId)
        external
        view
        returns (uint256 numerator, uint256 denominator)
    {
        OrgSale storage sale = orgSales[orgId];
        if (block.timestamp > sale.saleEnd) return (0, 1);
        uint256 timeRemaining = sale.saleEnd - block.timestamp;
        uint256 totalDuration = sale.saleEnd - sale.saleStart;
        return (timeRemaining, totalDuration);
    }

    /// @notice Returns organization info.
    function getOrgInfo(uint256 orgId)
        external
        view
        returns (
            string memory name_,
            string memory symbol_,
            string memory description_,
            string memory imageUrl_,
            address founder_
        )
    {
        OrgInfo storage info = orgInfos[orgId];
        return (info.name, info.symbol, info.description, info.imageUrl, info.founder);
    }

    /// @notice Returns the effective token price (fundingGoal / tokensForSale).
    function getTokenPrice(uint256 orgId) external view returns (uint256) {
        OrgSale storage sale = orgSales[orgId];
        if (sale.tokensForSale == 0) return 0;
        return (sale.fundingGoal * PRECISION) / sale.tokensForSale;
    }

    /// @notice Returns contributor address at the given index.
    function getContributor(uint256 orgId, uint256 index) external view returns (address) {
        return orgContributors[orgId][index];
    }

    /// @notice Returns the list of org IDs founded by an address.
    function getFounderOrgCount(address founder) external view returns (uint256) {
        return founderOrgs[founder].length;
    }

    function getFounderOrgId(address founder, uint256 index) external view returns (uint256) {
        return founderOrgs[founder][index];
    }
}
