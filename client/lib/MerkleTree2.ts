// import { BigNumber, utils } from "ethers"

const { BigNumber, utils } = require("ethers")


class VerifyMerkleProof {
    verify(proof: BigNumber[], root: BigNumber, leaf: BigNumber, index: number): boolean {
        let hash = leaf

        for (let i = 0; i < proof.length; i++) {
            const proofElement = proof[i]

            if (index % 2 === 0) {
                hash = BigNumber.from(utils.keccak256(
                    utils.solidityPack(["bytes32", "bytes32"], [hash, proofElement]))
                )
            } else {
                hash = BigNumber.from(utils.keccak256(
                    utils.solidityPack(["bytes32", "bytes32"], [proofElement, hash]))
                )
            }

            index = Math.floor(index / 2)
        }

        return hash.eq(root)
    }
}

class MerkleProofBuilder {
    private hashes: BigNumber[] = []
    private proof: BigNumber[][] = []

    constructor(data: string[]) {
        data.forEach((d) => {
            const hash = hashString(d)
            this.hashes.push(hash)
            this.proof.push([hash])
        })

        let n = data.length
        let offset = 0

        while (n > 0) {
            for (let i = 0; i < n - 1; i += 2) {
                const combinedHash = BigNumber.from(utils.keccak256(
                    utils.solidityPack(
                        ["bytes32", "bytes32"],
                        [this.hashes[offset + i], this.hashes[offset + i + 1]]
                    ))
                )
                this.hashes.push(combinedHash)
            }
            offset += n
            n = Math.floor(n / 2)
        }
    }

    getRoot(): BigNumber {
        return this.hashes[this.hashes.length - 1]
    }

    getProof(index: number): BigNumber[] {
        return this.proof[index]
    }
}

// Utility function to hash a transaction
function hashString(data: string): BigNumber {
    const dataHash = utils.keccak256(utils.toUtf8Bytes(data))
    return BigNumber.from(dataHash)
}


// Testing the Merkle Proof Builder
const data = ["alice -> bob", "bob -> dave", "carol -> alice", "dave -> bob", "eve -> mallory"];
const merkleTree = new MerkleProofBuilder(data);

for (let i = 0; i < data.length; i++) {
    const root = merkleTree.getRoot();
    const proof = merkleTree.getProof(i);
    const leaf = hashString(data[i]);

    const verifier = new VerifyMerkleProof();
    const isValid = verifier.verify(proof, root, leaf, i);

    console.log(`Index ${i}: Proof Valid? ${isValid}`);
}