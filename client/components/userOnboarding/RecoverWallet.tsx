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

import {
    BN256ToBinUtil,
    GenerateRandomBinaryArray,
    StringTo256Binary,
    BNToDecimal,
    GenerateLongRandomNumbers,
    CreateShamirSecretPolynomial,
    EncryptWithKeccak256,
    reverseCoordinate,
    SimpleshFunction,
    RecoverShamirSecret,
    BN256ToHex,
} from "$u"
import { FiCopy } from "react-icons/fi"

import { MerkleTree } from "merkletreejs"
const SHA256 = require("crypto-js/sha256")

import ZKWHISPER_ABI from "../../constants/zkwhisper.json"
import ZKWHISPER_ADDRESS from "../../constants/addressMappings"
import { zkWhisperAccountAddressAtom } from "../../state/atom"

const zkWhisperInterface = new Interface(ZKWHISPER_ABI)

const RecoverWallet = () => {
    const { address } = useAccount()

    const [copied, setCopied] = useState(false)

    const copyToClipboard = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 200) // Reset 'copied' state after 2 seconds
        })
    }

    // final recovery state
    const [recoveryState, setRecoveryState] = useState(null)
    const [recoveredValue, setRecoveredValue] = useState(null)

    const [numGuardianProofs, setNumGuardianProofs] = useState(3)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [showContent, setShowContent] = useState(false)

    const [recoveryAttempted, setRecoveryAttempted] = useState(false)
    const [guardianProofsAreValid, setGuardianProofsAreValid] = useState(true)
    const [guardianProofsValidationErrorMessage, setGuardianProofsValidationErrorMessage] =
        useState()

    // circom+ states
    const [gProofMerkleRoot, setGProofMerkleRoot] = useState()
    const [merkleRootNullifier, setMerkleRootNullifier] = useState()
    const [merkleRootNullifierHash, setMerkleRootNullifierHash] = useState()
    const [merkleRootCommitment, setMerkleRootCommitment] = useState()
    const [merkleRootCommitmentHash, setMerkleRootCommitmentHash] = useState()
    const [hashDirections, setHashDirections] = useState()
    const [hashPairings, setHashPairings] = useState()

    // smartcontract states
    const [loginFnArg0, setLoginFnArg0] = useState<number[]>([0, 0])
    const [loginFnArg1, setLoginFnArg1] = useState<number[][]>([
        [0, 0],
        [0, 0],
    ])
    const [loginFnArg2, setLoginFnArg2] = useState<number[]>([0, 0])
    const [loginFnArg3, setLoginFnArg3] = useState<number[]>([0, 0])

    const handleNumProofsChange = (event) => {
        const value = parseInt(event.target.value)
        setNumGuardianProofs(value)
    }

    const handleFileUpload = (event) => {
        const files = event.target.files
        const newUploadedFiles = []

        if (files.length !== numGuardianProofs) {
            alert(`Please upload ${numGuardianProofs} files.`)
            return
        }

        for (let i = 0; i < numGuardianProofs; i++) {
            console.log(`-------------------------> i: ${i}`)
            if (files[i]) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const content = e.target.result
                    const hexString = Buffer.from(content, "hex").toString("utf-8")
                    const gShare = JSON.parse(hexString)
                    // log all values from data in form of gShare
                    console.log(`-------------------------> i: ${i}`)
                    console.log(`-----: gShare.guardianIdx: ${gShare?.guardianIdx}`)
                    console.log(
                        `-----: gShare.guardianShares: ${JSON.stringify(gShare.guardianShares)}`
                    )
                    console.log(`-----: gShare.guardianShares.len: ${gShare.guardianShares.length}`)
                    const merkleProof = JSON.stringify(gShare.guardianMerkleProof)
                    console.log(`-----: gShare.guardianMerkleProof: ${merkleProof}`)
                    console.log(`-----: gShare.guardianMerkleRoot: ${gShare?.guardianMerkleRoot}`)
                    console.log(`-----: gShare.hashSecretString: ${gShare?.hashSecretString}`)
                    console.log(`-----: gShare.gProofMerkleRoot: ${gShare?.gProofMerkleRoot}`)
                    console.log(`-----: gShare.gProofHashPairings: ${gShare?.gProofHashPairings}`)
                    console.log(
                        `-----: gShare.gProofHashDirections: ${gShare?.gProofHashDirections}`
                    )

                    newUploadedFiles.push(gShare)
                    if (newUploadedFiles.length === numGuardianProofs) {
                        setUploadedFiles(newUploadedFiles)
                        setShowContent(true)
                    }
                }
                reader.readAsText(files[i])
            }
        }
    }

    // validate guardian proofs
    const validateGuardianProofs = () => {
        console.log(".............. here in validateGuardianProofs")
        setRecoveryAttempted(true)

        // 1. Check if all proofs contain the same recovery value
        if (!checkAllProofsContainSameRecoveryValue(uploadedFiles)) {
            setGuardianProofsValidationErrorMessage(
                "All proofs must contain the same recovery value."
            )
            setGuardianProofsAreValid(false)
            return false
        } else {
            console.log("All proofs contain the same recovery values")
        }

        // 2. Check valid proof Merkle Tree construction
        if (!checkValidProofMerkeTreeConstruction()) {
            setGuardianProofsValidationErrorMessage("Invalid proof Merkle Tree construction.")
            setGuardianProofsAreValid(false)
            return false
        }

        // 3. Construct S from proofs using Shamir Recovery
        if (!checkShamirRecovery()) {
            setGuardianProofsValidationErrorMessage("Shamir Recovery check failed.")
            setGuardianProofsAreValid(false)
            return false
        }

        // All checks passed
        setGuardianProofsAreValid(true)
        return true
    }

    const checkAllProofsContainSameRecoveryValue = (shares) => {
        if (!shares || shares.length === 0) {
            return false
        }

        const referenceShare = shares[0]
        const fieldsToCheck = [
            "hashSecretString",
            "gProofMerkleRoot",
            "gProofHashPairings",
            "gProofHashDirections",
        ]

        for (const field of fieldsToCheck) {
            if (!referenceShare[field]) {
                console.log(`-----:[not found] referenceShare[field]: ${referenceShare[field]}`)
                return false
            }
            const referenceValue = referenceShare[field]
            for (let i = 1; i < shares.length; i++) {
                let equal = false
                if (field === "gProofHashDirections") {
                    equal = JSON.stringify(shares[i][field]) === JSON.stringify(referenceValue)
                } else {
                    equal = shares[i][field] === referenceValue
                }
                if (!equal) {
                    console.log(
                        `---------:[not equal] shares[i][field] =${shares[i][field]}  not equal to ${referenceValue}`
                    )
                    return false
                }
            }
        }

        setGProofMerkleRoot(shares[0].gProofMerkleRoot)
        setMerkleRootNullifierHash(shares[0].merkleRootNullifierHash)
        setMerkleRootCommitmentHash(shares[0].merkleRootCommitmentHash)
        setMerkleRootNullifier(shares[0].merkleRootNullifier)
        setMerkleRootCommitment(shares[0].merkleRootCommitment)
        setHashDirections(shares[0].gProofHashDirections)
        setHashPairings(shares[0].gProofHashPairings)

        return true
    }

    const checkValidProofMerkeTreeConstruction = () => {
        const tree = new MerkleTree([], SHA256)

        uploadedFiles.forEach((gShare) => {
            const proofJson = JSON.stringify(gShare.guardianMerkleProof)
            const root = gShare.guardianMerkleRoot

            const leaf = SimpleshFunction(gShare.guardianShares)

            console.log(`----->>> leaf: ${leaf}`)

            console.log(`----->>> proofJson: ${proofJson}`)
            const transformedProof = JSON.parse(proofJson).map((item) => ({
                position: item.position,
                data: Buffer.from(item.data.data),
            }))
            console.log(`----->>> transformedProof: ${transformedProof}`)

            const verified = tree.verify(transformedProof, leaf, root)
            console.log(`----->>>>>>>>>>>>>>>> verified: ${verified}`)
            if (!verified) return false
        })
        return true
    }

    const checkShamirRecovery = () => {
        let parts = []
        let secretHash = ""
        console.log(`...............| parts = ${parts}`)
        uploadedFiles.forEach((gShare) => {
            // collect gShare.guardianShares to pats
            console.log(
                `--------------> gShare.guardianShares = ${JSON.stringify(gShare.guardianShares)}`
            )
            parts.push(gShare.guardianShares)
            secretHash = gShare.hashSecretString
        })

        const recovery = RecoverShamirSecret(parts, secretHash)
        console.log(`=================== recovery = ${recovery}`)
        const recoverySuccess = recovery != null
        if (recovery != null) {
            console.log(`=================== recoverySuccess = ${recoverySuccess}`)
            setRecoveredValue(recovery)
        }
        return recoverySuccess
    }

    // =========================== generate proof with circom
    const witness_generation = async () => {
        try {
            const proof_input = {
                root: BNToDecimal(gProofMerkleRoot),
                nullifierHash: merkleRootNullifierHash,
                commitmentHash: merkleRootCommitmentHash,
                recipient: BNToDecimal(address),
                nullifier: BN256ToBinUtil(merkleRootNullifier).split(""),
                secret: BN256ToBinUtil(merkleRootCommitment).split(""),
                hashPairings: hashPairings.split(","),
                hashDirections: hashDirections,
            }

            console.log("====> proof_input: ", proof_input)

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

            // const callData = zkWhisperInterface.encodeFunctionData("executeRecoveryFn", callInputs)

            console.log("----------->callInputs : ", callInputs)
            // console.log("----------->callData : ", callData)

            setLoginFnArg0(callInputs[0])
            setLoginFnArg1(callInputs[1])
            setLoginFnArg2(callInputs[2])
            setLoginFnArg3(callInputs[3])
        } catch (error) {
            console.error("Error in recovery in :", error)
        }
    }

    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        address: ZKWHISPER_ADDRESS,
        abi: ZKWHISPER_ABI,
        functionName: "executeRecoveryFn",
        args: [loginFnArg0, loginFnArg1, loginFnArg2, loginFnArg3],
        onError() {
            console.log("there was an error in calling executeRecoveryFn contract")
        },
    })
    const { data, write } = useContractWrite(config)

    const { isLoading, isSuccess } = useWaitForTransaction({
        hash: data?.hash,
    })

    // fetch event
    useEffect(() => {
        if (data && data.hash) {
            fetchExecuteRecoveryEvent(data.hash)
        }
    }, [data])

    const fetchExecuteRecoveryEvent = async (txHash: string) => {
        console.log("=================> fetchExecuteRecoveryEvent with txHash = ", txHash)
        const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
        })
        console.log("=================> fetchExecuteRecoveryEvent receipt: ", receipt)

        const log = receipt.logs[0]
        console.log(">log : ", log)

        const decodedData = zkWhisperInterface.decodeEventLog(
            "ExecuteRecoveryEvent",
            log.data,
            log.topics
        )
        console.log(">decodedData : ", decodedData)

        const { account, nullifierHash, verifyOK } = decodedData
        console.log("===============>account : ", account)
        console.log("===============>nullifierHash : ", nullifierHash)
        console.log("===============>verifyOK : ", verifyOK)

        if (verifyOK) {
            setRecoveryState("SUCCESS")
        } else {
            setRecoveryState("FAIL")
        }
    }

    return (
        <>
            {recoveryState == "SUCCESS" && recoveredValue && (
                <div className="flex flex-col items-center justify-center py-5">
                    <p className="text-xl py-4 items-center justify-center">
                        <strong>
                            Social Recovery has been made Successfully!
                            Here is your wallet recovery key :
                        </strong>
                    </p>
                    <div className="flex items-center mt-4 text-xs rounded-lg bg-gray-200 p-6">
                        <p className="font-mono text-md">${recoveredValue}</p>
                        <button
                            onClick={() => copyToClipboard(recoveredValue)}
                            className="flex items-center ml-2"
                        >
                            <FiCopy className="m-2" />
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-center py-5">
                {recoveryState == "FAIL" && (
                    <div>
                        <p>
                            Unable to recover your account. Check with your guardians and try again.
                        </p>
                    </div>
                )}
                {!recoveryState && (
                    <div>
                        <h2 className="text-3xl font-bold mb-10">Guardian Proof Uploader</h2>
                        {!showContent && (
                            <div>
                                <label htmlFor="seed" className="text-gray-600">
                                    Number of Guardian Proofs:
                                </label>
                                <input
                                    type="number"
                                    className="border border-gray-300 text-gray-600 font-mono text-sm rounded px-4 py-2 w-full resize-none"
                                    value={numGuardianProofs}
                                    onChange={handleNumProofsChange}
                                />
                                <br />
                                <input type="file" multiple onChange={handleFileUpload} />
                                <br />
                                <button
                                    className="button rounded-lg font-bold bg-black text-white  px-4 py-2 mt-10 w-full"
                                    onClick={() => setShowContent(true)}
                                >
                                    Upload
                                </button>
                            </div>
                        )}

                        {showContent && (
                            <div>
                                {!recoveryAttempted && (
                                    <div>
                                        <p>`You have uploaded {numGuardianProofs} files`</p>
                                        <button
                                            className="button rounded-lg font-bold bg-black text-white  px-4 py-2 mt-10 w-full"
                                            onClick={validateGuardianProofs}
                                        >
                                            Validate Proofs
                                        </button>
                                    </div>
                                )}

                                {/* message in red if setGuardianProofsAreValid is false */}
                                {!guardianProofsAreValid && (
                                    <div>
                                        <p className="text-red-500">
                                            Guardian proofs are not valid. Please try again
                                        </p>
                                        <p>
                                            `Error message: ${guardianProofsValidationErrorMessage}`
                                        </p>
                                    </div>
                                )}
                                {!guardianProofsValidationErrorMessage &&
                                    guardianProofsAreValid &&
                                    recoveryAttempted && (
                                        <div className="flex flex-col items-center justify-center py-5">
                                            <p className="text-green-800">
                                                Guardian proofs are valid. Procced to Recovery
                                            </p>
                                            <button
                                                className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                                                onClick={witness_generation}
                                            >
                                                Generate Witness
                                            </button>
                                            {/* <label htmlFor="seed" className="text-gray-600">
                                            Enter a new address where recovery should transfer all the tokens to
                                        </label>
                                        <input
                                            type="text"
                                            className="border border-gray-300 text-gray-600 font-mono text-sm rounded px-4 py-2 w-full resize-none"
                                            value={recoveryAddressTo}
                                            onChange={(e) => setRecoveryAddressTo(e.target.value)}
                                        />
                                        <label htmlFor="seed" className="text-gray-600">
                                            Enter your old account address
                                        </label>
                                        <input
                                            type="text"
                                            className="border border-gray-300 text-gray-600 font-mono text-sm rounded px-4 py-2 w-full resize-none"
                                            value={recoveryAddressFrom}
                                            onChange={(e) => setRecoveryAddressFrom(e.target.value)}
                                        /> */}
                                            <button
                                                className="button rounded-lg font-bold bg-black text-white  px-4 py-2 mt-10 w-full"
                                                onClick={() => write?.()}
                                                disabled={!write}
                                            >
                                                Execute Recovery
                                            </button>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default RecoverWallet

/*
add: 0x7257BF781F048778c41a8061096E722d5ea2C5EB
priv: 0x81ec1a15d73d4a9e2bed15cc8b586ed5e43d39080f2d7a02868e3cdb49bff0d8

====> hashedLeaves: c63262f235cb773e192bece78660fc36ce227eb14f2944e95f09bb238f66974b,d618d2dd8a9721c7fb03766ee4efafaa3136ad869f2115adda7c1338e5c86e86,abdc47e42a9deed5a38cca1a4f0d1b66bfa73d12acb47ea0e3eb022367a70c00,ca61a702103ec27e24d4d90376b2cee9deb9d21ec55f14c376f65086b4760ba4,dd4f843f6d42a451bf0a7566645256667f565cdc88e43d591884b0c2e9b8cffb

b97472a2754bda9e4315dc7ca811c82b51184e040ee91b52777d331097a36af9
   ├─ aa3a13b7ba8654083ba1a32dec02f054bc247ee5c588159003da3e20500f0fa0
   │  ├─ 348bac7914a2e98cfd8c962afcf28f9ccdec031185ff4fe1674dfddcb65b41d1
   │  │  ├─ c63262f235cb773e192bece78660fc36ce227eb14f2944e95f09bb238f66974b
   │  │  └─ d618d2dd8a9721c7fb03766ee4efafaa3136ad869f2115adda7c1338e5c86e86
   │  └─ aecb5b5f77759f110f821de4a8bfbfe686ed25fcf95befc802d8676e5c5766f8
   │     ├─ abdc47e42a9deed5a38cca1a4f0d1b66bfa73d12acb47ea0e3eb022367a70c00
   │     └─ ca61a702103ec27e24d4d90376b2cee9deb9d21ec55f14c376f65086b4760ba4
   └─ dd4f843f6d42a451bf0a7566645256667f565cdc88e43d591884b0c2e9b8cffb
      └─ dd4f843f6d42a451bf0a7566645256667f565cdc88e43d591884b0c2e9b8cffb
         └─ dd4f843f6d42a451bf0a7566645256667f565cdc88e43d591884b0c2e9b8cffb

SocialRecoverySetup.tsx:132 =================> proofs[0]: [{"position":"right","data":{"type":"Buffer","data":[214,24,210,221,138,151,33,199,251,3,118,110,228,239,175,170,49,54,173,134,159,33,21,173,218,124,19,56,229,200,110,134]}},{"position":"right","data":{"type":"Buffer","data":[174,203,91,95,119,117,159,17,15,130,29,228,168,191,191,230,134,237,37,252,249,91,239,200,2,216,103,110,92,87,102,248]}},{"position":"right","data":{"type":"Buffer","data":[221,79,132,63,109,66,164,81,191,10,117,102,100,82,86,102,127,86,92,220,136,228,61,89,24,132,176,194,233,184,207,251]}}]

*/
