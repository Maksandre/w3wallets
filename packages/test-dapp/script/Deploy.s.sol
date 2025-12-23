// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../contracts/TestToken.sol";
import {TestNFT} from "../contracts/TestNFT.sol";

contract DeployScript is Script {
    // Anvil's first default account private key
    uint256 constant ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() public {
        vm.startBroadcast(ANVIL_PRIVATE_KEY);

        TestToken token = new TestToken();
        console.log("TestToken deployed to:", address(token));

        TestNFT nft = new TestNFT();
        console.log("TestNFT deployed to:", address(nft));

        vm.stopBroadcast();
    }
}
