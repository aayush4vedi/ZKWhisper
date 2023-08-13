import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Interface } from "@ethersproject/abi"

import {
    BN256ToBinUtil,
    GenerateRandomBinaryArray,
    StringTo256Binary,
    BNToDecimal,
    BN256ToBin,
    reverseCoordinate,
    BN256ToHex,
} from "$u"

import { writeContract, watchContractEvent } from "@wagmi/core"
import {
    useNetwork,
    useContractWrite,
    useAccount,
    usePrepareContractWrite,
    useWaitForTransaction,
} from "wagmi"


import { useAtom } from "jotai"

import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
import ZKWHISPER_ADDRESS from "../../constants/addressMappings"
import { zkWhisperAccountAddressAtom,zkWhisperAccountPrivKeyAtom } from "../../state/atom"


import { utils } from "ethers"
import { ethers } from "ethers"
import { usePrepareSendTransaction, useSendTransaction } from "wagmi"


const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

const OnboardExistingWallet = () => {
    const router = useRouter()
    const { address } = useAccount()

    const [jsonData, setJsonData] = useState<any>(null)
    const [loginFnArgs, setLoginFnArgs] = useState<any>(null)
    const [loginFnArg0, setLoginFnArg0] = useState<number[]>([0, 0])
    const [loginFnArg1, setLoginFnArg1] = useState<number[][]>([
        [0, 0],
        [0, 0],
    ])
    const [loginFnArg2, setLoginFnArg2] = useState<number[]>([0, 0])
    const [loginFnArg3, setLoginFnArg3] = useState<number[]>([0, 0])

    // result of VerifyOk from contract
    const [verifyOk, setVerifyOk] = useState<boolean>(false)
    const [loginAttemptFailed, setLoginAttemptFailed] = useState<boolean>(false)

    const [zkWhisperAccountAddress, setZkWhisperAccountAddress] = useAtom(
        zkWhisperAccountAddressAtom
    )
    const [zkWhisperAccountPrivKey, setZkWhisperAccountPrivKey] = useAtom(
        zkWhisperAccountPrivKeyAtom
    )

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            try {
                const hexContent = await readFileAsText(file)
                const jsonString = Buffer.from(hexContent, "hex").toString("utf-8")
                const parsedJson = JSON.parse(jsonString)
                setJsonData(parsedJson)
            } catch (error) {
                console.error("Error reading or parsing hex file:", error)
            }
        }
    }

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                resolve(event.target?.result as string)
            }
            reader.onerror = () => {
                reject(new Error("File could not be read"))
            }
            reader.readAsText(file)
        })
    }

    const login = async () => {
        console.log("login....")

        // construct proof_input
        if (!jsonData) {
            console.log("jsonData is null")
            return
        }
        try {
            const proof_input = {
                root: BNToDecimal(jsonData.newRoot),
                nullifierHash: jsonData.nullifierHash,
                commitmentHash: jsonData.commitmentHash,
                recipient: BNToDecimal(address),
                nullifier: BN256ToBinUtil(jsonData.nullifier).split(""),
                secret: BN256ToBinUtil(jsonData.commitment).split(""),
                hashPairings: jsonData.hashPairings.split(","),
                hashDirections: jsonData.hashDirections,
            }
            console.log("====> proof_input: ", proof_input)

            // compute witness on client

            const SnarkJS: any = window["snarkjs"]

            const { proof, publicSignals } = await SnarkJS.groth16.fullProve(
                proof_input,
                "/login.wasm",
                "/setup_final.zkey"
            )

            console.log("----------->proof : ", proof)
            console.log("----------->proof.pi_a : ", proof?.pi_a)
            console.log("----------->proof.pi_b : ", proof?.pi_b)
            console.log("----------->proof.pi_b : ", proof?.pi_b)
            console.log("----------->publicSignals : ", publicSignals)

            const callInputs = [
                proof.pi_a.slice(0, 2).map(BN256ToHex),
                proof.pi_b.slice(0, 2).map((row) => reverseCoordinate(row.map(BN256ToHex))),
                proof.pi_c.slice(0, 2).map(BN256ToHex),
                publicSignals.slice(0, 2).map(BN256ToHex),
            ]

            const callData = zkWhisperInterface.encodeFunctionData("loginFn", callInputs)

            console.log("----------->callInputs : ", callInputs)
            console.log("----------->callData : ", callData)

            setLoginFnArg0(callInputs[0])
            setLoginFnArg1(callInputs[1])
            setLoginFnArg2(callInputs[2])
            setLoginFnArg3(callInputs[3])
            setLoginFnArgs(callInputs)
        } catch (error) {
            console.error("Error in logging in :", error)
        }
    }

    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        address: ZKWHISPER_ADDRESS,
        abi: ZKWHISPER_ABI,
        functionName: "loginFn",
        args: [loginFnArg0, loginFnArg1, loginFnArg2, loginFnArg3],
        onError() {
            console.log("there was an error in calling loginFn contract")
        },
    })
    const { data, write } = useContractWrite(config)

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    })

    // useEffect(() => {
    //     console.log(
    //         "....................... updated loginFnArgs: ",
    //         loginFnArgs,
    //         " write = ",
    //         write
    //     )
    //     if (loginFnArgs != null) {
    //         console.log(`calling write()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}`)
    //         callWrite()
    //         console.log(`called write()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}`)
    //     } else {
    //         console.log("......loginFnArgs is null")
    //     }
    // }, [loginFnArgs])

    // const callWrite = async () => {
    //     try {
    //         console.log(
    //             `calling callWrite()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}, write: ${write}`
    //         )
    //         await write?.()
    //         console.log(
    //             `called callWrite()...  isSuccess: ${isSuccess} , isLoading: ${isLoading}, write: ${write}`
    //         )
    //     } catch (error) {
    //         console.log("error in calling write: ", error)
    //     }
    // }

    // Listen for changes in "data" and update "loginEventTxAddress"
    useEffect(() => {
        if (data && data.hash) {
            fetchLoginEvent(data.hash)
        }
    }, [data])

    // fetching SignupEvent from tx
    const fetchLoginEvent = async (txHash: string) => {
        console.log("=================> fetchLoginEvent with txHash = ", txHash)
        const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
        })
        console.log("=================> fetchLoginEvent receipt: ", receipt)

        const log = receipt.logs[0]
        console.log(">log : ", log)

        const decodedData = zkWhisperInterface.decodeEventLog("LoginEvent", log.data, log.topics)
        console.log(">decodedData : ", decodedData)

        const { account, nullifierHash, verifyOK } = decodedData
        console.log("===============>account : ", account)
        console.log("===============>nullifierHash : ", nullifierHash)
        console.log("===============>verifyOK : ", verifyOK)

        if (verifyOK) {
            setZkWhisperAccountAddress(jsonData.accountAddress)
            setZkWhisperAccountPrivKey(jsonData.walletAddressPrivKey)
        }

        setVerifyOk(verifyOK)
        setLoginAttemptFailed(false)
    }

    //// ============================================================= transfer funds
    const { config: transferEthConf } = usePrepareSendTransaction({
        to: jsonData?.accountAddress,
        value: ethers.utils.parseEther("0.01"),
    })
    const { sendTransaction } = useSendTransaction(transferEthConf)

    return (
        <div className="flex flex-col items-center justify-center py-5">
            <div>
                <input type="file" accept=".json" onChange={handleFileUpload} />
                {!verifyOk && jsonData && (
                    <div className="flex flex-col items-center justify-center py-5">
                        <h2>JSON Data</h2>
                        <br />
                        {/* <p> <strong>menmonic</strong> : {jsonData.menmonic}</p>
                        <p><strong> password</strong> : {jsonData.password}</p>
                        <p><strong> accountAddress</strong> : {jsonData.accountAddress}</p> */}

                        <button
                            className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                            onClick={login}
                        >
                            Generate Witness
                        </button>
                        <button
                            className="button rounded-lg font-bold bg-black text-white  px-4 py-2 mt-10 w-full"
                            onClick={() => write?.()}
                            disabled={!write}
                        >
                            Call SmartContract
                        </button>
                    </div>
                )}
                {verifyOk && (
                    <div className="flex flex-col items-center justify-center py-5">
                        <h1>Logged In</h1>
                        <br />
                        <p>
                            <strong>Your mnemonic:</strong> {jsonData?.menmonic}
                        </p>
                        <p>
                            <strong>Your password:</strong> {jsonData?.password}
                        </p>
                        <p>
                            <strong>Your accountAddress:</strong> {jsonData?.accountAddress}
                        </p>
                        <button
                            className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                            onClick={() => router.push("/recovery")}
                        >
                            Setup Wallet Recovery
                        </button>
                        <button
                            className="button rounded-lg font-bold bg-amber-400 border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                            onClick={() => sendTransaction?.()}
                        >
                            Transfer Funds to ZKWhisper Wallet
                        </button>
                    </div>
                )}
                {!setLoginAttemptFailed && (
                    <div className="flex flex-col items-center justify-center py-5">
                        <h1>LogIn Attempt failed due to incorrect proof file</h1>
                        <br />
                        <p>Retry the correct proof file</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default OnboardExistingWallet
