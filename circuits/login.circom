pragma circom 2.0.6;

// include "./commitment_hasher.circom";
// include "./node_modules/circomlib/circuits/mimcsponge.circom";
// include "./node_modules/circomlib/circuits/poseidon.circom";
// include "./common.circom";

include "./utils/mimc5sponge.circom";
include "./commitment_hasher.circom";

template Login() {
    signal input root;
    signal input nullifierHash;
    signal input commitmentHash;
    signal input recipient;

    signal input secret[256];
    signal input nullifier[256];
    signal input hashPairings[10];
    signal input hashDirections[10];

    // check if the public variable (submitted) nullifierHash is equal to the output 
    // from hashing secret and nullifier
    component cHasher = CommitmentHasher();
    for (var i = 0; i < 256; i++) {
        cHasher.secret[i] <== secret[i];
        cHasher.nullifier[i] <== nullifier[i];
    }
    log(" >>> cHasher.nullifierHash ", cHasher.nullifierHash);
    log(" >>> nullifierHash ", nullifierHash);

    cHasher.nullifierHash === nullifierHash;
    cHasher.commitment === commitmentHash;

    for(var i = 0; i < 10; i++){
        log("---<> hashPairings[", i, "] = ", hashPairings[i]);
    }

    // checking merkle tree hash path
    component leafHashers[10];
    // component selectors[10];

    signal currentHash[10 + 1];
    currentHash[0] <== cHasher.commitment;

    signal left[10];
    signal right[10];

    for(var i = 0; i < 10; i++){
        var d = hashDirections[i];

        // leafHashers[i] = MiMCSponge(2,20,1);
        leafHashers[i] = MiMC5Sponge(2);

        left[i] <== (1 - d) * currentHash[i];
        leafHashers[i].ins[0] <== left[i] + d * hashPairings[i];

        right[i] <== d * currentHash[i];
        leafHashers[i].ins[1] <== right[i] + (1 - d) * hashPairings[i];

        leafHashers[i].k <== cHasher.commitment;
        // currentHash[i + 1] <== leafHashers[i].outs[0];
        currentHash[i + 1] <== leafHashers[i].o;

        log(" >>> level =  ", i,  " about to hash left =  : ", leafHashers[i].ins[0], " and right = ", leafHashers[i].ins[1]);
        log(" ------------>>> level =  ", i,  "  currentHash[i + 1]  : ", currentHash[i + 1]);


        // leafHashers[i] = Poseidon(2);

        // left[i] <== (1 - d) * currentHash[i];
        // leafHashers[i].inputs[0] <== left[i] + d * hashPairings[i];

        // right[i] <== d * currentHash[i];
        // leafHashers[i].inputs[1] <== right[i] + (1 - d) * hashPairings[i];

        // currentHash[i + 1] <== leafHashers[i].out;

        // selectors[i] = DualMux();
        // selectors[i].in[0] <== i == 0 ? cHasher.commitment : leafHashers[i - 1].hash;
        // selectors[i].in[1] <== hashPairings[i];
        // selectors[i].s <== hashDirections[i];

        // leafHashers[i] = Hash2Nodes();
        // leafHashers[i].left <== selectors[i].out[0];
        // leafHashers[i].right <== selectors[i].out[1];
    }

    log("-------------- >>> expected root =  ",root);
    log("-------------- >>> currentHash[10] =  ",currentHash[10]);

    // root === leafHashers[9].hash;
    root === currentHash[10];

    signal recipientSquare;
    recipientSquare <== recipient * recipient;
}

component main{public [root, nullifierHash, recipient]} = Login();