// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IOrgToken {
    function mint(address to, uint256 amount) external;
}

/// @title Treasury — Per-organization treasury holding raised USDC
/// @notice Receives USDC from fundraise finalization. Authorized proposals can spend USDC
///         and mint governance tokens. Only the proposal factory can authorize proposals.
contract Treasury {
    using SafeERC20 for IERC20;

    error NotCampaign();
    error NotAuthorized();
    error NotFactory();
    error AlreadyInitialized();
    error ZeroAddress();

    address public immutable campaign;
    IERC20 public immutable usdc;
    address public immutable founder;

    address public projectToken;
    address public proposalFactory;

    mapping(address => bool) public authorizedProposals;

    event Initialized(address indexed projectToken, address indexed proposalFactory);
    event ProposalAuthorized(address indexed proposal);
    event FundsSpent(address indexed proposal, address indexed recipient, uint256 amount);
    event TokensMinted(address indexed proposal, address indexed recipient, uint256 amount);

    modifier onlyAuthorizedProposal() {
        if (!authorizedProposals[msg.sender]) revert NotAuthorized();
        _;
    }

    constructor(address campaign_, address usdc_, address founder_) {
        if (campaign_ == address(0) || usdc_ == address(0) || founder_ == address(0)) {
            revert ZeroAddress();
        }
        campaign = campaign_;
        usdc = IERC20(usdc_);
        founder = founder_;
    }

    /// @notice One-time initialization by the campaign contract after deployment.
    ///         Sets the governance token and proposal factory addresses.
    function initialize(address projectToken_, address proposalFactory_) external {
        if (msg.sender != campaign) revert NotCampaign();
        if (projectToken != address(0)) revert AlreadyInitialized();
        if (projectToken_ == address(0) || proposalFactory_ == address(0)) revert ZeroAddress();

        projectToken = projectToken_;
        proposalFactory = proposalFactory_;
        emit Initialized(projectToken_, proposalFactory_);
    }

    /// @notice Authorize a proposal contract to spend funds and mint tokens.
    ///         Only callable by the registered proposal factory.
    function authorizeProposal(address proposal) external {
        if (msg.sender != proposalFactory) revert NotFactory();
        if (proposal == address(0)) revert ZeroAddress();
        authorizedProposals[proposal] = true;
        emit ProposalAuthorized(proposal);
    }

    /// @notice Transfer USDC to a recipient. Only callable by authorized proposals.
    function spendFunds(address recipient, uint256 amount) external onlyAuthorizedProposal {
        usdc.safeTransfer(recipient, amount);
        emit FundsSpent(msg.sender, recipient, amount);
    }

    /// @notice Mint governance tokens to a recipient. Only callable by authorized proposals.
    function mintTokens(address recipient, uint256 amount) external onlyAuthorizedProposal {
        IOrgToken(projectToken).mint(recipient, amount);
        emit TokensMinted(msg.sender, recipient, amount);
    }

    /// @notice Returns the current USDC balance of the treasury.
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
