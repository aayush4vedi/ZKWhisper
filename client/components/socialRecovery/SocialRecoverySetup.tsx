import React, { useState, useEffect } from "react"
import { BigNumber, ethers } from "ethers"
import { Interface } from "@ethersproject/abi"
import { FiCopy } from "react-icons/fi"

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
    EncryptWithKeccak256,
    HashPair,
    ConvertBigHexStringToBigInt,
    GetShamirSecertShares,
    SimpleshFunction
} from "$u"
import { MerkleTree } from "merkletreejs"
import { createHash } from "crypto"
const SHA256 = require("crypto-js/sha256")

const { split, join } = require("shamir")
const { randomBytes } = require("crypto")

import { useAtom } from "jotai"
import { zkWhisperAccountAddressAtom,zkWhisperAccountPrivKeyAtom, zkWhisperAccountMnemonicAtom } from "../../state/atom"


const wc = require("../../circuits/signup_js/witness_calculator")

const crypto = require("crypto")
import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
import ZKWHISPER_ADDRESS from "../../constants/addressMappings"
const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

const SocialRecoverySetup = () => {

    const [copied, setCopied] = useState(false)

    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 200) // Reset 'copied' state after 2 seconds
        })
    }

    const [walletAddressPrivKey, setWalletAddressPrivKey] = useAtom(zkWhisperAccountPrivKeyAtom)
    const [walletMnemoic, setWalletMnemoic] = useAtom(zkWhisperAccountMnemonicAtom)

    const [zkWhisperAccountAddress, setZkWhisperAccountAddress] = useAtom(
        zkWhisperAccountAddressAtom
    )

    const [secretString, setSecretString] = useState(walletAddressPrivKey)
    const [N, setN] = useState(5) // total number of guardians
    const [K, setK] = useState(3) // recovery threshold

    // merkle tree props
    // share will be a list of [BigInt, BigInt] i.e. share_x, share_y
    // const [shares, setShares] = useState<[BigNumber, BigNumber][]>([])
    const [shares, setShares] =useState(null)
    const [merkleRoot, setMerkleRoot] = useState<string | null>(null)
    const [merkleProofs, setMerkleProofs] = useState<any>([])

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

            const _shares = GetShamirSecertShares(N,K,secretString)
            // const _shares = GetShamirSecertShares(N,K,"secret")
            console.log(`====> shares: ${JSON.stringify(_shares)}`)
            
            setShares(_shares)
        }
    }




    useEffect(() => {
        console.log(`----> shares: ${shares}`)
        buildMerkleTree()
    }, [shares])

    const buildMerkleTree = () => {

        // const hashedLeaves = ["a", "b", "c"].map((x) => SHA256(x))
        // const hashedLeaves = shares.map((pair) => {
        //     const combined = pair[0].toString() + pair[1].toString();
        //     return SHA256(combined);
        // })
        if (!shares) {
            console.log(`-> shares not set`)
            return
        }
        const hashedLeaves = shares.map(SimpleshFunction)
        console.log(`====> hashedLeaves: ${hashedLeaves}`)

        const tree = new MerkleTree(hashedLeaves, SHA256)
        console.log(tree.toString())

        const root = tree.getRoot().toString("hex")
        setMerkleRoot(root)

        const proofs: any[] = []

        hashedLeaves.map((h, i) => {
            const proof = tree.getProof(h)
            // console.log(`==============> i: ${i}      ........ proof: ${JSON.stringify(proof)}`)
            proofs.push(proof)
        })
        console.log(`=================> proofs[0]: ${JSON.stringify(proofs[0])}`)
        setMerkleProofs(proofs)
    }

    // register proof on chain: ZKWhisper.registerProof() ===================
    // 1. create hash of gRoot using same circuit
    const registerRecovery = async () => {
        if (merkleRoot) {
            // setMerkleRootCommitment(merkleRoot)
            const i_nulli = BigNumber.from(ethers.utils.randomBytes(32)).toString()
            console.log(`i_nulli: ${i_nulli}`)
            setMerkleRootNullifier(i_nulli)

            const i_comm = BigNumber.from(ethers.utils.randomBytes(32)).toString()
            setMerkleRootCommitment(i_comm)
            
            const sanitizedHexString = merkleRoot.replace(/^0+/g, "") // Remove leading zeros
            const bigIntValue = BigInt("0x" + sanitizedHexString);
            console.log(`bigIntValue: ${bigIntValue}`)
            // console.log(`i_merkleRoot: ${BigInt(merkleRoot)}`)

            const input = {
                secret: BN256ToBinUtil(i_comm).split(""), //slicing because it could be too big
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

        const decodedData = zkWhisperInterface.decodeEventLog(
            "RegisterRecoveryEvent",
            log.data,
            log.topics
        )
        console.log(">decodedData : ", decodedData)

        const { root, hashPairings, hashDirections } = decodedData
        console.log("===============>root : ", root)
        console.log("===============>hashPairings : ", BNToDecimal(hashPairings))
        console.log("===============>hashDirections : ", hashDirections)

        setGProofMerkleRoot(BNToDecimal(root))
        setGProofHashPairings(BNToDecimal(hashPairings))
        setGProofHashDirections(hashDirections)
    }

    // download guardian shares
    const downloadShares = () => {
        console.log(`---------------[download shares] gProofMerkleRoot = ${gProofMerkleRoot}`)
        console.log(`---------------[download shares] gProofHashPairings = ${gProofHashPairings}`)
        console.log(`--------[download shares] gProofHashDirections = ${gProofHashDirections}`)
        console.log("................. about to download shares ............................")

        const zip = new JSZip()
        for (let i = 0; i < N; i++) {
            const uniqueValue = Math.floor(Math.random() * 1000000) // Generate a unique value
            const gShare = {
                guardianIdx: i,
                guardianShares: shares[i], // index is shifted to right by 1
                guardianMerkleProof: merkleProofs[i],
                guardianMerkleRoot: merkleRoot,
                hashSecretString: EncryptWithKeccak256(secretString),
                gProofMerkleRoot: gProofMerkleRoot,
                merkleRootNullifier: merkleRootNullifier,
                merkleRootNullifierHash: `${merkleRootNullifierHash}`,
                merkleRootCommitment: merkleRootCommitment,
                merkleRootCommitmentHash: `${merkleRootCommitmentHash}`,
                gProofHashPairings: gProofHashPairings,
                gProofHashDirections: gProofHashDirections,
            }

            console.log(`---------------[download shares] gShare = ${gShare}`)

            const jsonString = JSON.stringify(gShare, null, 2)
            const hexString = Buffer.from(jsonString, "utf-8").toString("hex")
            zip.file(`guardian_recovery_share_${uniqueValue}_${i + 1}.json`, hexString)
        }

        zip.generateAsync({ type: "blob" }).then((content) => {
            const link = document.createElement("a")
            link.href = URL.createObjectURL(content)
            link.download = "social_recovery_shares.zip"
            link.click()
        })
    }

    return (
        <div className="flex flex-col items-center justify-center py-5">
            {!zkWhisperAccountAddress && (
                <h3 className="text-2xl font-bold">
                    You Must Be logged in To Setup Social recovery
                </h3>
            )}
            {zkWhisperAccountAddress && (
                <div className="flex flex-col items-left justify-center py-5">
                    <div className="flex items-center mt-4 text-xs">
                        <p className="font-mono"><strong> Your Account Address: </strong>{zkWhisperAccountAddress}</p>
                        <button
                            onClick={() => copyToClipboard(zkWhisperAccountAddress)}
                            className="flex items-center"
                        >
                            <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                        </button>
                    </div>
                    <div className="flex items-center mt-1 text-xs">
                        <p className="font-mono"><strong> Wallet Private Key: </strong>{walletAddressPrivKey}</p>
                        <button
                            onClick={() => copyToClipboard(walletAddressPrivKey)}
                            className="flex items-center"
                        >
                            <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                        </button>
                    </div>
                    <div className="flex items-center mt-1 text-xs">
                        <p className="font-mono"><strong> Wallet walletMnemoic: </strong>{walletMnemoic}</p>
                        <button
                            onClick={() => copyToClipboard(walletMnemoic)}
                            className="flex items-center"
                        >
                            <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                        </button>
                    </div>
                    {gProofMerkleRoot && gProofHashPairings && gProofHashDirections && (
                        <div className="flex flex-col items-center justify-center py-5">
                            <h3 className="text-2xl font-bold">
                                Download Your Social Recovery Guardian Shares
                            </h3>
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
                                    <label className="my-2 text-xl">
                                        Your Secret (paste any: mnemoic or privateKey)
                                    </label>
                                    <textarea
                                        className="w-100 h-16 px-3 mb-3 placeholder-gray-500 border rounded-lg text-xs focus:shadow-outline"
                                        placeholder="Your Secret"
                                        value={secretString}
                                        onChange={(e) => setSecretString(e.target.value)}
                                    />
                                    {/* <button
                                        className="bg-amber-400 text-white text-xs px-4 py-1 rounded mt-2 mb-4"
                                        onClick={handleCreateRandomMnemonic}
                                    >
                                        Create Random Mnemonic
                                    </button> */}
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
                            <h1 className="text-3xl font-bold mb-4">
                                Social Recovery Setup Complete
                            </h1>
                            <p className="text-md mb-2">
                                k: {K}, n: {N}
                            </p>
                            <p className="text-md mb-2">Merkle Root: {merkleRoot}</p>

                            <div className="flex flex-col items-center my-4">
                                {/* MerkleProofs: {JSON.stringify(merkleProofs)} */}
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
                </div>
            )}
        </div>
    )
}

export default SocialRecoverySetup


/**
 * 
 * ====> shares: [
 * {"1":{"0":167,"1":47,"2":212,"3":228,"4":164,"5":78}},
 * {"2":{"0":253,"1":84,"2":180,"3":43,"4":180,"5":189}},
 * {"3":{"0":41,"1":30,"2":3,"3":189,"4":117,"5":135}},
 * {"4":{"0":128,"1":165,"2":104,"3":99,"4":231,"5":63}},
 * {"5":{"0":84,"1":239,"2":223,"3":245,"4":38,"5":5}}]
 * 
 * 
 */