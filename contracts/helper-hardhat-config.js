export const developmentChains: string[] = ["hardhat", "localhost"];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

// required in 99-udpate-constants.js -> this gets updated for both '/contracts` and '/client'
export const networkMappingLocations = [
  "./constants/networkMappings.json",
  "../client/constants/networkMappings.json",
];
// this is just updated for `/client`
export const abiLocation = "../client/constants";
