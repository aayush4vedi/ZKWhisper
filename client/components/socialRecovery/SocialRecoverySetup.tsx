import React, { useState, useEffect } from "react"
import { BigNumber, ethers } from "ethers"
import { Interface } from "@ethersproject/abi"

import { writeContract, watchContractEvent } from "@wagmi/core"
import {
    useNetwork,
    useContractWrite,
    useAccount,
    usePrepareContractWrite,
    useWaitForTransaction,
} from "wagmi"
import JSZip from "jszip"

import {
    BN256ToBinUtil,
    GenerateRandomBinaryArray,
    StringTo256Binary,
    BNToDecimal,
    GenerateLongRandomNumbers,
    CreateShamirSecretPolynomial,
    EncryptWithKeccak256
} from "$u"

import { MerkleTree, MerkleProof, Share } from "@/lib/MerkleTree"
const wc = require("../../circuits/signup_js/witness_calculator")


const crypto = require("crypto")
import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
import ZKWHISPER_ADDRESS from "../../constants/addressMappings"
const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

const SocialRecoverySetup = () => {
    const [secretString, setSecretString] = useState("")
    const [N, setN] = useState(5) // total number of guardians
    const [K, setK] = useState(3) // recovery threshold

    // merkle tree props
    // share will be a list of [BigInt, BigInt, number]
    const [shares, setShares] = useState<Share[]>([])
    const [merkleRoot, setMerkleRoot] = useState<BigNumber | null>(null)
    const [merkleProofs, setMerkleProofs] = useState<MerkleProof[]>([])

    // circuit + onchain states
    const [merkleRootCommitment, setMerkleRootCommitment] = useState<string>("")
    const [merkleRootNullifier, setMerkleRootNullifier] = useState<string>("")
    const [merkleRootCommitmentHash, setMerkleRootCommitmentHash] = useState<string>("")
    const [merkleRootNullifierHash, setMerkleRootNullifierHash] = useState<string>("")
    
    const [gProofMerkleRoot, setGProofMerkleRoot] = useState(null)
    const [gProofHashPairings, setGProofHashPairings] = useState(null)
    const [gProofHashDirections, setGProofHashDirections] = useState(null)

    const handleCreateRandomMnemonic = () => {
        const _secret = GenerateLongRandomNumbers(256).toString(16)
        setSecretString(_secret)
        console.log(`-> secretString: ${_secret}`)
    }

    // TODO: refactor the monolith
    const handleSubmit = async (e) => {
        e.preventDefault()
        // check N has been set
        // if (N < 4) {
        //     alert("total number of guardians must be greater than 4")
        // }
        // if (K < 2) {
        //     alert("recovery threshold must be greater than 2")
        // }
        if (secretString.length < 1) {
            alert("secret string must be set")
        } else {
            // 1. compute <i,s_i> [n]
            console.log(`-> secretString: ${secretString}`)
            console.log(`-> N: ${N}`)
            console.log(`-> K: ${K}`)

            const shares = convertToShareList(CreateShamirSecretPolynomial(K, N, secretString))
            console.log(`====> shares: ${shares}`)

            // 2. compute merkle tree
            setShares(shares)
            // buildMerkleTree()
        }
    }

    useEffect(() => {
        console.log(`-> shares: ${shares}`)
        buildMerkleTree()
    }, [shares])
        

    const buildMerkleTree = () => {
        const merkleTree = new MerkleTree(shares)
        const root = merkleTree.getMerkleRoot()
        const proofs: MerkleProof[] = []

        for (let i = 0; i < shares.length; i++) {
            const proof = merkleTree.getMerkleProof(i)
            proofs.push(proof)
        }

        setMerkleRoot(root)
        console.log(`====> merkleRoot: ${root}`)
        console.log(`====> proofs: ${proofs}`)

        for (let i = 0; i < K; i++) {
            console.log(`xxxxx====> hashDirections for index ${proofs[i]?.hashDirections}`)
            console.log(`xxxxx====> hashPairings for index ${proofs[i]?.hashPairings}`)
        }
            // log all the values in proofs
            proofs.map((p, i) => {
                console.log("............... printing poorf at index = ", i)
                p.hashDirections.forEach((d, j) => {
                    console.log(`====> hashDirection: ${d}`)
                })
                p.hashPairings.forEach((hp, j) => {
                    console.log(`====> hashPairing: ${hp}`)
                })
                console.log("..........................................................")
            })
        setMerkleProofs(proofs)
    }

    const convertToShareList = (originalList: [BigInt, BigInt, number][]): Share[] => {
        return originalList.map(([share_x, share_y, index]) => ({
            share_x: BigNumber.from(share_x),
            share_y: BigNumber.from(share_y),
            index,
        }))
    }

    const verifyProofs = () => {
        const merkleTree = new MerkleTree(shares)
        const isVerified = merkleTree.verifyProofs(merkleRoot, merkleProofs)
        console.log(`====> isVerified: ${isVerified}`)
    }

    // register proof on chain: ZKWhisper.registerProof() ===================
    // 1. create hash of gRoot using same circuit
    const registerRecovery = async () => {
        if (merkleRoot) {
            setMerkleRootCommitment(merkleRoot.toString())
            const i_nulli = BigNumber.from(ethers.utils.randomBytes(32)).toString()

            const input = {
                secret: BN256ToBinUtil(merkleRoot.toString()).split(""),
                nullifier: BN256ToBinUtil(i_nulli).split(""),
            }

            console.log("input : ", input)

            let depositWC: any = await fetch("/signup.wasm")
                .then((res) => res.arrayBuffer())
                .then((buff) => Buffer.from(buff))
                .then((res) => wc(res))

            const r = await depositWC.calculateWitness(input, 0)
            const i_comm_hash = r[1]
            const i_nulli_hash = r[2]

            setMerkleRootCommitmentHash(i_comm_hash)
            setMerkleRootNullifierHash(i_nulli_hash)

            console.log("i_comm_hash : ", i_comm_hash)
            console.log("i_nulli_hash : ", i_nulli_hash)
        }
    }

    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        address: ZKWHISPER_ADDRESS,
        abi: ZKWHISPER_ABI,
        functionName: "registerRecoveryFn",
        args: [merkleRootCommitmentHash],
        onError() {
            console.log("there was an error in calling signup contract")
        },
    })
    const { data, write } = useContractWrite(config)

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    })

    useEffect(() => {
        if (data && data.hash) {
            fetchRegisterRecoveryEvent(data.hash)
        }
    }, [data])

    const fetchRegisterRecoveryEvent = async (txHash: string) => {
        console.log("=================> fetchRegisterRecoveryEvent with txHash = ", txHash)
        const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
        })
        console.log("=================> fetchRegisterRecoveryEvent receipt: ", receipt)

        const log = receipt.logs[0]
        console.log(">log : ", log)

        const decodedData = zkWhisperInterface.decodeEventLog("RegisterRecoveryEvent", log.data, log.topics)
        console.log(">decodedData : ", decodedData)

        const { root, hashPairings, hashDirections } = decodedData
        console.log("===============>root : ", root)
        console.log("===============>hashPairings : ", BNToDecimal(hashPairings))
        console.log("===============>hashDirections : ", hashDirections)
        
        setGProofMerkleRoot(root)
        setGProofHashPairings(BNToDecimal(hashPairings))
        setGProofHashDirections(hashDirections)
    }   

    // download guardian shares
    const downloadShares = () => {
        console.log(`---------------[download shares] gProofMerkleRoot = ${gProofMerkleRoot}`)        
        console.log(`---------------[download shares] gProofHashPairings = ${gProofHashPairings}`)            
        console.log(`---------------[download shares] gProofHashDirections = ${gProofHashDirections}`)        
        console.log('............................ about to download shares ............................')
        const zip = new JSZip()
        for (let i = 0; i < K; i++) {
            const gShare = {
                guardianIdx: i,
                guardianShares: shares[i],
                guardianHashPairings: merkleProofs[i].hashPairings,
                guardianHashDirections: merkleProofs[i].hashDirections,
                guardianMerkleRoot: merkleRoot,
                hashSecretString: EncryptWithKeccak256(secretString),
                gProofMerkleRoot: gProofMerkleRoot,
                gProofHashPairings: gProofHashPairings,
                gProofHashDirections: gProofHashDirections
            }

            console.log(`---------------[download shares] gShare = ${gShare}`)

            zip.file(`guardian_recovery_share_${i + 1}.json`, JSON.stringify(gShare))
        }
        zip.generateAsync({ type: "blob" }).then((content) => {
            const link = document.createElement("a")
            link.href = URL.createObjectURL(content)
            link.download = "social_recovery_shares.zip"
            link.click()
        })
    }


    return (
        <>
            {gProofMerkleRoot && gProofHashPairings && gProofHashDirections && (
                <div className="flex flex-col items-center justify-center py-5">
                    <h3 className="text-2xl font-bold">
                        Download Your Social Recovery Guardian Shares
                    </h3>
                    <p></p>
                    <button
                        className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                        onClick={downloadShares}
                    >
                        Download
                    </button>
                </div>
            )}
            {!merkleRoot && (
                <div className="flex flex-col items-center justify-center py-5">
                    <h1 className="text-5xl font-bold">Social Recovery Setup</h1>
                    <p className="my-2 text-xl">Setup your social recovery</p>
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex flex-col items-left">
                            <label className="my-2 text-xl">Your Secret</label>
                            <textarea
                                className="w-96 h-48 px-3 mb-3 placeholder-gray-500 border rounded-lg text-xs focus:shadow-outline"
                                placeholder="Your Secret"
                                value={secretString}
                                onChange={(e) => setSecretString(e.target.value)}
                            />
                            <button
                                className="bg-amber-400 text-white text-xs px-4 py-1 rounded mt-2 mb-4"
                                onClick={handleCreateRandomMnemonic}
                            >
                                Create Random Mnemonic
                            </button>
                        </div>
                        <label className="my-2 text-xl">Number of Guardians</label>
                        <input
                            className="w-96 h-12 px-3 mb-3 placeholder-gray-500 border rounded-lg focus:shadow-outline"
                            placeholder="Number of Guardians"
                            value={N}
                            onChange={(e) => setN(e.target.value)}
                            min={4} // force ensure N is never less than 2
                        />
                        <label className="my-2 text-xl">Recovery Threshold</label>
                        <input
                            className="w-96 h-12 px-3 mb-3 placeholder-gray-500 border rounded-lg focus:shadow-outline"
                            placeholder="Recover Threshold"
                            value={K}
                            onChange={(e) => setK(e.target.value)}
                            min={2} // force ensure K is never less than 1
                        />
                        <button
                            className="w-96 h-12 px-3 mb-3 text-xl font-bold text-white bg-blue-500 rounded-lg focus:shadow-outline"
                            type="submit"
                            onClick={handleSubmit}
                        >
                            1. Generate Shares
                        </button>
                    </div>
                </div>
            )}
            {merkleRoot && !gProofMerkleRoot && (
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl font-bold mb-4">Social Recovery Setup Complete</h1>
                    <p className="text-md mb-2">
                        k: {K}, n: {N}
                    </p>
                    <p className="text-md mb-2">Merkle Root: {merkleRoot.toHexString()}</p>

                    <div className="flex flex-col items-center my-4">
                        {/* {merkleProofs?.slice(0, K)?.map((proof, index) => ( */}
                        {merkleProofs?.map((proof, index) => (
                            <div key={index} className="my-4">
                                <p className="text-lg font-semibold">
                                    Merkle Proof for Share at index {index}:
                                </p>
                                <ul>
                                    {proof.hashDirections.map((direction, idx) => (
                                        <li key={idx} className="ml-4">
                                            Direction: {direction}
                                        </li>
                                    ))}
                                    {proof.hashPairings.map((hash, idx) => (
                                        <li key={idx} className="ml-4">
                                            Hash: {hash.toString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <button
                            className="w-96 h-12 px-3 mb-3 text-xl font-bold text-white bg-blue-500 rounded-lg focus:shadow-outline"
                            type="submit"
                            onClick={registerRecovery}
                        >
                            2. Generate Proofs
                        </button>
                        <button
                            className="w-96 h-12 px-3 mb-3 text-xl font-bold text-white bg-black rounded-lg focus:shadow-outline"
                            type="submit"
                            onClick={() => write?.()}
                            disabled={!write}
                        >
                            3. Send Proof To Contract
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default SocialRecoverySetup
