// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockTokenX} from "../src/MockTokenX.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {CausalOrganizations} from "../src/CausalOrganizations.sol";

/// @title Deploy — Deploy all Causal contracts to Avalanche Fuji
/// @notice Usage: forge script script/Deploy.s.sol --rpc-url fuji --broadcast
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy mock tokens
        MockTokenX tokenX = new MockTokenX();
        console.log("MockTokenX deployed:", address(tokenX));

        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed:", address(usdc));

        // 2. Deploy CausalOrganizations singleton
        CausalOrganizations causal = new CausalOrganizations(address(usdc));
        console.log("CausalOrganizations deployed:", address(causal));

        // 3. Mint initial test tokens to deployer
        tokenX.faucet();
        usdc.faucet();
        console.log("Faucet called for deployer:", deployer);

        vm.stopBroadcast();

        // Log summary
        console.log("------- DEPLOYMENT SUMMARY -------");
        console.log("MockTokenX:           ", address(tokenX));
        console.log("MockUSDC:             ", address(usdc));
        console.log("CausalOrganizations:  ", address(causal));
        console.log("Deployer:             ", deployer);
    }
}
