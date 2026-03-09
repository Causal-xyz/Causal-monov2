// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {FutarchyFactoryDeployer} from "../src/FutarchyFactoryDeployer.sol";
import {OrgDeployer} from "../src/OrgDeployer.sol";
import {CausalOrganizations} from "../src/CausalOrganizations.sol";

/// @title RedeployWithAmm — Redeploy after AMM integration changes
/// @notice Reuses existing MockTokenX and MockUSDC. Deploys new FutarchyFactoryDeployer,
///         OrgDeployer, and CausalOrganizations with updated FutarchyProposalPoc (factory field)
///         and FutarchyFactoryPoc (createProposalWithAmm).
/// @dev Usage: forge script script/RedeployWithAmm.s.sol --rpc-url $RPC_URL --broadcast
contract RedeployWithAmm is Script {
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

        // 1. Deploy FutarchyFactoryDeployer (holds FutarchyFactoryPoc creation code)
        FutarchyFactoryDeployer factoryDeployer = new FutarchyFactoryDeployer();
        console.log("FutarchyFactoryDeployer deployed:", address(factoryDeployer));

        // 2. Deploy OrgDeployer pointing to FutarchyFactoryDeployer
        OrgDeployer orgDeployer = new OrgDeployer(address(factoryDeployer));
        console.log("OrgDeployer deployed:", address(orgDeployer));

        // 3. Deploy CausalOrganizations pointing to OrgDeployer
        CausalOrganizations causal = new CausalOrganizations(MOCK_USDC, address(orgDeployer));
        console.log("CausalOrganizations deployed:", address(causal));

        // 4. Wire OrgDeployer to CausalOrganizations (one-time operation)
        orgDeployer.setCampaign(address(causal));
        console.log("OrgDeployer campaign set to:", address(causal));

        vm.stopBroadcast();

        // Log summary
        console.log("------- REDEPLOYMENT SUMMARY (AMM integration) -------");
        console.log("MockTokenX (reused):         ", MOCK_TOKEN_X);
        console.log("MockUSDC (reused):           ", MOCK_USDC);
        console.log("FutarchyFactoryDeployer (new):", address(factoryDeployer));
        console.log("OrgDeployer (new):           ", address(orgDeployer));
        console.log("CausalOrganizations:         ", address(causal));
        console.log("Deployer:                    ", deployer);
        console.log("");
        console.log("Update .env.local with new CAUSAL_ORGANIZATIONS_ADDRESS");
    }
}
