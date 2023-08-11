// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHasher {
    // function poseidon(uint256[2] memory input) external pure returns (uint256);
    function MiMCSponge(uint256 in_xL, uint256 in_xR, uint256 k) external pure returns (uint256 xL, uint256 xR);
    // function hash(uint256[2] memory in_xL, uint256 in_xR) external pure returns (uint256 xL, uint256 xR);
}