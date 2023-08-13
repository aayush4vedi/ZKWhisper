const { MerkleTree } = require("merkletreejs")
const SHA256 = require("crypto-js/sha256")
const { BigNumber, ethers, utils } = require("ethers")

const leaves = ["a", "b", "c"].map((x) => SHA256(x))
const tree = new MerkleTree(leaves, SHA256)
const root = tree.getRoot().toString("hex")
const leaf = SHA256("a")
const proof = tree.getProof(leaf)
const serializedProof = JSON.stringify(proof, null, 2)

const parsedProof = JSON.parse(serializedProof, (key, value) => {
    if (typeof value === "string" && value.startsWith("0x")) {
        return BigNumber.from(value)
    }
    return value
})


console.log(`proof: ${JSON.stringify(proof)}`)

const proofJson = JSON.stringify(proof)

const transformedProof = JSON.parse(proofJson).map((item) => ({
    position: item.position,
    data: Buffer.from(item.data.data),
}))

// console.log("transformedProof: ", transformedProof)

// console.log(tree.verify(proof, leaf, root)) // true

const tree2 = new MerkleTree([], SHA256)
const verified = tree2.verify(transformedProof, leaf, root)
// console.log("verified: ", verified)


const GetRandomIntInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const GenerateLongRandomNumbers = (n) => {
    const randomBytes = ethers.utils.randomBytes(n)
    const bigNumRandomBytes = BigNumber.from(randomBytes)
    return BigInt(bigNumRandomBytes)
}

const evaluatePolynomial = (coefficients, x) => {
    return coefficients.reduce((sum, coef, index) => {
        const degree = coefficients.length - index - 1
        return sum + BigInt(coef) * BigInt(x) ** BigInt(degree)
    }, BigInt(0))
}

const CreateShamirSecretPolynomial = (k, n, s) => {
    if (k <= 0 || n <= 0) {
        throw new Error("k and n must be positive integers")
    }

    const intercept = s.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)

    console.log(`\t==============> intercept : ${intercept}`)


    const coefficients = []
    for (let i = 0; i < k; i++) {
        // const rand = GetRandomIntInRange(10, 255)
        // coefficients.push(GenerateLongRandomNumbers(rand))
        coefficients.push(BigInt(i+1))
    }

    const evaluatedPoints = []
    for (let i = 0; i < n; i++) {
        // const x = GenerateLongRandomNumbers(GetRandomIntInRange(1, 2 ** 8))
        const x = BigInt(i+1)
        const y = evaluatePolynomial(coefficients, x) 
        evaluatedPoints.push([x, y])
    }

    const polynomial = coefficients
        .map((coef, index) => {
            const degree = k - index - 1
            if (degree === 0) coef =BigInt(intercept)
            return `${coef} * x^${degree}`
        })
        .join(" + ")
    console.log(`\t==============> polynomial : ${polynomial}`)
    evaluatedPoints.map((x, i) => console.log(`\t==============> evaluatePoints : ${x[0]} ==> ${x[1]} : ${i}`))

    return evaluatedPoints
}


function lagrangePolynomial(points, evaluateX) {
    // print type of inputs
    console.log(`\t==============> typeof points : ${typeof points[0][0]}`)
    console.log(`\t==============> typeof evaluateX : ${typeof evaluateX}`)
    const n = points.length
    let result = []

    for (let i = 0; i < n; i++) {
        let term = points[i][1]
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                term *= (evaluateX - points[j][0]) / (points[i][0] - points[j][0])
            }
        }
        result.push(term)
    }

    const lagrangeValue = result.reduce((sum, term) => sum + term, BigInt(0))
    return result
}

function calculateLagrangeSum(k, n, s) {
    const points = CreateShamirSecretPolynomial(k, n, s)
    const lagrangeValues = lagrangePolynomial(points, BigInt(0)) // Pass evaluateX as BigInt(n)
    const lagrangeSum = lagrangeValues.reduce((sum, value) => sum + BigInt(value), BigInt(0))
    return lagrangeSum
}
// Example usage
const points = CreateShamirSecretPolynomial(3, 5, "secret")
const evaluateX = BigInt(0)

const result = lagrangePolynomial(points, evaluateX)
console.log(
    "Lagrange polynomial values:",
    result.map((val) => val.toString())
)



console.log("--calculateLagrangeSum : " , calculateLagrangeSum(3, 5, "secret"))