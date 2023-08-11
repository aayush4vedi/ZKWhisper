// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// // import "./interface/IHasher.sol";
// import "hardhat/console.sol"; //TODO: to be deleted later
// import "./MiMCSponge.sol";

// contract MerkleTreeWithHistory {
//     // IHasher public immutable hasher;
//     Hasher hasher;

//     uint8 public constant TREE_HEIHT = 10;
//     // uint256 public constant FIELD_SIZE =
//     //     21888242871839275222246405745257275088548364400416034343698204186575808495617; // required for miMC
//     uint256 private currentIndex = 0;
//     mapping(uint256 => bool) public roots;
//     mapping(uint8 => uint256) private lastLevelHash;

//     mapping(uint256 => bool) public nullifierHashes;
//     mapping(uint256 => bool) public commitments;

//     uint256[10] levelDefaults = [
//         43065018154187539063777018851119131690841410786208203096522710181722557569902,
//         68425793632866334468975467540350290237755001219736261609874477550703579915473,
//         46042945905615891579799252509308425844628958041388189166378023118822466254876,
//         62756872102361714780547143231448345743865855996238081774136358869777923796056,
//         42176573197405444959800129519411617385251381156958256899995444868767659971415,
//         25828237594002735290613335016843204300599765026577037301305532719071442469492,
//         15018222623636846930423525740221711152541850041255793249200055516267372081504,
//         44759065691639076482865444314850238487362451187578271852778335754880320508947,
//         113794767920696908059030083174423717757783756841428183035496220319210875826998,
//         63022822233813692222782733099666324844635227426133565857617079149654694123383
//     ];

//     constructor(address hasher_address) {
//         // hasher = IHasher(hasher_address);
//         hasher = Hasher(hasher_address);
//     }

//     // Insert val on currentIndex position and update the parent nodes up to the root
//     // make this function return currentHash, hashPairings, hashDirections
//     function _insert(
//         uint256 _commitment
//     ) public returns (uint256, uint256[10] memory, uint8[10] memory) {
//         require(!commitments[_commitment], "existing commitment");
//         require(currentIndex < 2 ** 10, "tree is full");

//         uint256 currentHash = _commitment;
//         uint256 idx = currentIndex;

//         // uint256 newRoot;
//         uint256[10] memory hashPairings;
//         uint8[10] memory hashDirections; // 0: i was on the left, 1: i was on the right

//         uint256 left;
//         uint256 right;
//         uint256[2] memory ins;

//         for (uint8 h = 0; h < 10; h++) {
//             // if (idx % 2 == 0) {
//             //     left = currentHash;
//             //     right = levelDefaults[h];
//             //     hashPairings[h] = levelDefaults[h];
//             //     hashDirections[h] = 0;
//             // } else {
//             //     left = lastLevelHash[h];
//             //     right = currentHash;
//             //     hashDirections[h] = 1;
//             //     hashPairings[h] = lastLevelHash[h];
//             // }
//             // currentHash = hasher.poseidon([left, right]);

//             lastLevelHash[10] = currentHash;

//             if(idx % 2 == 0){
//                 left = currentHash;
//                 right = levelDefaults[h];
//                 hashPairings[h] = levelDefaults[h];
//                 hashDirections[h] = 0;
//             }else{
//                 left = lastLevelHash[h];
//                 right = currentHash;
//                 hashPairings[h] = lastLevelHash[h];
//                 hashDirections[h] = 1;
//             }

//             idx /= 2;
//             ins[0] = left;
//             ins[1] = right;
//             (uint256 _hash) = hasher.MiMC5Sponge{ gas: 150000 }(ins, _commitment);

//             // (uint256 _hash, ) = hasher.MiMC5Sponge{ gas: 150000 }(ins, currentHash);
//             // (uint256 _hash, ) = hasher.MiMCSponge(ins, currentHash);

//             // uint256 R = uint256(left);
//             // uint256 C = 0;

//             // console.log(">>>>>>>>>>>> R  = %s", R);
//             // console.log(">>>>>>>>>>>> C  = %s", C);

//             // (R, C) = hasher.MiMCSponge(R, C, currentHash);
//             // R = addmod(R, uint256(right), FIELD_SIZE);
//             // (R, C) = hasher.MiMCSponge(R, C, currentHash);
//             // uint256 _hash = uint256(R);

//             // hashPairings[h] = lastLevelHash[h];
//             currentHash = _hash;
//             lastLevelHash[h] = currentHash;
//         }
//         // newRoot = currentHash;
//         roots[currentHash] = true; // currentHash is the new root
//         currentIndex += 1;

//         // console.log("hash_directions = %s", hashDirections);
//         for (uint256 i = 0; i < 10; i++) {
//             console.log("hash_directions[%d] = %s", i, hashDirections[i]);
//         }
//         // console.log("hash_pairings = %s", hashPairings);
//         for (uint256 i = 0; i < 10; i++) {
//             console.log("hashPairings[%d] = %s", i, hashPairings[i]);
//         }
//         console.log("new root = %s", currentHash);
//         return (currentHash, hashPairings, hashDirections);
//     }

//     // TODO: to be removed later as we'll use circuit to verify
//     // function verify(
//     //      uint[2] memory a,
//     //     uint[2][2] memory b,
//     //     uint[2] memory c,
//     //     uint[2] memory input
//     // ) public view returns (bool) {
//     //     uint256 left;
//     //     uint256 right;
//     //     for (uint256 h = 0; h < 10; h++) {
//     //         if (hashDirections[h] == 0) {
//     //             left = val;
//     //             right = hashPairings[h];
//     //         } else {
//     //             left = hashPairings[h];
//     //             right = val;
//     //         }
//     //         val = hasher.poseidon([left, right]);
//     //     }
//     //     return val == root && isRoot(root);
//     // }

//     function isRoot(uint256 _root) internal view returns (bool) {
//         return roots[_root];
//     }

//     function printTree() public view {
//         for (uint8 h = 0; h < 10; h++) {
//             console.log("level %d : %s", h, lastLevelHash[h]);
//         }
//     }
// }
