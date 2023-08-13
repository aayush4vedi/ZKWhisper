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
import { useRouter } from "next/router"

import { useAtom } from "jotai"
import { zkWhisperAccountAddressAtom, zkWhisperAccountPrivKeyAtom, zkWhisperAccountMnemonicAtom } from "../../state/atom"

// ========================================================== deployment details
import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
import ZKWHISPER_ADDRESS from '../../constants/addressMappings';
const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

import { usePrepareSendTransaction, useSendTransaction } from "wagmi"


const keccak256 = require("js-sha3").keccak256
const crypto = require("crypto")

const wc = require("../../circuits/signup_js/witness_calculator")



const CreateNewWallet = () => {
    const router = useRouter()

    const [mnemonic, setMnemonic] = useState("")
    const [password1, setPassword1] = useState("")
    const [password2, setPassword2] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)
    const [walletAddress, setWalletAddress] = useState("")

    const [nullifier, setNullifier] = useState("") // to be sent to contract.signup
    const [nullifierHash, setNullifierHash] = useState("")
    const [commitment, setCommitment] = useState("")
    const [commitmentHash, setCommitmentHash] = useState(null)
    const [idProof, setIdProof] = useState("")
    // const debouncedTokenId = useDebounce(commitmentHash, 500)

    const [zkWhisperAccountAddress, setZkWhisperAccountAddress] = useAtom(
        zkWhisperAccountAddressAtom
    )
    const [walletAddressPrivKey, setWalletAddressPrivKey] = useAtom(zkWhisperAccountPrivKeyAtom)
    const [walletMnemoic, setWalletMnemoic] = useAtom(zkWhisperAccountMnemonicAtom)

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
        setWalletMnemoic(wallet.mnemonic.phrase)
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
        setWalletAddressPrivKey(wallet.privateKey)
        return wallet.address
    }

    const [createAccBtnClicked, setCreateAccBtnClicked] = useState(false)

    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        address: ZKWHISPER_ADDRESS,
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
    /**
     * create account function
     */
    const createAccount = async () => {
        // generate i_comm, i_nulli : random 32 byets
        const i_comm = BigNumber.from(ethers.utils.randomBytes(32)).toString()
        setCommitment(i_comm)
        const i_nulli = BigNumber.from(ethers.utils.randomBytes(32)).toString()
        setNullifier(i_nulli)

        // create hashes of i_comm => i_comm_hash, i_nulli => i_nulli_hash using circuit
        const input = {
            secret: BN256ToBinUtil(i_comm).split(""),
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

        setCommitmentHash(i_comm_hash)
        setNullifierHash(i_nulli_hash)
        setCreateAccBtnClicked(true)

        console.log("i_comm_hash : ", i_comm_hash)
        console.log("i_nulli_hash : ", i_nulli_hash)

        // console.log(
        //         `------------------ going to call the contract :: commitmenHash: ${commitmentHash}`
        //     )
        //     write?.()
        //     console.log(`------------------ contract called`)
        // if (data && data?.hash) {
        //     console.log(`------------------ setSignUpEventTxAddress called`)
        //     setSignUpEventTxAddress(data.hash)
        // }

        // return isSuccess
        return true
    }

    // =============================================================
    // ================= smart contract functions
    // =============================================================

    const [signUpEventTxAddress, setSignUpEventTxAddress] = useState("")

    // Listen for changes in "data" and update "signUpEventTxAddress"
    useEffect(() => {
        if (data && data.hash) {
            setSignUpEventTxAddress(data.hash)
            fetchSignUpEvent(data.hash)
        }
    }, [data])

    // useEffect(() => {
    //     const fetchData = async () => {
    //         if (commitmentHash) {
    //             console.log(
    //                 `------------------ going to call the contract :: commitmentHash: ${commitmentHash}`
    //             )

    //             // Await the asynchronous function
    //             await write?.()

    //             console.log(`------------------ contract called`)

    //             if (data && data?.hash) {
    //                 console.log(`------------------ setSignUpEventTxAddress called`)
    //                 setSignUpEventTxAddress(data.hash)
    //             }
    //         }
    //     }

    //     fetchData()
    // }, [commitmentHash, createAccBtnClicked])

    // useEffect(() => {
    //     console.log("....................... updated commitmentHash: ", commitmentHash , ' write = ', write)
    //     if (commitmentHash != null) {
    //         console.log(`calling write()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}`)
    //         callWrite()
    //          console.log(`called write()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}`)

    //         if (data && data?.hash) {
    //             console.log(`------------------ setSignUpEventTxAddress called`)
    //             setSignUpEventTxAddress(data.hash)
    //         }
    //     } else {
    //         console.log("......commitmentHash is null")
    //     }
    // }, [commitmentHash])

    // const callWrite = async () => {
    //     try {
    //         console.log(`calling callWrite()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}, write: ${write}`)
    //         await write?.()
    //         console.log(
    //             `called callWrite()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}, write: ${write}`
    //         )
    //     } catch (error) {
    //         console.log("error in calling write: ", error)
    //     }
    // }

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
            walletAddressPrivKey: walletAddressPrivKey,
            nullifier: nullifier,
            nullifierHash: `${nullifierHash}`,
            commitment: commitment,
            commitmentHash: `${commitmentHash}`,
            accountAddress: walletAddress,
            newRoot: BNToDecimal(root),
            hashPairings: BNToDecimal(hashPairings),
            hashDirections: hashDirections,
        }
        setIdProof(_i_proof)
        console.log("===============>i_proof : ", _i_proof)
    }

    // download id_proof.json

    const downloadJson = () => {
        console.log("---------------------===============>idProof : ", idProof)
        const jsonString = JSON.stringify(idProof, null, 2)

        const hexString = Buffer.from(jsonString, "utf-8").toString("hex")
        const blob = new Blob([hexString], { type: "application/octet-stream" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `zkWhisper_identitiy_proof_${commitmentHash}.json` // Change the file name as needed
        a.click()
        URL.revokeObjectURL(url)
        setZkWhisperAccountAddress(walletAddress)
    }

    //// ============================================================= transfer funds
    // const [transferEth, setTransferEth] = useState("0.1")

    // const { config: transferEthConf } = usePrepareSendTransaction({
    //     to: walletAddress ? walletAddress : null,
    //     value: transferEth? ethers.utils.parseEther(transferEth): undefined,
    // })
    // const { sendTransaction } = useSendTransaction(transferEthConf)

    return (
        <div className="flex flex-col items-center justify-center py-5">
            {/* {walletAddress && (
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
            )} */}
            {/* {isLoading && <p>Waiting for transaction to go by...</p>} */}
            {/* {(isPrepareError || isError) && <div>Error: {(prepareError || error)?.message}</div>} */}
            {isSuccess && (
                <div className="flex flex-col items-center justify-center py-5">
                    <div className="flex flex-col items-center justify-center py-5">
                        {/* <h4 className="text-2xl font-bold mb-10">
                            Metamask Wallet Address: {metamaskWalletAddress}
                        </h4> */}
                        <h2 className="text-4xl font-bold mb-10">Wallet Created!</h2>
                        <p className="text-2xl font-bold mb-10">
                            Please save your mnemonic and password in a safe place.
                        </p>
                        <div className="flex flex-col items-center mt-4">
                            <p className="font-bold">
                                <strong>Wallet Address:</strong>
                            </p>
                            <div className="flex items-center mt-4">
                                <p className="font-mono">{walletAddress}</p>
                                <button
                                    onClick={() => copyToClipboard(walletAddress)}
                                    className="flex items-center"
                                >
                                    <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                                </button>
                            </div>
                            <p className="font-bold">
                                <strong>Wallet PrivateKey</strong>
                            </p>
                            <div className="flex items-center mt-4">
                                <p className="font-mono">{walletAddressPrivKey}</p>
                                <button
                                    onClick={() => copyToClipboard(walletAddressPrivKey)}
                                    className="flex items-center"
                                >
                                    <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                                </button>
                            </div>
                            <p className="font-bold">
                                <strong>Wallet Mnemonic</strong>
                            </p>
                            <div className="flex items-center mt-4">
                                <p className="font-mono">{walletMnemoic}</p>
                                <button
                                    onClick={() => copyToClipboard(walletMnemoic)}
                                    className="flex items-center"
                                >
                                    <FiCopy className="m-2" /> {copied ? "Copied!" : "Copy"}{" "}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                        onClick={downloadJson}
                    >
                        Download Your Wallet Identity Proof
                    </button>
                    {/* <div className="flex items-center justify-center mt-10">
                        <label htmlFor="transfer" className="text-gray-600">
                            Enter ETH
                        </label>
                        <input
                            type="number"
                            value={transferEth}
                            onChange={(e) => setTransferEth(e.target.value)}
                            className="border border-gray-300 text-gray-600 font-mono text-sm p-3 m-2 rounded  resize-none"
                        />
                        <p><button
                            className="button rounded-lg font-bold bg-amber-400 border-4 border-black p-2 min-w-[300px] hover:bg-white hover:text-black"
                            onClick={() => sendTransaction?.()}
                        >
                            Transfer ETH to ZKWhisper Wallet
                        </button></p>
                        </div> */}
                    {/* <button
                        className="button rounded-lg font-bold bg-amber-400 border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                        onClick={() => sendTransaction?.()}
                    >
                        Transfer 1 ETH to ZKWhisper Wallet
                    </button> */}
                    <button
                        className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                        onClick={() => router.push("/recovery")}
                    >
                        Setup Wallet Recovery
                    </button>
                </div>
            )}
            {!isSuccess && (
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
                        Generate Proof
                    </button>
                    <button
                        className="button rounded-lg font-bold bg-black text-white  px-4 py-2 mt-10 w-full"
                        onClick={() => write?.()}
                        disabled={!write}
                    >
                        Sign Up
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreateNewWallet
