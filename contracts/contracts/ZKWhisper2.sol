// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MiMCSponge.sol";
import "./interface/IVerifier.sol";
import "hardhat/console.sol"; //TODO: to be deleted later

contract ZKWhisper2 is ReentrancyGuard {
    event SignupEvent(uint256 root, uint256[10] hashPairings, uint8[10] hashDirections);
    event LoginEvent(address account, uint256 nullifierHash, bool verifyOK);

    event RegisterRecoveryEvent(uint256 root, uint256[10] hashPairings, uint8[10] hashDirections);
    event ExecuteRecoveryEvent(address account, uint256 nullifierHash, bool verifyOK);

    address verifier;
    Hasher hasher;

    uint8 public treeLevel = 10;

    uint256 public nextLeafIdxUser = 0;
    uint256 public nextLeafIdxRecovery = 0;

    mapping(uint256 => bool) public rootsUser;
    mapping(uint256 => bool) public rootsRecovery;

    mapping(uint8 => uint256) lastLevelHashUser;
    mapping(uint8 => uint256) lastLevelHashRecovery;

    mapping(uint256 => bool) public nullifierHashesUser;
    mapping(uint256 => bool) public nullifierHashesRecovery; // a recovery has been executed. prevent execution again

    mapping(uint256 => bool) public commitmentsUser;
    mapping(uint256 => bool) public commitmentsRecovery;

    uint256[10] levelDefaultsUser = [
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

    uint256[10] levelDefaultsRegistry = [
        76542092172934361868051116216691068155641744511711597607362902768902102014418,
        100445303654866496836696793405630004662905777594368761582430551671026137874542,
        32431974722574587763921232481902919034223737079077406744937268757427514044321,
        3943353351818081750430846205531568881176803617396588354930691922306207789942,
        83047524184678387299561910901426239233831088092602725404459302610901225720022,
        15123719696479293159382316117466258459057300135648412593915541245450726756597,
        8033298326397687204770719879804291387630376077455697958055714308021480725719,
        107093821753870093019064229447334263066705823148146353894877836901796682752586,
        35663805015556678129718874206614666581501884259664906995885629670747801603222,
        84471174696199327694264315103281449774380640817857198224219237805210461810244
    ];

    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor(address _hasher, address _verifier) {
        hasher = Hasher(_hasher);
        verifier = _verifier;
        owner = msg.sender;
        console.log("==================---> owner = %s", owner);
    }

    function signupFn(uint256 _commitment) external nonReentrant returns (uint256 root) {
        // ) external nonReentrant returns (uint256, uint256[10] memory, uint8[10] memory) {

        require(!commitmentsUser[_commitment], "existing-commitment");
        require(nextLeafIdxUser < 2 ** treeLevel, "tree-full");

        uint256 newRoot;
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint256 currentIdx = nextLeafIdxUser;
        uint256 currentHash = _commitment;

        uint256 left;
        uint256 right;
        uint256[2] memory ins;

        console.log("---> _commitment = %s", _commitment);

        for (uint8 i = 0; i < treeLevel; i++) {
            if (currentIdx % 2 == 0) {
                left = currentHash;
                right = levelDefaultsUser[i];
                hashPairings[i] = levelDefaultsUser[i];
                hashDirections[i] = 0;
            } else {
                left = lastLevelHashUser[i];
                right = currentHash;
                hashPairings[i] = lastLevelHashUser[i];
                hashDirections[i] = 1;
            }
            console.log(" level %d: left = %s, right = %s", i, left, right);
            lastLevelHashUser[i] = currentHash;

            ins[0] = left;
            ins[1] = right;

            uint256 h = hasher.MiMC5Sponge{gas: 150000}(ins, _commitment);

            currentHash = h;
            currentIdx = currentIdx / 2;
            console.log("------------>> level %d: currentHash = %s", i, currentHash);
        }

        newRoot = currentHash;
        rootsUser[newRoot] = true;
        nextLeafIdxUser += 1;

        commitmentsUser[_commitment] = true;

        for (uint8 i = 0; i < 10; i++) {
            console.log("---> lastLevelHash[%d] = %s", i, lastLevelHashUser[i]);
        }

        for (uint256 i = 0; i < 10; i++) {
            console.log("hash_directions[%d] = %s", i, hashDirections[i]);
        }
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
        require(rootsUser[_root], "root does not exist");

        uint256 _addr = uint256(uint160(msg.sender));

        (bool verifyOK, ) = verifier.call(
            abi.encodeCall(IVerifier.verifyProof, (a, b, c, [_root, _nullifierHash, _addr]))
        );

        if (verifyOK) {
            nullifierHashesUser[_nullifierHash] = true;
        }
        // require(verifyOK, "invalid proof provided");
        emit LoginEvent(msg.sender, _nullifierHash, verifyOK);
    }

    function registerRecoveryFn(uint256 _commitment) external nonReentrant returns (uint256 root) {
        // ) external nonReentrant returns (uint256, uint256[10] memory, uint8[10] memory) {

        require(!commitmentsRecovery[_commitment], "existing-commitment");
        require(nextLeafIdxRecovery < 2 ** treeLevel, "tree-full");

        uint256 newRoot;
        uint256[10] memory hashPairings;
        uint8[10] memory hashDirections;

        uint256 currentIdx = nextLeafIdxRecovery;
        uint256 currentHash = _commitment;

        uint256 left;
        uint256 right;
        uint256[2] memory ins;

        console.log("---> _commitment = %s", _commitment);

        for (uint8 i = 0; i < treeLevel; i++) {
            if (currentIdx % 2 == 0) {
                left = currentHash;
                right = levelDefaultsRegistry[i];
                hashPairings[i] = levelDefaultsRegistry[i];
                hashDirections[i] = 0;
            } else {
                left = lastLevelHashRecovery[i];
                right = currentHash;
                hashPairings[i] = lastLevelHashRecovery[i];
                hashDirections[i] = 1;
            }
            console.log(" level %d: left = %s, right = %s", i, left, right);
            lastLevelHashRecovery[i] = currentHash;

            ins[0] = left;
            ins[1] = right;

            uint256 h = hasher.MiMC5Sponge{gas: 150000}(ins, _commitment);

            currentHash = h;
            currentIdx = currentIdx / 2;
            console.log("------------>> level %d: currentHash = %s", i, currentHash);
        }

        newRoot = currentHash;
        rootsRecovery[newRoot] = true;
        nextLeafIdxRecovery += 1;

        commitmentsRecovery[_commitment] = true;

        for (uint8 i = 0; i < 10; i++) {
            console.log("---> lastLevelHash[%d] = %s", i, lastLevelHashRecovery[i]);
        }

        for (uint256 i = 0; i < 10; i++) {
            console.log("hash_directions[%d] = %s", i, hashDirections[i]);
        }
        for (uint256 i = 0; i < 10; i++) {
            console.log("hashPairings[%d] = %s", i, hashPairings[i]);
        }
        console.log("new root = %s", newRoot);

        emit RegisterRecoveryEvent(newRoot, hashPairings, hashDirections);
        // return (newRoot, hashPairings, hashDirections);
        return newRoot;
    }

    function executeRecoveryFn(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external nonReentrant {
        uint256 _root = input[0];
        uint256 _nullifierHash = input[1];

        require(
            !nullifierHashesRecovery[_nullifierHash],
            "A recovery has already been made with this nullifier. Try another one."
        );
        require(rootsRecovery[_root], "root does not exist");

        uint256 _addr = uint256(uint160(msg.sender));

        (bool verifyOK, ) = verifier.call(
            abi.encodeCall(IVerifier.verifyProof, (a, b, c, [_root, _nullifierHash, _addr]))
        );

        // if (verifyOK) {
        //     nullifierHashesRecovery[_nullifierHash] = true;

        //     uint256 balance = from.balance;
        //     require(balance > 0, "Source address has no assets to transfer");
        //     // Transfer all assets from 'from' to 'to'
        //     (bool success, bytes memory data) = to.call{value: balance}("");
            
        //     // console.log("==================---> data = %s", data);
        //     console.log("==================---> success = %s", success);
        //     require(success, "Transfer failed");
        // }
        
        require(verifyOK, "invalid proof provided");

        emit ExecuteRecoveryEvent(msg.sender, _nullifierHash, verifyOK);
    }
}
