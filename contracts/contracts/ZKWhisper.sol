// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MiMCSponge.sol";
import "./interface/IVerifier.sol";
import "hardhat/console.sol"; //TODO: to be deleted later

contract ZKWhisper is ReentrancyGuard {
    event SignupEvent(uint256 root, uint256[10] hashPairings, uint8[10] hashDirections);
    event LoginEvent(address account, uint256 nullifierHash, bool verifyOK);

    address verifier;
    Hasher hasher;

    uint8 public treeLevel = 10;
    uint256 public denomination = 0.1 ether;

    uint256 public nextLeafIdx = 0;
    mapping(uint256 => bool) public roots;
    mapping(uint8 => uint256) lastLevelHash;
    mapping(uint256 => bool) public nullifierHashes;
    mapping(uint256 => bool) public commitments;

    uint256[10] levelDefaults = [
        43065018154187539063777018851119131690841410786208203096522710181722557569902,
        68425793632866334468975467540350290237755001219736261609874477550703579915473,
        46042945905615891579799252509308425844628958041388189166378023118822466254876,
        62756872102361714780547143231448345743865855996238081774136358869777923796056,
        42176573197405444959800129519411617385251381156958256899995444868767659971415,
        25828237594002735290613335016843204300599765026577037301305532719071442469492,
        15018222623636846930423525740221711152541850041255793249200055516267372081504,
        44759065691639076482865444314850238487362451187578271852778335754880320508947,
        113794767920696908059030083174423717757783756841428183035496220319210875826998,
        63022822233813692222782733099666324844635227426133565857617079149654694123383
    ];

    constructor(
        address _hasher,
        address _verifier
    ){
        hasher = Hasher(_hasher);
         verifier = _verifier;
    }

    function signupFn(
        uint256 _commitment
    ) external nonReentrant returns (uint256 root) {
    // ) external nonReentrant returns (uint256, uint256[10] memory, uint8[10] memory) {
        
        require(!commitments[_commitment], "existing-commitment");
        require(nextLeafIdx < 2 ** treeLevel, "tree-full");

        uint256 newRoot;
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint256 currentIdx = nextLeafIdx;
        uint256 currentHash = _commitment;

        uint256 left;
        uint256 right;
        uint256[2] memory ins;

        console.log("---> _commitment = %s", _commitment);
        
        for(uint8 i = 0; i < treeLevel; i++){
            // lastLevelHash[i] = currentHash;

            if(currentIdx % 2 == 0){
                left = currentHash;
                right = levelDefaults[i];
                hashPairings[i] = levelDefaults[i];
                hashDirections[i] = 0;
            }else{
                left = lastLevelHash[i];
                right = currentHash;
                hashPairings[i] = lastLevelHash[i];
                hashDirections[i] = 1;
            }
            console.log(" level %d: left = %s, right = %s", i, left, right);
            // levelDefaults[i] = currentHash;
            lastLevelHash[i] = currentHash;

            ins[0] = left;
            ins[1] = right;

            (uint256 h) = hasher.MiMC5Sponge{ gas: 150000 }(ins, _commitment);

            currentHash = h;
            currentIdx = currentIdx / 2;
            console.log("------------>> level %d: currentHash = %s", i, currentHash);
        }

        newRoot = currentHash;
        roots[newRoot] = true;
        nextLeafIdx += 1;

        commitments[_commitment] = true;

        for (uint8 i = 0; i < 10; i++) {
            console.log("---> lastLevelHash[%d] = %s", i, lastLevelHash[i]);
        }

        // console.log("hash_directions = %s", hashDirections);
        for (uint256 i = 0; i < 10; i++) {
            console.log("hash_directions[%d] = %s", i, hashDirections[i]);
        }
        // console.log("hash_pairings = %s", hashPairings);
        for (uint256 i = 0; i < 10; i++) {
            console.log("hashPairings[%d] = %s", i, hashPairings[i]);
        }
        console.log("new root = %s", newRoot);

        emit SignupEvent(newRoot, hashPairings, hashDirections);
        // return (newRoot, hashPairings, hashDirections);
        return newRoot;
    }

    function loginFn(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external nonReentrant {
        uint256 _root = input[0];
        uint256 _nullifierHash = input[1];

        // require(!nullifierHashes[_nullifierHash], "nullifier already exists. Try another one.");  // not required as we are not solving double-spend problem
        require(roots[_root], "root does not exist");

        uint256 _addr = uint256(uint160(msg.sender));

        (bool verifyOK, ) = verifier.call(abi.encodeCall(IVerifier.verifyProof, (a, b, c, [_root, _nullifierHash, _addr])));

        if (verifyOK) {
            nullifierHashes[_nullifierHash] = true;
        }
        // require(verifyOK, "invalid proof provided");
        emit LoginEvent(msg.sender, _nullifierHash, verifyOK);
    }

}