const { poseidonContract, mimcSpongecontract} = require("circomlibjs")

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
    // const abi = poseidonContract.generateABI(2)
    // const bytecode = poseidonContract.createCode(2)
    // let factory = await hre.ethers.getContractFactory(abi, bytecode)
    // let contract = await factory.deploy()
    // await contract.waitForDeployment()
    // console.log(`Deployed Poseidon at ${contract.target}`)

    // deploy mimc
    // const mimcAbi = mimcSpongecontract.abi
    // const mimcBytecode = mimcSpongecontract.createCode("mimc", 220)
    // let factory = await hre.ethers.getContractFactory(mimcAbi, mimcBytecode)
    // let contract = await factory.deploy()
    // await contract.waitForDeployment()
    // console.log(`Deployed MiMC at ${contract.target}`)

    // deploy self written mimc
    // let factory = await hre.ethers.getContractFactory("Hasher")
    const mimc = await hre.ethers.deployContract("Hasher")
    await mimc.waitForDeployment()
    console.log(`Deployed MiMC at ${mimc.target}`)

    // deploy MerkleTreeWithHistory
    // factory = await hre.ethers.getContractFactory("MerkleTreeWithHistory")
    // contract = await factory.deploy(contract.target)
    // await contract.waitForDeployment()
    // console.log(`Deployed MerkleTreeWithHistory at ${contract.target}`)

    // deploy verifier
    const verifier = await hre.ethers.deployContract("Verifier")
    await verifier.waitForDeployment()
    console.log(`Deployed Verifier at ${verifier.target}`)

    // deploy ZKWhisper
    // factory = await hre.ethers.getContractFactory("ZKWhisper")
    const zkwhisper = await hre.ethers.deployContract("ZKWhisper", [mimc.target, verifier.target])
    await zkwhisper.waitForDeployment()
    console.log(`Deployed ZKWhisper at ${zkwhisper.target}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
