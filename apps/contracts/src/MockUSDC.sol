// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — Test stablecoin for Causal futarchy
/// @notice Anyone can mint. 6 decimals like real USDC. For testnet use only.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Public mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Faucet — mint 10,000 USDC to caller
    function faucet() external {
        _mint(msg.sender, 10_000 * 10 ** 6);
    }
}
