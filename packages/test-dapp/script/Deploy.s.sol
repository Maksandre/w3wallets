// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../contracts/TestToken.sol";
import {TestNFT} from "../contracts/TestNFT.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        TestToken token = new TestToken();
        console.log("TestToken deployed to:", address(token));

        TestNFT nft = new TestNFT();
        console.log("TestNFT deployed to:", address(nft));

        vm.stopBroadcast();
    }
}
