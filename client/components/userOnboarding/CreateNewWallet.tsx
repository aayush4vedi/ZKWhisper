import React, { useState, useEffect } from "react"
import { BigNumber, ethers } from "ethers"
import * as bip39 from "bip39"
import { FiCopy } from "react-icons/fi"
import { Interface } from "@ethersproject/abi"

import { writeContract, watchContractEvent } from "@wagmi/core"
import {
    useNetwork,
    useContractWrite,
    useAccount,
    usePrepareContractWrite,
    useWaitForTransaction,
} from "wagmi"

import { BN256ToBinUtil, GenerateRandomBinaryArray, StringTo256Binary, BNToDecimal } from "$u"

// ========================================================== deployment details
import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
const CONTRACT_ADDRESS = "0x43ca3d2c94be00692d207c6a1e60d8b325c6f12f"
const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

const keccak256 = require("js-sha3").keccak256
const crypto = require("crypto")

const wc = require("../../circuits/signup_js/witness_calculator")

const CreateNewWallet = () => {
    const [mnemonic, setMnemonic] = useState("")
    const [password1, setPassword1] = useState("")
    const [password2, setPassword2] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)
    const [walletAddress, setWalletAddress] = useState("")

    const [nullifier, setNullifier] = useState("") // to be sent to contract.signup
    const [nullifierHash, setNullifierHash] = useState("") 
    const [commitment, setCommitment] = useState("") 
    const [commitmentHash, setCommitmentHash] = useState("") 
    const [idProof, setIdProof] = useState("") 
    // const debouncedTokenId = useDebounce(commitmentHash, 500)

    /* 
  ==========================================
  ===>   UI SECTION
  ==========================================
  */

    const [copied, setCopied] = useState(false)

    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000) // Reset 'copied' state after 2 seconds
        })
    }

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        if (name === "password1") {
            setPassword1(value)
        } else if (name === "password2") {
            setPassword2(value)
        }
    }

    const handleCreateRandomMnemonic = () => {
        const wallet = ethers.Wallet.createRandom()
        console.log(wallet.mnemonic)
        setMnemonic(wallet.mnemonic.phrase)
    }

    const checkPasswordEquality = () => {
        setPasswordMatch(password1 === password2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const address = createAddress(mnemonic)

        // only set wallet address if both passwords match
        if (password1 === password2) {
            setPasswordMatch(true)
            const successInSignUp = await createAccount()
            if (successInSignUp) {
                setWalletAddress(address)
            } else {
                alert("Error in creating account. Please try again.")
            }
        } else {
            setPasswordMatch(false)
        }
    }

    /* 
    ==========================================
    ===> ETHERS SECTION
    ==========================================
    */

    const { metamaskWalletAddress } = useAccount()

    /**
     * this function creates a wallet address from a mnemonic
     */
    const createAddress = (mnemonic: string) => {
        // const path = `m/44'/60'/0'/0/${i}`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic)
        console.log("wallet.address:", wallet.address)
        console.log("wallet.privKey:", wallet.privateKey)
        console.log("wallet.pubKey:", wallet.publicKey)
        return wallet.address
    }

    /**
     * create account function
     */
    const createAccount = async () => {
        // generate i_comm, i_nulli : random 32 byets
        const i_comm = GenerateRandomBinaryArray()
        setCommitment(i_comm)
        const i_nulli = GenerateRandomBinaryArray()
        setNullifier(i_nulli)

        // create hashes of i_comm => i_comm_hash, i_nulli => i_nulli_hash using circuit
        const input = {
            secret: i_comm,
            nullifier: i_nulli,
        }

        console.log("input : ", input)

        let depositWC: any = await fetch("/signup.wasm")
            .then((res) => res.arrayBuffer())
            .then((buff) => Buffer.from(buff))
            .then((res) => wc(res))

        const r = await depositWC.calculateWitness(input, 0)

        const i_comm_hash = r[1]
        const i_nulli_hash = r[2]

        console.log("i_comm_hash : ", i_comm_hash)
        console.log("i_nulli_hash : ", i_nulli_hash)

        setCommitmentHash(i_comm_hash)
        setNullifierHash(i_nulli_hash)

        console.log(`------------------ going to call the contract`)
        const writeToContract = await write()
        console.log(`------------------ contract called`)
        if (data && data?.hash) {
            console.log(`------------------ setSignUpEventTxAddress called`)
            setSignUpEventTxAddress(data.hash)
        }

        return true
    }

    // generate random bytes of size 32 using ethers

    // unused 5 functions. for POC
    // const createAddressFromRaw = (mnemonic) => {
    //     const privateKey = seedToPrivateKey(mnemonic)
    //     console.log(`privateKey: ${privateKey}`)

    //     const publicKey = privateKeyToPublicKey(privateKey)
    //     console.log(`publicKey: ${publicKey}`)

    //     const address = publicKeyToAddress(publicKey)
    //     console.log(`address: ${address}`)

    //     return address
    // }

    // const seedToPrivateKey = (seed) => {
    //     const hash = crypto.createHash("sha256").update(seed).digest("hex")
    //     return hash
    // }

    // const privateKeyToPublicKey = (privateKey) => {
    //     const ec = crypto.createECDH("secp256k1")
    //     ec.setPrivateKey(privateKey, "hex")
    //     const publicKey = ec.getPublicKey("hex", "uncompressed")
    //     return publicKey
    // }

    // const publicKeyToAddress = (publicKey) => {
    //     const hash = keccak256(Buffer.from(publicKey, "hex"))
    //     const address = "0x" + hash.substring(24)
    //     return address
    // }
    // const handleCreateRandomMnemonic = () => {
    //     const mnemonic = bip39.generateMnemonic()
    //     console.log(mnemonic)
    //     setMnemonic(mnemonic)
    // }

    // =============================================================
    // ================= smart contract functions
    // =============================================================
    const { config } = usePrepareContractWrite({
        address: CONTRACT_ADDRESS,
        abi: ZKWHISPER_ABI,
        functionName: "signupFn",
        args: [commitmentHash],
        onError() {
            console.log("there was an error in calling signup contract")
        },
    })
    const { data, write } = useContractWrite(config)

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    })

    const [signUpEventTxAddress, setSignUpEventTxAddress] = useState("")

    // Listen for changes in "data" and update "signUpEventTxAddress"
    useEffect(() => {
        if (data && data.hash) {
            setSignUpEventTxAddress(data.hash)
            fetchSignUpEvent(data.hash)
        }
    }, [data])

    // fetching SignupEvent from tx
    const fetchSignUpEvent = async (txHash: string) => {
        console.log("=================> fetchSignUpEvent with txHash = ", txHash)
        const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
        })
        console.log("=================> fetchSignUpEvent receipt: ", receipt)

        const log = receipt.logs[0]
        console.log(">log : ", log)

        const decodedData = zkWhisperInterface.decodeEventLog("SignupEvent", log.data, log.topics)
        console.log(">decodedData : ", decodedData)

        const { root, hashPairings, hashDirections } = decodedData
        console.log("===============>root : ", root)
        console.log("===============>hashPairings : ", BNToDecimal(hashPairings))
        console.log("===============>hashDirections : ", hashDirections)
        const _i_proof = {
            menmonic: mnemonic,
            password: password1,
            nullifier: nullifier,
            nullifierHash: BNToDecimal(nullifierHash),
            commitment: commitment,
            commitmentHash: BNToDecimal(commitmentHash),
            accountAddress: walletAddress,
            newRoot: BNToDecimal(root),
            hashPairings: BNToDecimal(hashPairings),
            hashDirections: hashDirections,
        }
        setIdProof(_i_proof)
        console.log("===============>i_proof : ", _i_proof)
    }
    // const unwatch = watchContractEvent(
    //     {
    //         address: `"${signUpEventTxAddress}"`,
    //         abi: ZKWHISPER_ABI,
    //         eventName: "SignupEvent",
    //     },
    //     (log: any) => {
    //         console.log("===========> Emitted event: ")
    //         console.log(log)
    //     }
    // )

    // download id_proof.json

    const downloadJson = () => {
        console.log("---------------------===============>idProof : ", idProof)
        const jsonString = JSON.stringify(idProof, null, 2)

        // Copy JSON to clipboard
        // navigator.clipboard.writeText(jsonString)

        // Download JSON as a JSON file
        const blob = new Blob([jsonString], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `zkWhisper_identitiy_proof_${commitmentHash}.json` // Change the file name as needed
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex flex-col items-center justify-center py-5">
            {walletAddress && (
                <div className="flex flex-col items-center justify-center py-5">
                    <h4 className="text-2xl font-bold mb-10">
                        Metamask Wallet Address: {metamaskWalletAddress}
                    </h4>
                    <h2 className="text-4xl font-bold mb-10">Wallet Created!</h2>
                    <p className="text-2xl font-bold mb-10">
                        Please save your mnemonic and password in a safe place.
                    </p>
                    <div className="flex flex-col items-center mt-4">
                        <p className="font-bold">Wallet Address:</p>
                        <div className="flex items-center mt-4">
                            <p className="font-mono">{walletAddress}</p>
                            <button
                                onClick={() => copyToClipboard(walletAddress)}
                                className="flex items-center"
                            >
                                <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <p>Waiting for transaction to go by...</p>}
            {isSuccess && (

                <div className="flex flex-col items-center justify-center py-5" >
                    <p>{`ZKWhisper Wallet Address:  ${signUpEventTxAddress}`}</p>
                    <button 
                    className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                    onClick={downloadJson}>Download Your Wallet Identity Proof</button>
                </div>
            )}
            {!walletAddress && (
                <div>
                    <h2 className="text-4xl font-bold mb-10">Create New ZKWhisper Wallet</h2>
                    <div className="mb-4 w-full">
                        <label htmlFor="seed" className="text-gray-600">
                            Enter your mnemonic
                        </label>
                        <input
                            type="text"
                            id="seed"
                            name="seed"
                            className="border border-gray-300 text-gray-600 font-mono text-sm rounded px-4 py-2 w-full resize-none"
                            value={mnemonic}
                            onChange={(e) => setMnemonic(e.target.value)}
                        />
                        <button
                            className="bg-amber-400 text-white text-xs px-4 py-1 rounded mt-2 mb-4"
                            onClick={handleCreateRandomMnemonic}
                        >
                            Create Random Mnemonic
                        </button>
                    </div>
                    <div className="mb-4 w-full">
                        <label htmlFor="password1" className="text-gray-600">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password1"
                            name="password1"
                            className="border border-gray-300 rounded px-4 py-2 w-full"
                            onChange={handlePasswordChange}
                        />
                    </div>
                    <div className="mb-4 w-full">
                        <label htmlFor="password2" className="text-gray-600">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="password2"
                            name="password2"
                            className={`border ${
                                passwordMatch ? "border-gray-300" : "border-red-500"
                            } rounded px-4 py-2 w-full`}
                            onChange={handlePasswordChange}
                            onBlur={checkPasswordEquality}
                        />
                        {!passwordMatch && (
                            <p className="text-red-500 mt-1">
                                Passwords do not match. Please try again.
                            </p>
                        )}
                    </div>
                    <button
                        className="bg-amber-400  px-4 py-2 mt-10 rounded w-full"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreateNewWallet
