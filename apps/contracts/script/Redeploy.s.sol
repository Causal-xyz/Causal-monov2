// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {OrgDeployer} from "../src/OrgDeployer.sol";
import {CausalOrganizations} from "../src/CausalOrganizations.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Redeploy — Redeploy OrgDeployer + CausalOrganizations to Fuji
/// @notice Reuses existing MockTokenX and MockUSDC. Only deploys contracts
///         whose bytecode changed (OrgDeployer, CausalOrganizations).
/// @dev Usage: forge script script/Redeploy.s.sol --rpc-url $RPC_URL --broadcast --verify --etherscan-api-key $SNOWTRACE_API_KEY
contract Redeploy is Script {
    // Existing deployed addresses on Fuji (unchanged contracts)
    address constant MOCK_USDC = 0xbeA10d851aD86B86a277aC046C24Eb989dfd027c;
    address constant MOCK_TOKEN_X = 0xecFa95675aFF2F3776F53853Bb8da5a82015FB51;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Reusing MockTokenX:", MOCK_TOKEN_X);
        console.log("Reusing MockUSDC:", MOCK_USDC);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy new OrgDeployer (bytecode changed due to FutarchyFactoryPoc twapWindow)
        OrgDeployer orgDeployer = new OrgDeployer();
        console.log("OrgDeployer deployed:", address(orgDeployer));

        // 2. Deploy new CausalOrganizations (points to new OrgDeployer)
        CausalOrganizations causal = new CausalOrganizations(MOCK_USDC, address(orgDeployer));
        console.log("CausalOrganizations deployed:", address(causal));

        // 3. Wire OrgDeployer to CausalOrganizations (one-time operation)
        orgDeployer.setCampaign(address(causal));
        console.log("OrgDeployer campaign set to:", address(causal));

        vm.stopBroadcast();

        // Log summary
        console.log("------- REDEPLOYMENT SUMMARY -------");
        console.log("MockTokenX (reused):  ", MOCK_TOKEN_X);
        console.log("MockUSDC (reused):    ", MOCK_USDC);
        console.log("OrgDeployer (new):    ", address(orgDeployer));
        console.log("CausalOrganizations:  ", address(causal));
        console.log("Deployer:             ", deployer);
    }
}
