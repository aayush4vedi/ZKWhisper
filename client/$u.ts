import { BigNumber, ethers } from "ethers"

/**
 * this funtion takes a BigNumber and returns a binary string of length 256
 */
export const BN256ToBinUtil = (str: string): string => {
    let r = BigInt(str).toString(2) // convert to binary
    let prePadding = ""
    let paddingAmount = 256 - r.length
    for (var i = 0; i < paddingAmount; i++) {
        prePadding += "0"
    }
    return prePadding + r
}

/**
 * generate a random binary array of size 256 using ethers
 */
export const GenerateRandomBinaryArray = () => {
    const randomBytes = ethers.utils.randomBytes(32)
    const bigNumRandomBytes = BigNumber.from(randomBytes)
    return BN256ToBinUtil(bigNumRandomBytes).split("")
}

// function using BN256ToBinUtil to convert a given string to a binary string of length 256
export const StringTo256Binary = (str: string): string => {
    const strToBigNum = BigNumber.from(ethers.utils.formatBytes32String(str)) // without formatting: it fails when str contains special characters
    return BN256ToBinUtil(strToBigNum)
}

export const GenerateRandomNumbers = (count: number): void => {
    console.log("Generating " + count + " random numbers")
    for (let i = 0; i < count; i++) {
        console.log(BigInt(BigNumber.from(ethers.utils.randomBytes(32))))
    }
}

// util to convert big number to decimal
export const BNToDecimal = (bn: BigNumber): string => {
    return bn.toString()
}

// console.log(GenerateRandomNumbers(10))   // To make it run from terminal, remove 'export' from all the function and `❯ node \$u.ts`