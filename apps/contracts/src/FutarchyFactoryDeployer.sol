// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FutarchyFactoryPoc} from "./futarchy.sol";

/// @title FutarchyFactoryDeployer — Deploys FutarchyFactoryPoc instances
/// @notice Extracted from OrgDeployer to keep OrgDeployer under the EIP-170
///         contract size limit. OrgDeployer calls this to deploy factories.
contract FutarchyFactoryDeployer {
    /// @notice Deploy a new FutarchyFactoryPoc.
    /// @param owner_ The factory owner (typically the org founder)
    /// @param treasury_ The treasury address for the factory
    /// @return factory The deployed FutarchyFactoryPoc address
    function deploy(address owner_, address treasury_) external returns (address factory) {
        factory = address(new FutarchyFactoryPoc(owner_, treasury_));
    }
}
