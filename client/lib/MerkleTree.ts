import { BigNumber, utils } from "ethers"

export interface Share {
    share_x: BigNumber
    share_y: BigNumber
    index: number
}

export interface MerkleProof {
    hashDirections: number[]
    hashPairings: BigNumber[]
}

export class MerkleTree {
    private readonly shares: Share[]
    private readonly size: number
    private nodes: BigNumber[] = []
    private readonly proof: MerkleProof[] = []

    constructor(shares: Share[]) {
        this.shares = shares
        this.size = MerkleTree.nextPowerOf2(this.shares.length)

        this.buildTree()
    }

    private static nextPowerOf2(n: number): number {
        return Math.pow(2, Math.ceil(Math.log2(n)))
    }

    private buildTree() {
        this.padShares()
        this.initializeNodes()
        this.calculateProofs()
    }

    private padShares() {
        console.log("...................called padShares()...................")
        const lastShare = this.shares[this.shares.length - 1]
        while (this.shares.length < this.size) {
            this.shares.push(lastShare)
        }
    }

    private initializeNodes() {
        console.log("...................called initializeNodes()...................")
        const newNodes = this.shares.map(({ share_x, share_y }) => {
            const shareX = Buffer.from(share_x.toHexString().slice(2), "hex")
            const shareY = Buffer.from(share_y.toHexString().slice(2), "hex")

            const packedData = utils.concat([shareX, shareY])
            const hash = utils.keccak256(packedData)

            return BigNumber.from(hash)
        })
        this.nodes = newNodes
    }

    private calculateProofs() {
        console.log("...................called calculateProofs()...................")
        
        // Build the full merkle tree
        for (let i = this.size - 1; i > 0; i -= 2) {
            this.nodes[(i - 1) >> 1] = BigNumber.from(
                utils.keccak256(
                    utils.solidityPack(["bytes32", "bytes32"], [this.nodes[i], this.nodes[i - 1]])
                )
            )
        }

        // Calculate proofs for each leaf
        this.shares.forEach(({ index }) => {
            const hashDirections: number[] = []
            const hashPairings: BigNumber[] = []

            let i = index + this.size - 1 // Start from the leaf's position in the full tree
            while (i > 0) {
                const parentIndex = (i - 1) >> 1
                hashDirections.push((i % 2)^1) // 0: left, 1: right
                hashPairings.push(this.nodes[parentIndex])
                i = parentIndex
            }

            this.proof.push({ hashDirections, hashPairings}) // Reverse the hashPairings array as we built it from leaf to root
        })
    }

    getMerkleRoot(): BigNumber {
        return this.nodes[0]
    }

    getMerkleProof(index: number): MerkleProof {
        return this.proof[index]
    }

    verifyProofs(merkleRoot: BigNumber, proofs: MerkleProof[]): boolean {
        const numLeaves = this.shares.length

        const reconstructedTree = new MerkleTree(this.shares)
        const reconstructedRoot = reconstructedTree.getMerkleRoot()

        return merkleRoot.eq(reconstructedRoot)
    }
}

export function calculateMerkleRootFromProofValues(
    index: number,
    share: Share,
    hashPairings: BigNumber[],
    hashDirections: number[]
): BigNumber {
    // reverse hashPairings and hashDirections
    hashPairings = hashPairings.reverse()
    hashDirections = hashDirections.reverse()

    // Calculate the current hash
    let currentHash = hashAShare(share)

    // Iterate over hashPairings and hashDirections and update the current hash
    for (let i = 0; i < hashPairings.length; i++) {
        const siblingHash = hashPairings[i]
        const direction = hashDirections[i]

        if (direction === 0) {
            const combinedBytes = utils.concat([currentHashBytes, utils.arrayify(siblingHash)])
            currentHash = BigNumber.from(utils.keccak256(combinedBytes))
        } else {
            currentHash = utils.keccak256(
                utils.solidityPack(["bytes32", "bytes32"], [siblingHash, currentHash])
            )
        }
    }

    return currentHash
}


// utils ================================

function convertToShare(extractedShare: any): Share {
    return {
        share_x: BigNumber.from(extractedShare.share_x),
        share_y: BigNumber.from(extractedShare.share_y),
        index: extractedShare.index,
    }
}

function hashAShare(share: Share): BigInt {
    share = convertToShare(share)
    const shareX = Buffer.from(share.share_x.toHexString().slice(2), "hex")
    const shareY = Buffer.from(share.share_y.toHexString().slice(2), "hex")

    const packedData = utils.concat([shareX, shareY])
    const hash = utils.keccak256(packedData)

    return BigNumber.from(hash)
}