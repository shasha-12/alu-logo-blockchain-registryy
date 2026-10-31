// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ALULogoToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    constructor(address logoOwner) ERC20("ALU Logo Token", "ALUT") Ownable(logoOwner) {
        require(logoOwner != address(0), "Logo owner cannot be the zero address");
        _mint(logoOwner, INITIAL_SUPPLY);
    }

    function distributeShares(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Recipient cannot be the zero address");
        require(amount > 0, "Amount must be greater than zero");
        _transfer(owner(), recipient, amount);
    }

    function ownershipPercentage(address account) public view returns (uint256 percentage) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return 0;
        }
        percentage = (balanceOf(account) * 100) / supply;
    }
}
