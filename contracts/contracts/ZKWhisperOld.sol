// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// // import "./interface/IVerifier.sol";
// import "./MerkleTreeWithHistory.sol";

// contract ZKWhisperOLD is ReentrancyGuard, MerkleTreeWithHistory {
//     event SignupEvent(uint256 root, uint256[10] hashPairings, uint8[10] hashDirections);
//     event LoginEvent(address account, uint256 nullifierHash);

//     uint256 public constant TREE_HEIGHT_VAL = 10;

//     constructor(address hasher) MerkleTreeWithHistory(hasher) {}

//     function signupFn(
//         uint256 _commitment
//     ) external nonReentrant returns (uint256, uint256[10] memory, uint8[10] memory) {
//         (uint256 root, uint256[10] memory hashPairings, uint8[10] memory hashDirections) = _insert(
//             _commitment
//         );
//         emit SignupEvent(root, hashPairings, hashDirections);
//         return (root, hashPairings, hashDirections);
//     }

//     // function loginFn(
//     //     uint[2] memory a,
//     //     uint[2][2] memory b,
//     //     uint[2] memory c,
//     //     uint[2] memory input
//     // ) external payable nonReentrant {
//     //     uint256 _root = input[0];
//     //     uint256 _nullifierHash = input[1];

//     //     require(!nullifierHashes[_nullifierHash], "nullifier hash exists");
//     //     require(roots[_root], "root does not exist");

//     //     uint256 _addr = uint256(uint160(msg.sender));

//     //     (bool verifyOK, ) = verifier.call(abi.encodeCall(IVerifier.verifyProof, (a, b, c, [_root, _nullifierHash, _addr])));

//     //     emit LoginEvent(msg.sender, _nullifierHash);
//     //     return verifyOK;
//     // }

//     function getTreeHeight() external pure returns (uint256) {
//         return TREE_HEIGHT_VAL;
//     }
// }
