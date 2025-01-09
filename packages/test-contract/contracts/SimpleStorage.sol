// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedValue;

    event ValueUpdated(uint256 newValue);

    function setValue(uint256 _newValue) public {
        storedValue = _newValue;
        emit ValueUpdated(_newValue);
    }

    function getValue() public view returns (uint256) {
        return storedValue;
    }
}
