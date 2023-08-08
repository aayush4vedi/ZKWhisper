// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPoseidon {
    function poseidon(uint256[2] memory input) external pure returns (uint256);
}