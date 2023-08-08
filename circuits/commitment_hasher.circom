// circuit using Pedersen hash of two inputs
pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/pedersen.circom";

// commitment = commitment + nullifier 
template CommitmentHasher() {
    signal input secret[256];
    signal input nullifier[256];
    signal output commitment;
    signal output nullifierHash;

    component cHasher = Pedersen(512);
    component nHasher = Pedersen(256);

    for(var i = 0; i < 256; i++){
        cHasher.in[i] <== nullifier[i];
        cHasher.in[i + 256] <== secret[i];
        nHasher.in[i] <== nullifier[i];
    }

    commitment <== cHasher.out[0];
    nullifierHash <== nHasher.out[0];
}