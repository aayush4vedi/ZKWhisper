require("@nomicfoundation/hardhat-toolbox");

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ||
  process.env.ALCHEMY_MAINNET_RPC_URL ||
  "https://eth-mainnet.alchemyapi.io/v2/your-api-key";
const POLYGON_MAINNET_RPC_URL =
  process.env.POLYGON_MAINNET_RPC_URL ||
  "https://polygon-mainnet.alchemyapi.io/v2/your-api-key";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
// optional
const MNEMONIC = process.env.MNEMONIC || "Your mnemonic";
const FORKING_BLOCK_NUMBER = process.env.FORKING_BLOCK_NUMBER;

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || "Your etherscan API key";
const POLYGONSCAN_API_KEY =
  process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // localhost: {
    //     chainId: 31337,
    // },
    // sepolia: {
    //     url: SEPOLIA_RPC_URL !== undefined ? SEPOLIA_RPC_URL : "",
    //     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //     //   accounts: {
    //     //     mnemonic: MNEMONIC,
    //     //   },
    //     saveDeployments: true,
    //     chainId: 11155111,
    // },
    // mainnet: {
    //     url: MAINNET_RPC_URL,
    //     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //     //   accounts: {
    //     //     mnemonic: MNEMONIC,
    //     //   },
    //     saveDeployments: true,
    //     chainId: 1,
    // },
    // polygon: {
    //     url: POLYGON_MAINNET_RPC_URL,
    //     accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    //     saveDeployments: true,
    //     chainId: 137,
    // },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.6.11",
      },
    ],
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      // npx hardhat verify --list-networks
      sepolia: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
