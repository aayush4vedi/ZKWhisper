pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/bitify.circom";
include "./node_modules/circomlib/circuits/poseidon.circom";

// hash two subnodes into a parent node
template Hash2Nodes() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = MiMCSponge(2, 20, 1);
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;
    hasher.k <== 0;
    hash <== hasher.outs[0];

    // signal input left;
    // signal input right;
    // signal output hash;

    // component poseidon = Poseidon(2);
    // poseidon.inputs[0] <== left;
    // poseidon.inputs[1] <== right;
    // hash <== poseidon.out;
}

// if s == 0 returns [in[0], in[1]]
// if s == 1 returns [in[1], in[0]]
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}