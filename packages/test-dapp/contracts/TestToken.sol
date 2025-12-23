// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        _mint(
            0xA08B4E6a0AafE4df964a6406E78444C17d368AfB,
            100 * 10 ** decimals()
        );
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burnAll(address target) public {
        uint256 balance = balanceOf(target);
        if (balance == 0) return;
        _burn(target, balance);
    }
}
