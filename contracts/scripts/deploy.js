const { poseidonContract } = require("circomlibjs")

const hre = require("hardhat")

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000)
    const unlockTime = currentTimestampInSeconds + 60

    const lockedAmount = hre.ethers.parseEther("0.001")

    // const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
    //     value: lockedAmount,
    // })
    // await lock.waitForDeployment()

    // console.log(
    //     `Lock with ${ethers.formatEther(
    //         lockedAmount
    //     )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
    // )

    // deploy poseidon
    const abi = poseidonContract.generateABI(2)
    const bytecode = poseidonContract.createCode(2)
    let factory = await hre.ethers.getContractFactory(abi, bytecode)
    let contract = await factory.deploy()
    await contract.waitForDeployment()
    console.log(`Deployed Poseidon at ${contract.target}`)

    // deploy MerkleTreeWithHistory
    // factory = await hre.ethers.getContractFactory("MerkleTreeWithHistory")
    // contract = await factory.deploy(contract.target)
    // await contract.waitForDeployment()
    // console.log(`Deployed MerkleTreeWithHistory at ${contract.target}`)

    // deploy ZKWhisper
    factory = await hre.ethers.getContractFactory("ZKWhisper")
    const zkwhisper = await hre.ethers.deployContract("ZKWhisper", [contract.target])
    // contract = await factory.deploy(contract.target)
    await zkwhisper.waitForDeployment()
    console.log(`Deployed ZKWhisper at ${zkwhisper.target}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
