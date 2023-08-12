const { BigNumber, ethers } = require("ethers")


const GenerateRandomNumbers = (count) => {
    console.log("Generating " + count + " random numbers")
    for (let i = 0; i < count; i++) {
        console.log(BigInt(BigNumber.from(ethers.utils.randomBytes(32))))
    }
}

console.log(GenerateRandomNumbers(10))
