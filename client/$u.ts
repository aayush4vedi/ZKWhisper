import { BigNumber, ethers , utils} from "ethers"

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
    return BN256ToBinUtil(bigNumRandomBytes)
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

export const BN256ToBin = (str) => {
    let r = BigInt(str).toString(2)
    let prePadding = ""
    let paddingAmount = 256 - r.length
    for (var i = 0; i < paddingAmount; i++) {
        prePadding += "0"
    }
    return prePadding + r
}

export const reverseCoordinate = (p) => {
    let r = [0, 0]
    r[0] = p[1]
    r[1] = p[0]
    return r
}

export const BN256ToHex = (n) => {
    let nstr = BigInt(n).toString(16)
    while (nstr.length < 64) {
        nstr = "0" + nstr
    }
    nstr = `0x${nstr}`
    return nstr
}


export const GenerateLongRandomNumbers = (n) => {
    const randomBytes = ethers.utils.randomBytes(n)
    const bigNumRandomBytes = BigNumber.from(randomBytes)
    return BigInt(bigNumRandomBytes)
}


// console.log(GenerateRandomNumbers(10))   // To make it run from terminal, remove 'export' from all the function and `❯ node \$u.ts`


// ========================================== maths utils

// 1. secret sharing
// a function which takes k, n and string s; then computes a polynmial of degree (k-1) such that its x-axis intercept is string s and returns the polynomial as string
export const CreateShamirSecretPolynomial = (k: number, n: number, s: string): [BigInt, BigInt, number][] => {
    if (k <= 0 || n <= 0) {
        throw new Error("k and n must be positive integers")
    }

    // Convert string s to a numeric value (e.g., ASCII sum of characters)
    const intercept = s.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)

    // Compute polynomial coefficients
    const coefficients: BigInt[] = []
    for (let i = 0; i < k; i++) {
        // generate a random number between 10 and 255
        const rand = GetRandomIntInRange(10, 255)
        coefficients.push(GenerateLongRandomNumbers(rand)) // Replace with your coefficient computation logic
    }

    // evaluate polynomials at random n points
    const evaluatedPoints: [BigInt, BigInt][] = []
    for (let i = 0; i < n; i++) {
        const x = GenerateLongRandomNumbers(GetRandomIntInRange(1, 2 ** 8)) // Generate a random x value
        const y = evaluatePolynomial(coefficients, x) // Evaluate the polynomial at x
        evaluatedPoints.push([x, y, i])
    }

    // print each value in evaluatedPoints
    // evaluatedPoints.forEach((point, index) => {
    //     console.log(`\t==============> evaluatedPoints[${index}] : ${point[0]} , \n ${point[1]}`)
    // })

    // Construct the polynomial as a string
    const polynomial = coefficients
        .map((coef, index) => {
            const degree = k - index - 1
            return `${coef} * x^${degree}`
        })
        .join(" + ")
    console.log(`\t==============> polynomial : ${polynomial}`)

    return evaluatedPoints
}

export const evaluatePolynomial = (coefficients: BigInt[], x: BigInt): BigInt => {
    return coefficients.reduce((sum, coef, index) => {
        const degree = coefficients.length - index - 1
        return sum + coef * x ** BigInt(degree)
    }, BigInt(0))
}

export const GetRandomIntInRange = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export const EncryptWithKeccak256 = (input: string): string => {
    const hash = utils.keccak256(utils.toUtf8Bytes(input))
    return hash
}

// 2. Secret Recovery