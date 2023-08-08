// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interface/IPoseidon.sol";
import "./interface/IZKWhisper.sol";
import "./MerkleTreeWithHistory.sol";

contract ZKWhisper is ReentrancyGuard, MerkleTreeWithHistory {
    event SignupEvent(uint256 indexed root, uint256[10] hashPairings, uint8[10] hashDirections);
    event LoginEvent(uint256 indexed root, uint256[10] hashPairings, uint8[10] hashDirections);

    uint256 public constant TREE_HEIGHT_VAL = 10;

    constructor(address poseidon) MerkleTreeWithHistory(poseidon) {}

    function signupFn(
        uint256 _commitment
    ) external nonReentrant returns (uint256, uint256[10] memory, uint8[10] memory) {
        (uint256 root, uint256[10] memory hashPairings, uint8[10] memory hashDirections) = _insert(
            _commitment
        );
        emit SignupEvent(root, hashPairings, hashDirections);
        return (root, hashPairings, hashDirections);
    }

    function getTreeHeight() external pure returns (uint256) {
        return TREE_HEIGHT_VAL;
    }
}
