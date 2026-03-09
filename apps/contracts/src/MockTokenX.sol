// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockTokenX — Test governance token for Causal futarchy
/// @notice Anyone can mint. For testnet use only.
contract MockTokenX is ERC20 {
    constructor() ERC20("Causal Token", "CTK") {}

    /// @notice Public mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Faucet — mint 10,000 tokens to caller
    function faucet() external {
        _mint(msg.sender, 10_000 * 10 ** 18);
    }
}
