// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title OrgToken — Governance token deployed per organization on fundraise finalization
/// @notice Minimal ERC20 with controlled minting. Only the minter (initially CausalOrganizations,
///         then Treasury) can mint. Minting can be locked permanently.
contract OrgToken is ERC20 {
    error NotMinter();
    error MintingLocked();
    error ZeroAddress();

    address public minter;
    bool public mintingLocked;

    event MinterTransferred(address indexed previousMinter, address indexed newMinter);
    event MintingLockedPermanently();

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address minter_
    ) ERC20(name_, symbol_) {
        if (minter_ == address(0)) revert ZeroAddress();
        minter = minter_;
    }

    /// @notice Mint tokens to an address. Only callable by the current minter.
    function mint(address to, uint256 amount) external onlyMinter {
        if (mintingLocked) revert MintingLocked();
        _mint(to, amount);
    }

    /// @notice Permanently lock minting. Cannot be undone.
    function lockMinting() external onlyMinter {
        mintingLocked = true;
        emit MintingLockedPermanently();
    }

    /// @notice Transfer the minter role to a new address (e.g., from CausalOrganizations to Treasury).
    function transferMinter(address newMinter) external onlyMinter {
        if (newMinter == address(0)) revert ZeroAddress();
        address previous = minter;
        minter = newMinter;
        emit MinterTransferred(previous, newMinter);
    }
}
