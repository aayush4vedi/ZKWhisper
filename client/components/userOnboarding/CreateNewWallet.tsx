import React, { useState } from "react"
import { ethers } from "ethers"
import * as bip39 from "bip39"

const keccak256 = require("js-sha3").keccak256
const crypto = require("crypto")

const CreateNewWallet = () => {
    const [mnemonic, setMnemonic] = useState("")
    const [password1, setPassword1] = useState("")
    const [password2, setPassword2] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)
    const [walletAddress, setWalletAddress] = useState("")

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        if (name === "password1") {
            setPassword1(value)
        } else if (name === "password2") {
            setPassword2(value)
        }
    }

    const handleCreateRandomMnemonic = () => {
        const mnemonic = bip39.generateMnemonic()
        console.log(mnemonic)
        setMnemonic(mnemonic)
    }
    const handleCreateRandomMnemonic2 = () => {
        const wallet = ethers.Wallet.createRandom()
        console.log(wallet.mnemonic)
        setMnemonic(wallet.mnemonic.phrase)
    }

    const checkPasswordEquality = () => {
        setPasswordMatch(password1 === password2)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const address = createAddress(mnemonic, password1)
        setWalletAddress(address)
    }

    const createAddress = (mnemonic, password) => {
        // const path = `m/44'/60'/0'/0/${i}`
        const wallet = ethers.Wallet.fromMnemonic(mnemonic)
        console.log("wallet.address:", wallet.address) 
        console.log("wallet.privKey:", wallet.privateKey)
        console.log("wallet.pubKey:", wallet.publicKey)
        return wallet.address
    }    

    // unused 4 functions. for POC
    const createAddressFromRaw = (mnemonic) => {
        const privateKey = seedToPrivateKey(mnemonic)
        console.log(`privateKey: ${privateKey}`)

        const publicKey = privateKeyToPublicKey(privateKey)
        console.log(`publicKey: ${publicKey}`)

        const address = publicKeyToAddress(publicKey)
        console.log(`address: ${address}`)

        return address
    }

    const seedToPrivateKey = (seed) => {
        const hash = crypto.createHash("sha256").update(seed).digest("hex")
        return hash
    }

    const privateKeyToPublicKey = (privateKey) => {
        const ec = crypto.createECDH("secp256k1")
        ec.setPrivateKey(privateKey, "hex")
        const publicKey = ec.getPublicKey("hex", "uncompressed")
        return publicKey
    }

    const publicKeyToAddress = (publicKey) => {
        const hash = keccak256(Buffer.from(publicKey, "hex"))
        const address = "0x" + hash.substring(24)
        return address
    }

    return (
        <div className="flex flex-col items-center justify-center py-5">
            {walletAddress && (
                <div className="mt-4">
                    <p className="font-bold">Wallet Address:</p>
                    <p>{walletAddress}</p>
                </div>
            )}
            <h2 className="text-4xl font-bold mb-10">Create New Wallet</h2>
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
                <button
                    className="bg-amber-400 text-white text-xs px-4 py-1 rounded mt-2 mb-4"
                    onClick={handleCreateRandomMnemonic2}
                >
                    Create Random Mnemonic 2
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
                    <p className="text-red-500 mt-1">Passwords do not match. Please try again.</p>
                )}
            </div>
            <button className="bg-amber-400  px-4 py-2 mt-10 rounded w-full" onClick={handleSubmit}>
                Submit
            </button>
        </div>
    )
}

export default CreateNewWallet
