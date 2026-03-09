// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OrgToken} from "./OrgToken.sol";
import {Treasury} from "./Treasury.sol";
import {FutarchyFactoryPoc} from "./futarchy.sol";

/// @title OrgDeployer — Deploys per-org infrastructure (OrgToken, Treasury, FutarchyFactoryPoc)
/// @notice Extracted from CausalOrganizations to stay under the EIP-170 contract size limit.
///         Only callable by the registered campaign contract.
contract OrgDeployer {
    error NotCampaign();
    error AlreadySet();

    address public campaign;

    modifier onlyCampaign() {
        if (msg.sender != campaign) revert NotCampaign();
        _;
    }

    /// @notice Set the campaign address. Can only be called once (by the deployer).
    function setCampaign(address campaign_) external {
        if (campaign != address(0)) revert AlreadySet();
        campaign = campaign_;
    }

    /// @notice Deploy OrgToken, Treasury, and FutarchyFactoryPoc for an organization.
    /// @return token The deployed OrgToken address
    /// @return treasury The deployed Treasury address
    /// @return factory The deployed FutarchyFactoryPoc address
    function deployOrg(
        string memory name_,
        string memory symbol_,
        address minter_,
        address usdc_,
        address founder_
    ) external onlyCampaign returns (address token, address treasury, address factory) {
        token = address(new OrgToken(name_, symbol_, minter_));
        treasury = address(new Treasury(minter_, usdc_, founder_));
        factory = address(new FutarchyFactoryPoc(founder_, treasury));
        return (token, treasury, factory);
    }
}
